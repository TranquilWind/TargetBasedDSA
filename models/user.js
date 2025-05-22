const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const topicList = [
  'Basics', 'Sorting', 'Arrays', 'Strings', 'Binary Search', 'LinkedList', 'Stack','Queue',
  'Recursion', 'Bit Manipulation', 'Sliding Window & Two Pointer',
  'Greedy Algorithm', 'Binary Trees', 'Graphs', 'Dynamic Programming',
  'Tries', 'Heaps', 'Math', 'Stack', 'Queue'
];

const progressSchema = new mongoose.Schema({
  topic: String,
  solved: { type: Number, default: 0 }
});

const logSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  entries: [String]
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  startDate: Date,
  target: Number,
  progress: [progressSchema],
  logs: [logSchema],
  totalActiveDays: { type: Number, default: 0 },
  lastUpdate: { type: Date, default: null }
});

userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.progress = topicList.map(t => ({ topic: t }));
  }
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);