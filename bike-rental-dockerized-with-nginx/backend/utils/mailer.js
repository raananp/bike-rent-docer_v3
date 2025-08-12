// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendVerificationEmail(to, link) {
  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Verify your email</h2>
      <p>Click the button to verify your account:</p>
      <p><a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a></p>
      <p>If the button doesn't work, copy this link:<br>${link}</p>
    </div>`;
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@yourapp.com',
    to, subject: 'Verify your email', html,
  });
}

module.exports = { sendVerificationEmail };