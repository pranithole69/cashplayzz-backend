const nodemailer = require('nodemailer');

const sendEmail = async (subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
