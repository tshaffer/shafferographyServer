/*
import express from 'express';
import cors from 'cors';
import connectDB from './config/db';

import passport from 'passport';
import { auth } from './auth/auth';

import { readConfig } from './config';

const bodyParser = require('body-parser');

import { Routes } from './routes/routes';

class App {

  public app: express.Application;
  public route: Routes = new Routes();

  constructor() {

    try {
      readConfig('/Users/tedshaffer/Documents/Projects/shafferography/shafferographyServer/src/config/config.env');
    } catch (err: any) {
      console.log('readConfig error');
    }

    console.log('mongo environment variable: ', process.env.MONGO_URI);

    connectDB();

    this.app = express();
    this.config();

    this.app.use(express.static('public'))
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    this.route.routes(this.app);

    // Set up OAuth 2.0 authentication through the passport.js library.
    auth(passport);

    // Set up passport and session handling.
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    const scopes: string[] = [
      'https://www.googleapis.com/auth/photoslibrary.readonly',
      'profile',
    ];
  
    this.app.get('/auth/google', passport.authenticate('google', {
      scope: scopes,
      failureFlash: true,  // Display errors to the user.
      session: true,
    }));
    
    this.app.get(
      '/auth/google/callback',
      passport.authenticate(
          'google', {failureRedirect: '/', failureFlash: true, session: true}),
      (req, res) => {
        // User has logged in.
        console.log('User has logged in.');
        // logger.info('User has logged in.');
        // req.session.save(() => {
        //   res.redirect('/');
        // });
      });
  
  
  }

  private config(): void {
    let port: any = process.env.PORT;
    if (port === undefined || port === null || port === '') {
      port = 8080;
    }
    this.app.set('port', port);
  }
}

export default new App().app;
*/
