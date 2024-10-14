import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import session from 'express-session';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Server } from 'http';
import { createRoutes } from './routes';
import { decrypt, encrypt } from './utilities/crypto';
import { getUserFromDb, updateUserInDb } from './controllers';
import { User } from './types';

dotenv.config(); // Load environment variables

connectDB();

// Types
interface OAuthUser {
  profile: Profile;
  accessToken: string;
  refreshToken: string;
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// add routes
createRoutes(app);

// Configure Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        // Encrypt the refresh token before storing it in the database
        const encryptedRefreshToken = encrypt(refreshToken);

        // Find the user by Google ID and update or create the record
        updateUserInDb(profile.id,
          { email: profile.emails[0].value, refreshToken: encryptedRefreshToken },
        );

        const user: User = {
          googleId: profile.id,
          email: profile.emails[0].value,
          refreshToken: encryptedRefreshToken
        };

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize and deserialize user
passport.serializeUser((user: any, done) => {
  done(null, user.googleId);
});

passport.deserializeUser(async (googleId: string, done) => {
  try {
    const user: User = await getUserFromDb(googleId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Serve static files from the /public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve the SPA on the root route (index.html)
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// OAuth login route
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
    accessType: 'offline', // Request refresh token
    prompt: 'consent', // Force consent to get the refresh token on first login
  })
);

// OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req: Request, res: Response) => {
    try {
      // Use the structure of req.user directly (no profile field)
      const { googleId, email, accessToken, refreshToken } = req.user as any;

      if (!googleId || !email) {
        throw new Error('Missing user information from OAuth response');
      }

      if (refreshToken) {
        // Encrypt the refresh token before storing it
        const encryptedRefreshToken = encrypt(refreshToken);

        // Upsert the user in the database (create if not exists, update otherwise)
        updateUserInDb(googleId, {
          googleId,
          email,
          refreshToken: encryptedRefreshToken
        });
      } else {
        console.warn('No refresh token received. Ensure accessType: "offline" is set.');
      }

      const expiresIn = 3600; // Token expiration (1 hour)

      // Redirect the user back to the client with access token and googleId
      const queryParams = new URLSearchParams({
        accessToken,
        expiresIn: expiresIn.toString(),
        googleId,
      }).toString();

      res.redirect(`/?${queryParams}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  }
);

// Refresh Token Endpoint
app.post('/refresh-token', async (req: Request, res: Response) => {
  const { googleId } = req.body;

  try {
    // Retrieve and decrypt the refresh token from the database
    const user = await getUserFromDb(googleId);
    if (!user) {
      res.status(404).send('User not found');
      return;
    }
    const decryptedRefreshToken = decrypt(user.refreshToken);

    // Use the refresh token to get a new access token from Google
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
    res.redirect('/');
  });
});

// Middleware to ensure user is authenticated
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
