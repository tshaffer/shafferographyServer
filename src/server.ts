import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import session from 'express-session';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

// Types
interface User {
  profile: Profile;
  accessToken: string;
  refreshToken: string;
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

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
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
  })
);

// OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    const user = req.user as User;

    // Extract access token and expiration details
    const accessToken = user.accessToken;
    const refreshToken = user.refreshToken; // Optional, if available
    const expiresIn = 3600; // Google access tokens are valid for 1 hour (3600 seconds)

    // Redirect to the frontend with token information as query parameters
    const queryParams = new URLSearchParams({
      accessToken,
      expiresIn: expiresIn.toString(),
      refreshToken: refreshToken || '', // Optional
    }).toString();

    res.redirect(`/?${queryParams}`);
  }
);

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
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
