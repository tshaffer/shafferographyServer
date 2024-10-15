import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser'; // To parse cookies
import dotenv from 'dotenv';
import User from './models/User'; // User model
import { encrypt } from './utils/encryption'; // Encryption utilities

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myDatabase';

// === Middleware Setup ===
app.use(cookieParser()); // Parse cookies for access token handling
app.use(express.json()); // Parse incoming JSON requests

// === Mongoose Setup ===
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000, // 10-second timeout
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to the database.');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

// === Express Session Setup ===
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// === Passport Setup ===
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        console.log('AccessToken:', accessToken);
        console.log('RefreshToken:', refreshToken);

        // Encrypt the refresh token before storing it
        const encryptedRefreshToken = encrypt(refreshToken);

        // Find or create the user in the database
        const user = await User.findOneAndUpdate(
          { googleId: profile.id },
          { email: profile.emails[0].value, refreshToken: encryptedRefreshToken },
          { upsert: true, new: true }
        );

        // Attach the access token temporarily to the user object
        const userWithToken = {
          ...user.toObject(),
          accessToken,
        };

        return done(null, userWithToken);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user for session handling
passport.serializeUser((user: any, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId: string, done) => {
  try {
    const user = await User.findOne({ googleId });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// === Routes ===

// OAuth Login Route
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
    accessType: 'offline', // Request refresh token
    prompt: 'consent', // Force consent to get refresh token each time
  })
);

// OAuth Callback Route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req: Request, res: Response) => {
    try {
      const { googleId, email, accessToken } = req.user as any;

      if (!googleId || !email) {
        throw new Error('Missing user information from OAuth response');
      }

      const expiresIn = 3600; // Token expiration in seconds

      // Store access token in an HTTP-only cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: expiresIn * 1000, // 1 hour in milliseconds
      });

      // Redirect user back to the client
      res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  }
);

// Endpoint to Retrieve Access Token from Cookie
app.get('/auth/token', (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token not found' });
  }

  res.json({ accessToken });
});

// Logout Route
app.get('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }

    // Clear the access token cookie
    res.clearCookie('accessToken');
    res.redirect('/');
  });
});

// Protected Route Example
app.get('/profile', ensureAuthenticated, (req: Request, res: Response) => {
  const user = req.user as any;
  res.json({ email: user.email, googleId: user.googleId });
});

// Middleware to Ensure User is Authenticated
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
