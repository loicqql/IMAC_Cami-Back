const config = require('./config.json');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*"
  }
})

// main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(`mongodb+srv://${config['mongodb-user']}:${config['mongodb-password']}@${config['mongodb-host']}/${config['mongodb-database']}?retryWrites=true&w=majority`);

  const kittySchema = new mongoose.Schema({
    name: String
  });
  const Kitten = mongoose.model('Kitten', kittySchema);
  const silence = new Kitten({ name: 'Silence' });
  await silence.save();
}

const templateData = {
  'roomId' : null,
  'isHost' : null
}

io.on('connection', async socket => {

  const te = {
    name: 'Los Angeles',
    state: 'CA',
    country: 'USA'
  };

  let data = templateData;

  socket.on('create', () => {

    createQuiz()

    /*data.roomId = makeid(5);
    console.log(data.roomId);
    data.isHost = true;
    socket.join(data.roomId);
    */
  });

  socket.on('join', (id) => {
    data.roomId = id;
    data.isHost = false;
    socket.join(id);
  });

  socket.on('test', (idRoom) => {
    io.to(idRoom).emit('test', 'ff');
  });

});

http.listen(5000, () => {
  console.log('listening on *:' + 5000);
});

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

async function createQuiz(genreId) {
  console.log('---');
  let quiz = [];

  let genres = await axios(preReq('/genre/movie/list'));

  if(!genres.data.genres)
    return false;

  let i = 0;
  let max = 10;
  do {
    let genre = getRandomInArray(genres.data.genres);
    let movies = await axios(preReq('/discover/movie', genre.id));

    if(!movies.data.results)
      return false;

    let movie = getRandomInArray(movies.data.results);

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

  console.log("che1");

  for (let i = 0; i < quiz.length; i++) {
    let answers = [];
    let res = await axios(preReq(`/movie/${quiz[i].id}/similar`));
    res = res.data.results;

    if (res.length > 3) {
      let similarMovies = res.filter(e => e.vote_average > 5);
      if (similarMovies.length < 3) {
        similarMovies = res;
      }

      for (let i = 0; i < 3; i++) {
        answers.push(similarMovies[i].title);
      }

      quiz[i].answers = answers;
    }
  }

  console.log(quiz);
}

function preReq(req, genreId = false) {
  let base = config['api-base_url'] + req + '?api_key=' + config['api-token'] + '&language=fr-FR'
  return base.concat(genreId != false ? '&with_genres=' + genreId + '&vote_average.gte=8' : '');
}

function getRandomInArray(array) {
  return array[getRandomInt(array.length)];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}