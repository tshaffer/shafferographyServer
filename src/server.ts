import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser'; // Parse cookies
import dotenv from 'dotenv';
import User from './models/User'; // User model
import { encrypt, decrypt } from './utils/encryption'; // Encryption utilities

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myDatabase';

// === Middleware Setup ===
app.use(cookieParser());
app.use(express.json()); // Parse JSON requests

// === Mongoose Setup ===
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
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
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
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

        const encryptedRefreshToken = encrypt(refreshToken);

        const user = await User.findOneAndUpdate(
          { googleId: profile.id },
          { email: profile.emails[0].value, refreshToken: encryptedRefreshToken },
          { upsert: true, new: true }
        );

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
    accessType: 'offline',
    prompt: 'consent',
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

      const expiresIn = 3600;

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn * 1000,
      });

      res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  }
);

// Access Token Retrieval Route
app.get('/auth/token', (req: Request, res: Response) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'Access token not found' });
  }

  res.json({ accessToken });
});

// Refresh Token Endpoint
app.post('/refresh-token', async (req: Request, res: Response) => {
  const { googleId } = req.body;

  try {
    const user = await User.findOne({ googleId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const decryptedRefreshToken = decrypt(user.refreshToken);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: decryptedRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error_description);

    res.json({ accessToken: data.access_token, expiresIn: data.expires_in });
  } catch (error) {
    console.error('Failed to refresh token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Logout Route
app.get('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).send('Logout failed');
    }

    res.clearCookie('accessToken');
    res.redirect('/');
  });
});

// Protected Route Example
app.get('/profile', ensureAuthenticated, (req: Request, res: Response) => {
  const user = req.user as any;
  res.json({ email: user.email, googleId: user.googleId });
});

// Authentication Middleware
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
