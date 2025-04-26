const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/daily_logs.html'));
});

router.get('/data', async (req, res) => {
  const users = await User.find();
  const groupedByDate = {};
  
  users.forEach(user => {
    user.logs.forEach(log => {
      const date = log.date.toISOString().split('T')[0];
      
      // Initialize date entry if it doesn't exist
      if (!groupedByDate[date]) {
        groupedByDate[date] = {};
      }
      
      // Initialize user entry for this date if it doesn't exist
      if (!groupedByDate[date][user.name]) {
        groupedByDate[date][user.name] = [];
      }
      
      // Add all entries for this user on this date
      log.entries.forEach(entry => {
        groupedByDate[date][user.name].push(entry);
      });
    });
  });
  
  res.json(groupedByDate);
});

module.exports = router;