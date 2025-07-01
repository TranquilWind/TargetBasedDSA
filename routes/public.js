const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/public_progress.html'));
});

router.get('/data', async (req, res) => {
  const users = await User.find();
  const data = users.map((u) => ({
    name: u.name,
    startDate: u.startDate,
    totalSolved: u.progress.reduce((s, t) => s + t.solved, 0),
    target: u.target,
    percentage: (
      (u.progress.reduce((s, t) => s + t.solved, 0) / u.target) *
      100
    ).toFixed(2),
    totalActiveDays: u.totalActiveDays,
  }));
  res.json(data);
});

module.exports = router;
