const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');

router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
});

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = new User({ email, password });
    await user.save();
    req.session.userId = user._id;
    console.log('User signed up:', user.email);
    res.redirect('/profile_setup');
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.send('Invalid credentials');
  }
  req.session.userId = user._id;
  res.redirect('/user');
});

router.get('/profile_setup', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile_setup.html'));
});

router.post('/profile_setup', async (req, res) => {
  const { name, startDate, target } = req.body;
  const user = await User.findById(req.session.userId);
  user.name = name;
  user.startDate = new Date(startDate);
  user.target = parseInt(target);
  // Initialize first active day
  user.totalActiveDays = 1;
  user.lastUpdate = new Date();
  await user.save();
  res.redirect('/user');
});

router.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/user_page.html'));
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;