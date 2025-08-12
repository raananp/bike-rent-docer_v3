const { authenticator } = require('otplib');

function generateMfaSecret() {
  return authenticator.generateSecret();
}

function generateMfaToken(secret) {
  return authenticator.generate(secret);
}

function verifyMfaToken(token, secret) {
  return authenticator.verify({ token, secret });
}

module.exports = { generateMfaSecret, generateMfaToken, verifyMfaToken };