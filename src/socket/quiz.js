const { makeQuizCode } = require('../utils.js');
const { mongoose, Quiz } = require('../model/Quiz.js');

async function createQuiz(usernameHost, avatarId) {

  const idPlayer = new mongoose.Types.ObjectId();
  let code = null;
  let quizzes = null;
  do {
    code = makeQuizCode();
    quizzes = await existsQuiz(code);
  } while (quizzes.length != 0);

  //return all data
  const quiz = await Quiz.create({
    code: code,
    questions: [],
    players: [
      {
        user: {name: usernameHost, avatarId: avatarId},
        score: 0,
        ready: false,
        host: true,
        id: idPlayer,
      }
    ]
  });

  return quiz;
}

async function existsQuiz(code) {
  return await Quiz.find({ code: code });
}

async function joinQuiz(code, username, avatarId) {

  const idUser = new mongoose.Types.ObjectId();
  let quiz = await Quiz.findOneAndUpdate(
    { code: code },
    {
      $push: {
        players: {user: {name: username, avatarId: avatarId}, score: 0, ready: false, host: false, id: idUser}
      }
    },
    {new : true}
  ).exec();

  return {players : quiz.players, idUser : idUser}
}

async function userReady(idUser, value) {
  return await Quiz.findOneAndUpdate(
    { 'players.id': new mongoose.Types.ObjectId(idUser) },
    {
      $set: {
        'players.$.ready': value
      }
    },
    {new : true}
  ).exec();
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

module.exports = { createQuiz, joinQuiz, userReady};