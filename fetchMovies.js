const axios = require('axios');
const fs = require('fs');
const config = require('./config.json');

main().catch(err => console.log(err));

async function main() {

  let data = [];

  for (let i = 1; i < 15; i++) {
    let res = await axios(preReq('/movie/top_rated', i));
    res = res.data.results.filter(movie => movie.popularity > 30);

    let movies = [];
    res.forEach(movie => {
      movies.push({
        id: movie.id,
        title: movie.title,
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
      });
    });
    data = data.concat(movies);
  }

  console.log(data.length + ' movies');

  fs.writeFileSync("movies.json", JSON.stringify({'movies': data}));
  
}

function preReq(req, page) {
  let base = config['api-base_url'] + req + '?api_key=' + config['api-token'] + '&language=fr-FR'
  return base.concat('&page=' + page);
}