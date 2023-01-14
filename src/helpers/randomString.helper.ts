const randomString = function(len: number) {
  let charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for(let i=0; i<len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.charAt(randomPoz);
  }
  return randomString;
};

export default randomString;
