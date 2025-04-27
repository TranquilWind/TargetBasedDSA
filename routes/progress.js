const express = require('express');
const router = express.Router();
const User = require('../models/user');

function isAuth(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/login');
}

router.get('/current', isAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const totalSolved = user.progress.reduce((sum, t) => sum + t.solved, 0);
  res.json({
    name: user.name,
    startDate: user.startDate,
    target: user.target,
    progress: user.progress,
    logs: user.logs,
    totalSolved,
    totalActiveDays: user.totalActiveDays
  });
});

router.post('/save', isAuth, async (req, res) => {
  const { progress } = req.body;
  const user = await User.findById(req.session.userId);
  let entries = [];
  progress.forEach(p => {
    const tp = user.progress.find(x => x.topic === p.topic);
    const diff = p.solved - tp.solved;
    if (diff > 0) {
      entries.push(`solved ${diff} question(s) in ${p.topic}.`);
      tp.solved = p.solved;
    }
  });
  
  if (entries.length) user.logs.push({ date: new Date(), entries });
  await user.save();

  let x = [];
  for (let i = user.logs.length - entries.length; i < user.logs.length; i++) {
    console.log('log', user.logs[i], 'i', i, 'all', user.logs.length, 'entries', entries.length);
    const log = user.logs[i];
    if (log.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
      x.push(log);
    }
  }
  res.json({ progress: user.progress, logs: x });
});

router.post('/update-logs', isAuth, async (req, res) => {
  const { logs: edited } = req.body;
  console.log(edited.l)

  const user = await User.findById(req.session.userId);
  // Increment active days once per day
  const today = new Date().toISOString().split('T')[0];
  const last = user.lastUpdate ? user.lastUpdate.toISOString().split('T')[0] : null;
  if (last !== today) {
    user.totalActiveDays += 1;
    user.lastUpdate = new Date();
  }
  // user.logs = edited.map(l => ({ date: new Date(l.date || Date.now()), entries: l.entries }));
  await user.save();
  res.json({ success: true, totalActiveDays: user.totalActiveDays });
});

router.post('/reset', isAuth, async (req, res) => {
  await User.findByIdAndDelete(req.session.userId);
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;