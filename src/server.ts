import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser'; // Parse cookies
import dotenv from 'dotenv';
import { User, UserWithToken } from './types';
import { decrypt, encrypt } from './utilities/crypto';
import { createRoutes } from './routes';
import { getUserFromDb, updateUserInDb } from './controllers';
import path from 'path';
import { Server } from 'http';
import connectDB from './config/db';

const passportAuthenticateCallback = () => {
  console.log('passportAuthenticateCallback');
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
    accessType: 'offline',
    prompt: 'consent',
  });
};

dotenv.config(); // Load environment variables

connectDB();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// add routes
createRoutes(app);

// === Middleware Setup ===
app.use(cookieParser());
app.use(express.json()); // Parse JSON requests

// === Express Session Setup ===
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
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
        console.log('passport.use callback');
        console.log('AccessToken:', accessToken);
        console.log('RefreshToken:', refreshToken);

        const encryptedRefreshToken = encrypt(refreshToken);

        updateUserInDb(profile.id,
          { email: profile.emails[0].value, refreshToken: encryptedRefreshToken },
        );

        const userWithToken: UserWithToken = {
          googleId: profile.id,
          email: profile.emails[0].value,
          refreshToken: encryptedRefreshToken,
          accessToken,
        }

        return done(null, userWithToken);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  console.log('passport.serializeUser');
  console.log('user.googleId:', user.googleId);
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId: string, done) => {
  console.log('passport.deserializeUser');
  console.log('googleId:', googleId);
  try {
    const user: User = await getUserFromDb(googleId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// === Routes ===

// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve the SPA on the root route (index.html)
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

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

      console.log('/auth/google/callback');

      const { googleId, email, accessToken } = req.user as any;

      console.log('googleId:', googleId);
      console.log('email:', email);
      console.log('accessToken:', accessToken);

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

  console.log('/auth/token handler');
  console.log('req.cookies:', req.cookies);
  console.log('req.cookies.accessToken:', req.cookies.accessToken);

  const accessToken = req.cookies.accessToken;

  console.log('user:', req.user);
  console.log('user.googleId:', (req.user as any)?.googleId);

  console.log('verify no exceptions thrown');
  
  const user = req.user as any; // Retrieve the user from the session (assuming it's set)

  if (!accessToken || !user) {
    res.status(401).json({ error: 'Access token or user not found' });
    return;
  }

  res.json({ accessToken, googleId: user.googleId });
});

// Refresh Token Endpoint
app.post('/refresh-token', async (req: Request, res: Response) => {
  const { googleId } = req.body;

  try {
    const user = await getUserFromDb(googleId);
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

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

// Start the server
const server: Server<any> = app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err: any, promise: any) => {
  console.log(`Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});
