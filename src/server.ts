import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import session from 'express-session';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import path from 'path';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { Server } from 'http';
import { createRoutes } from './routes';
import User from './models/User';
import { decrypt, encrypt } from './utilities/crypto';

dotenv.config(); // Load environment variables

connectDB();

// Types
interface User {
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
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      const user: User = { profile, accessToken, refreshToken };
      return done(null, user);
    }
  )
);

// Serialize and deserialize user to/from session
passport.serializeUser((user: User, done) => {
  done(null, user);
});
passport.deserializeUser((user: User, done) => {
  done(null, user);
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
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/photoslibrary.readonly',
    ],
    accessType: 'offline', // Request refresh token
    prompt: 'consent', // Force prompt to ensure refresh token is provided
  })
);

// OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req: Request, res: Response) => {
    const user = req.user as any; // Assuming user contains Google profile data

    // Encrypt the refresh token before storing
    const encryptedRefreshToken = encrypt(user.refreshToken);

    // Check if the user already exists in the database
    let existingUser = await User.findOne({ googleId: user.profile.id });

    if (existingUser) {
      // Update the refresh token if the user already exists
      existingUser.refreshToken = encryptedRefreshToken;
      await existingUser.save();
    } else {
      // Create a new user record
      const newUser = new User({
        googleId: user.profile.id,
        email: user.profile.emails[0].value,
        refreshToken: encryptedRefreshToken,
      });
      await newUser.save();
    }

    // Redirect to the client with a success message
    res.redirect('/');
  }
);


app.post('/refresh-token', async (req: Request, res: Response) => {
  const { googleId } = req.body;

  try {
    // Find the user in the database
    const user = await User.findOne({ googleId });
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    // Decrypt the refresh token
    const decryptedRefreshToken = decrypt(user.refreshToken);

    // Use the refresh token to get a new access token
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
    console.error('Error refreshing token:', error);
    res.status(500).send('Failed to refresh token');
  }
});

/*
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    const user = req.user as User;

    const accessToken = user.accessToken;
    const refreshToken = user.refreshToken; // Save refresh token (optional)
    const expiresIn = 3600; // Token validity (1 hour)

    const queryParams = new URLSearchParams({
      accessToken,
      refreshToken: refreshToken || '',
      expiresIn: expiresIn.toString(),
    }).toString();

    // Redirect to client with token details
    res.redirect(`/?${queryParams}`);
  }
);

app.post('/refresh-token', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description);
    }

    res.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    console.error('Failed to refresh token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});
*/

// Logout route
app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
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
