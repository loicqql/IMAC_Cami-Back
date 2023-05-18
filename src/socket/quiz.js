const { makeQuizCode, getRandomInt } = require('../utils.js');
const { mongoose, Quiz } = require('../model/Quiz.js');
const listMovies = require('../../movies.json');

async function createQuiz(data) { // { nbQuestions: X, filterGenres: [...] }

  let code = null;
  let quizzes = null;
  do {
    code = makeQuizCode();
    quizzes = await findQuiz(code);
  } while (quizzes.length != 0);

  let ids = [];
  while (ids.length < data.nbQuestions) {
    let r = getRandomInt(listMovies.movies.length);
    if (ids.indexOf(r) === -1) ids.push(r);
  }

  let questions = [];
  let answers = [];

  ids.forEach(id => {
    questions.push({ value: listMovies.movies[id].backdrop_path, startAt: false });
    answers.push({ value: listMovies.movies[id].id, title: listMovies.movies[id].title, userAnswers: [] });
  });

  //return all data
  const quiz = await Quiz.create({
    code: code,
    questions: questions,
    answers: answers,
    players: []
  });

  return quiz;
}

async function findQuiz(code) {
  return await Quiz.find({ code: code });
}

async function joinQuiz(code, username, avatarId, host) {

  const idUser = new mongoose.Types.ObjectId();
  let quiz = await Quiz.findOneAndUpdate(
    { code: code },
    {
      $push: {
        players: { user: { name: username, avatarId: avatarId }, score: 0, ready: false, host: host, id: idUser }
      }
    },
    { new: true }
  ).exec();

  if (!quiz) {
    return null;
  }

  return { players: quiz.players, idUser: idUser }
}

async function userReady(idUser, value) {
  return await Quiz.findOneAndUpdate(
    { 'players.id': new mongoose.Types.ObjectId(idUser) },
    {
      $set: {
        'players.$.ready': value
      }
    },
    { new: true }
  ).exec();
}

async function startQuestion(code, questionNumber) {
  let field = `questions.${questionNumber}.startAt`;
  return await Quiz.findOneAndUpdate(
    { code: code },
    {
      $set: {
        [field]: new Date(),
      }
    },
    { new: true }
  ).exec();
}

async function checkAnswer(code, questionNumber, answer, idUser) { // TO DO
  let quiz = await findQuiz(code);
  if (quiz[0].answers[questionNumber].userAnswers.find(id => id == new mongoose.Types.ObjectId(idUser))) { // prevent double response
    return false;
  }
  if (answer == quiz[0].answers[questionNumber].value) {
    return true;
  }
  return false;
}

async function addScore(code, questionNumber, idUser) {
  let quiz = await findQuiz(code);
  let score = calculateScore(quiz[0].questions[questionNumber].startAt);
  quiz = await Quiz.findOneAndUpdate(
    { 'players.id': new mongoose.Types.ObjectId(idUser) },
    {
      $inc: {
        'players.$.score': score
      }
    },
    { new: true }
  ).exec();
  let username = quiz.players.filter(player => player.id == idUser)[0].user.name;
  return { score: quiz.players, notification: `${username} vient de trouver la réponse` }
}

function calculateScore(timestampQuestion) {
  let dateQuestion = new Date(timestampQuestion);
  let delta = (Date.now() - dateQuestion.valueOf()) / 1000;
  if (dateQuestion == false) {
    console.error("error: timestampQuestion == false");
    return 0;
  }
  if (delta < 0) {
    console.error("error: delta < 0");
    return 0;
  }
  return Math.floor(500 - delta * 25) > 0 ? Math.floor(500 - delta * 25) : 0; // 30 sec
}

async function saveAnswer(code, questionNumber, idUser) {
  let field = `answers.${questionNumber}.userAnswers`;
  let quiz = await Quiz.findOneAndUpdate(
    { code: code },
    {
      $addToSet: {
        [field]: new mongoose.Types.ObjectId(idUser),
      }
    },
    { new: true }
  ).exec();

  return quiz.players.length == quiz.answers[0].userAnswers.length;
}

/*
 
async function odl() {
  let movies = listMovies.movies;
 
  let quiz = [];
 
  if(movies.length <= 0)
    return false;
 
  let i = 0;
  let max = 10;
  do {
    let movie = getRandomInArray(movies);
 
    let picked = false;
    quiz.forEach(el => {
      if(el.id === movie.id) {
        picked = true;
      }
    });
 
    if(!picked) {
      quiz.push({
        id: movie.id,
        backdrop_path: movie.backdrop_path,
        title: movie.title
      });
      i++;
    }
    
  } while (i < max);
  
}
 
*/

module.exports = { createQuiz, joinQuiz, userReady, findQuiz, startQuestion, checkAnswer, addScore, saveAnswer };