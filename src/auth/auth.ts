
import passport from 'passport';
import {Strategy as GoogleOAuthStrategy, StrategyOptions} from 'passport-google-oauth20';

const CREDENTIALS = require('../../secrets/credentials.json').web;

export const auth = (passport: passport.PassportStatic) => {
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
  const strategyOptions: StrategyOptions = {
    clientID: CREDENTIALS.client_id,
    clientSecret: CREDENTIALS.client_secret,
    callbackURL: CREDENTIALS.redirect_uris[0]
  };
  console.log('strategyOptions: ', strategyOptions);
  passport.use(new GoogleOAuthStrategy(
      {
        clientID: CREDENTIALS.client_id,
        clientSecret: CREDENTIALS.client_secret,
        callbackURL: CREDENTIALS.redirect_uris[0]
      },
      (token, refreshToken, profile, done) => done(null, {profile, token})));
};
