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
const { createQuiz, joinQuiz, userReady } = require('./socket/quiz.js');


// INIT DATABASE
async function main() {
  await mongoose.connect(`mongodb+srv://${config['mongodb-user']}:${config['mongodb-password']}@${config['mongodb-host']}/${config['mongodb-database']}?retryWrites=true&w=majority`);
}
main().catch(err => console.log(err));



//SOCKET

io.on('connection', async socket => {

  socket.on('create', async (data, callback) => { // {username: XXX, avatarId: X}
    if(data.username) {
      callback(await createQuiz(data.username, data.avatarId));
    }else {
      callback(false);
    }
  });

  socket.on('join', async (data, callback) => { // {code: XXX, username: XXX, avatarId: X}

    let playersAndUserId = await joinQuiz(data.code, data.username, data.avatarId);
    if(playersAndUserId.players) {
      socket.join(data.code);
      callback(playersAndUserId);
    }else {
      callback(false);
    }
    io.to(data.code).emit('updateLobby', playersAndUserId.players);
  });

  socket.on('ready', async (data) => { // {code: XXX, idUser: XXX, value: true | false}
    let quiz = await userReady(data.idUser, data.value);
    if(quiz.players)  {
      io.to(data.code).emit('updateLobby', quiz.players);
    }
  });

});


//API

app.get('/movies', (req, res) => {
  res.send(listMovies);
})

http.listen(5000, () => {
  console.log('listening on *:' + 5000);
});