import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import session from 'express-session';
import { Profile, Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
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
const PORT = process.env.PORT || 8080; // Use port 8080

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

// Google OAuth Strategy configuration
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

// Serialize user into session
passport.serializeUser((user: User, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: User, done) => {
  done(null, user);
});

// === Routes Configuration ===

// Root route (http://localhost:8080/)
app.get('/', (req: Request, res: Response) => {
  res.send('<h1>Welcome to the Express Server!</h1><p>Try <a href="/auth/google">logging in with Google</a>.</p>');
});

// Google OAuth login route
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/photoslibrary.readonly'],
  })
);

// Google OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    const user = req.user as User;
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?accessToken=${user.accessToken}`);
  }
);

// Logout route
app.get('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Protected route (for authenticated users only)
app.get('/profile', ensureAuthenticated, (req: Request, res: Response) => {
  const user = req.user as User;
  res.json({ profile: user.profile, accessToken: user.accessToken });
});

// Middleware to ensure authentication
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
