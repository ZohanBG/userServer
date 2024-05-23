const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const userService = require('./services/userService');
const captchaService = require('./services/captchaService');

dotenv.config();

const server = http.createServer(async (req, res) => {
    const reqUrl = url.parse(req.url, true);

    // Route: /register
    // Method: GET
    if (req.url === '/register' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'static', 'register.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading register.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }

    // Route: /login
    // Method: GET
    else if (req.url === '/login' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'static', 'login.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading login.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }

    // Route: /update
    // Method: GET
    else if (reqUrl.pathname === '/update' && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'static', 'update.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading login.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }

    // Method: GET
    // Getting static .css files
    else if (req.url.endsWith('.css')) {
        const cssPath = path.join(__dirname, req.url);
        fs.readFile(cssPath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            }
        });
    }

    // Method: GET
    // Getting static .js files
    else if (req.url.endsWith('.js')) {
        const jsPath = path.join(__dirname, req.url);
        fs.readFile(jsPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading JavaScript file');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    }

    // Route: /captcha
    // Method: GET
    else if (req.url === '/captcha' && req.method === 'GET') {
        try {
            const captchaText = captchaService.generateCaptcha();
            const captchaId = await captchaService.createCaptcha(captchaText);
            const captchaImage = captchaService.getCaptchaImage(captchaText);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                captchaId,
                captchaImage
            }));

        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(error.message);
        }
    }

    // Route: /register
    // Method: POST
    else if (req.url === '/register' && req.method === 'POST') {
        try {
            const { username, email, password, captchaId, captchaText } = await getRequestBody(req);

            if (!await checkCaptcha(captchaId, captchaText)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify({ success: false, message: 'Invalid CAPTCHA' }));
                return;
            }

            await userService.registerUser(username, email, password);
            await captchaService.deleteCaptcha(captchaId);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'User registered successfully', username }));

        } catch (error) {
            if (error.message === 'Username already taken' || error.message === 'Email already taken') {
                res.writeHead(409, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: error.message }));
            }
        }
    }

    // Route: /login
    // Method: POST
    else if (reqUrl.pathname == '/login' && req.method === 'POST') {
        try {
            const { username, password, captchaId, captchaText } = await getRequestBody(req);

            if (!await checkCaptcha(captchaId, captchaText)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify({ success: false, message: 'Invalid CAPTCHA' }));
                return;
            }

            const token = await userService.loginUser(username, password);
            await captchaService.deleteCaptcha(captchaId);

            if (token) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ token: token, success: true }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({ success: false, message: "Invalid username or password" }));
            }
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, message: "Invalid username or password" }));
        }
    }

    // Route: /update
    // Method: POST
    else if (reqUrl.pathname == '/update' && req.method === 'POST') {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new Error('No token provided');
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.SECRET_KEY);
            const { newUsername, newPassword, captchaId, captchaText } = await getRequestBody(req);
            if (!await checkCaptcha(captchaId, captchaText)) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(JSON.stringify({ success: false, message: 'Invalid CAPTCHA' }));
                return;
            }

            const newToken = await userService.updateUser(token, newUsername, newPassword);
            await captchaService.deleteCaptcha(captchaId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ token: newToken, success: true }));
        } catch (error) {
            res.writeHead(401);
            res.end(JSON.stringify({ success: false, message: error.message }));
        }
    }

    // Not avaluable route and/or method
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            resolve(JSON.parse(body));
        });
        req.on('error', (err) => {
            reject(err);
        });
    });
};

const checkCaptcha = async (captchaId, captchaText, res) => {
    const captcha = await captchaService.getCaptcha(captchaId);
    if (!captcha || captcha.text !== captchaText) {
        return false;
    }
    return true;
};

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});