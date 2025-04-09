require('dotenv').config(); // Load environment variables

const express = require('express');
const axios = require('axios');
const router = express.Router();

const DB_Op = require('../SQL/dbOperator');
const Repo = require('../SQL/Repository');
const db_op = new DB_Op(process.env.DATABASE_FILE_PATH);
const repo = new Repo(db_op);

function renderTemplate(res, templateName, session, cookieConsent) {
  const loggedIn = !!session.userid;
  res.render(templateName, { UserLoggedIn: loggedIn, CookieConsent: cookieConsent });
}

router.get('/about', (req, res) => {
  renderTemplate(res, 'About', req.session, req.cookies.cookie_consent);
});

router.get('/contact', (req, res) => {
  renderTemplate(res, 'Contact', req.session, req.cookies.cookie_consent);
});

router.get('/login', (req, res) => {
  const loggedIn = !!req.session.userid;
  if (loggedIn) {
    renderTemplate(res, 'Home', req.session, req.cookies.cookie_consent);
  } else {
    res.render('Login')
  }
});

router.get('/register', (req, res) => {
  renderTemplate(res, 'Register', req.session, req.cookies.cookie_consent);
});

router.get('/logout', (req, res) => {
  req.session.destroy(); //log out user by deleting the existing session
  res.redirect('/');
});

module.exports = router;