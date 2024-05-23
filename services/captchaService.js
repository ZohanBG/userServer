const Canvas = require('canvas');
const dbService = require('./databaseService');
const dotenv = require('dotenv');

dotenv.config();

const generateCaptcha = () => {
    let captcha = '';
    for (let i = 0; i < process.env.CAPTCHA_LENGTH; i++) {
        captcha += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
    return captcha;
};

const getCaptchaImage = (captchaText) => {
    const canvas = Canvas.createCanvas(150, 50);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '30px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
};

const createCaptcha = (captchaText) => {
    return dbService.executeQuery('INSERT INTO Captchas (text) VALUES (?)', [captchaText])
        .then(results => results.insertId)
        .catch(error => {
            throw new Error(`Error creating captcha: ${error.message}`);
        });
};

const getCaptcha = (captchaId) => {
    return dbService.executeQuery('SELECT * FROM Captchas WHERE id = ?', [captchaId])
        .then(results => results[0])
        .catch(error => {
            throw new Error(`Error getting captcha: ${error.message}`);
        });
};

const deleteCaptcha = (captchaId) => {
    return dbService.executeQuery('DELETE FROM Captchas WHERE id = ?', [captchaId])
        .catch(error => {
            throw new Error(`Error deleting captcha: ${error.message}`);
        });
}

module.exports = {
    generateCaptcha,
    getCaptchaImage,
    createCaptcha,
    getCaptcha,
    deleteCaptcha
};