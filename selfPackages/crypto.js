const crypto = require('crypto');

module.exports.encryptPassword = (password, key) => {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

module.exports.generateToken = (token_length = 64) => {
    return crypto.randomBytes(token_length/2).toString('hex');
}

module.exports.generateUniqueName= (unique = 32) => {
  return crypto.randomBytes(unique/2).toString('hex');
}
