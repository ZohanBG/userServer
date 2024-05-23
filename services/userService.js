const dbService = require('./databaseService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const validateUser = (username, email, password) => {
  if (!username || !password) {
    return 'Username and password cannot be null';
  }

  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }

  if (password.length < 7) {
    return 'Password must be at least 7 characters long';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return 'Invalid email';
  }

  const uppercasePattern = /[A-Z]/;
  const specialCharPattern = /[!@#$%^&*]/;
  const digitPattern = /[0-9]/;
  if (!uppercasePattern.test(password) || !specialCharPattern.test(password) || !digitPattern.test(password)) {
    return 'Password must contain at least one uppercase letter, one special character, and one digit';
  }

  return null;
};

const registerUser = async (username, email, password,) => {
  const validationError = validateUser(username, email, password);
  if (validationError) {
    throw new Error(validationError);
  }

  const userQuery = 'SELECT * FROM users WHERE username = ?';
  const userParams = [username];
  const userResults = await dbService.executeQuery(userQuery, userParams);

  if (userResults.length > 0) {
    throw new Error('Username already taken');
  }

  const emailQuery = 'SELECT * FROM users WHERE email = ?';
  const emailParams = [email];
  const emailResults = await dbService.executeQuery(emailQuery, emailParams);

  if (emailResults.length > 0) {
    throw new Error('Email already taken');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  const params = [username, email, hashedPassword];
  return dbService.executeQuery(query, params);
};

const loginUser = async (username, password) => {
  const query = 'SELECT * FROM users WHERE username = ?';
  const params = [username];
  const results = await dbService.executeQuery(query, params);
  if (results.length > 0) {
    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, { expiresIn: '1h' });
      return token;
    }
  }
  throw new Error('Invalid username or password');
};

const updateUser = async (token, newUsername, newPassword) => {
  const userId = getUserIdFromToken(token);
  const email = "good.email@forTest.com";
  const validationError = validateUser(newUsername, email, newPassword);
  if (validationError) {
    throw new Error(validationError);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const query = 'UPDATE users SET username = ?, password = ? WHERE id = ?';
  const params = [newUsername, hashedPassword, userId];
  await dbService.executeQuery(query, params);

  const newToken = jwt.sign({ id: userId, username: newUsername }, process.env.SECRET_KEY, { expiresIn: '1h' });
  return newToken;
};

const getUserIdFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return decoded.id;
  } catch (error) {
    throw new Error('Invalid token');
  }
};


module.exports = {
  registerUser,
  loginUser,
  updateUser
};