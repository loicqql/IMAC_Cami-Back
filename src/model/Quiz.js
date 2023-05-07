const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  code: Number,
  questions: Array,
  players: Array,
  createdAt: { type: Date, default: Date.now }
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = { mongoose, Quiz }