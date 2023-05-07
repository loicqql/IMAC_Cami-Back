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

function makeQuizCode() {
  return getRandomInt(8999) + 1000;
}

function getRandomInArray(array) {
  return array[getRandomInt(array.length)];
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

module.exports = { makeid, makeQuizCode, getRandomInArray, getRandomInt }