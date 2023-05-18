const config = require('../config.json');
const listMovies = require('../movies.json');
const mongoose = require('mongoose');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*"
  }
});

// const {} = require('./api/api.js');
const { createQuiz, joinQuiz, userReady, findQuiz, startQuestion, checkAnswer, addScore, saveAnswer } = require('./socket/quiz.js');


// INIT DATABASE
async function main() {
  await mongoose.connect(`mongodb+srv://${config['mongodb-user']}:${config['mongodb-password']}@${config['mongodb-host']}/${config['mongodb-database']}?retryWrites=true&w=majority`);
}
main().catch(err => console.log(err));



//SOCKET

io.on('connection', async socket => {

  socket.on('create', async (data, callback) => { // { nbQuestions: X, filterGenres: [...] }
    let res = await createQuiz(data);
    callback(res.code)
  });

  socket.on('joinRoom', (code) => {
    socket.join(code);
  })

  socket.on('join', async (data, callback) => { // {code: XXX, username: XXX, avatarId: X, host: true | false}

    let playersAndUserId = await joinQuiz(data.code, data.username, data.avatarId, data.host);
    if (playersAndUserId) {
      socket.join(data.code);
      callback(playersAndUserId);
      io.to(data.code).emit('updateLobby', playersAndUserId.players);
    } else {
      callback(false);
    }
  });

  socket.on('ready', async (data) => { // {code: XXX, idUser: XXX, value: true | false}
    let quiz = await userReady(data.idUser, data.value);
    if (quiz.players) {
      io.to(data.code).emit('updateLobby', quiz.players);
    }

    if (quiz.players.filter(player => !player.ready) == 0) { // game start
      let count = 5;
      let interId = setInterval(() => {
        io.to(data.code).emit('startQuiz', count);
        if (count <= 0) {
          clearInterval(interId);
        }
        count--;
      }, 1000);
    }
  });

  socket.on('startQuestion', async (data) => { // {code: XXX, questionNumber: X}
    let res = await startQuestion(data.code, data.questionNumber);
    if (res.questions) {
      io.to(data.code).emit('question', { question: res.questions[data.questionNumber], questionNumber: data.questionNumber, numberOfQuestions: res.questions.length });
      io.to(data.code).emit('updateScore', res.players);
    } else {
      console.error('error : start question ' + data.questionNumber + ' / ' + data.code);
    }
  });

  async function endQuestion(code, questionNumber) {
    let res = await findQuiz(code);
    if (!res[0].players) {
      console.error("endquestion " + code);
    }
    io.to(code).emit('updateScore', res[0].players);
    io.to(code).emit('answer', res[0].answers[questionNumber].title);

    //check bonus + 200pts
  }

  socket.on('answerQuestion', async (data, callback) => { // {code: XXX, questionNumber: X, answer: XXX, idUser: XX}
    let res = await checkAnswer(data.code, data.questionNumber, data.answer, data.idUser);
    if (!res) {
      callback(false);
    }
    res = await addScore(data.code, data.questionNumber, data.idUser); // {score: Object, notification: X}
    io.to(data.code).emit('updateScore', res.score);
    io.to(data.code).emit('notification', res.notification);
    callback(true);

    if (await saveAnswer(data.code, data.questionNumber, data.idUser)) { // true if everyone has answer 
      endQuestion(data.code, data.questionNumber);
    };
  })

  socket.on('endQuestion', async (data) => { // {code: XXX, questionNumber: X}
    endQuestion(data.code, data.questionNumber);
  })

  socket.on('clear', async (data) => { // {code: XXX}
    io.to(data.code).emit('clear', '');
  })

  socket.on('startLeaderBoard', async (data) => { // {code: XXX}
    io.to(data.code).emit('startLeaderBoard', '');
  })

  socket.on('sendFinalScore', async (data) => { // {code: XXX}
    let res = await findQuiz(data.code);
    if (res[0].players) {
      io.to(data.code).emit('finalScore', res[0].players);
    } else {
      console.error('error : send final score ' + ' / ' + data.code);
    }

  })

});


//API

app.get('/movies', (req, res) => {
  res.send(listMovies);
})

http.listen(5000, () => {
  console.log('listening on *:' + 5000);
});