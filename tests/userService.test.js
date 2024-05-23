const userService = require('../services/userService');
const dbService = require('../services/databaseService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../services/databaseService');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('userService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('registerUser', () => {
    it('should throw an error if username is taken', async () => {
      dbService.executeQuery.mockResolvedValue([{ username: 'test' }]);
      await expect(userService.registerUser('test', 'good.email@forTest.com', 'Password1!')).rejects.toThrow('Username already taken');
    });

    it('should register a new user', async () => {
      dbService.executeQuery.mockResolvedValue([]);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      await userService.registerUser('test', 'good.email@forTest.com','Password1!');
      expect(dbService.executeQuery).toHaveBeenCalledWith('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', ['test','good.email@forTest.com', 'hashedPassword']);
    });
  });

  describe('loginUser', () => {
    it('should throw an error if username or password is invalid', async () => {
      dbService.executeQuery.mockResolvedValue([]);
      await expect(userService.loginUser('test', 'Password1!')).rejects.toThrow('Invalid username or password');
    });

    it('should login a user', async () => {
      dbService.executeQuery.mockResolvedValue([{ id: 1, username: 'test', password: 'hashedPassword' }]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');
      const token = await userService.loginUser('test', 'Password1!');
      expect(token).toBe('token');
    });
  });

  describe('updateUser', () => {
    it('should throw an error if token is invalid', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
      await expect(userService.updateUser('invalidToken', 'newTest', 'NewPassword1!')).rejects.toThrow('Invalid token');
    });

    it('should update a user', async () => {
      jwt.verify.mockReturnValue({ id: 1, username: 'test' });
      bcrypt.hash.mockResolvedValue('newHashedPassword');
      jwt.sign.mockReturnValue('newToken');
      const newToken = await userService.updateUser('token', 'newTest', 'NewPassword1!');
      expect(dbService.executeQuery).toHaveBeenCalledWith('UPDATE users SET username = ?, password = ? WHERE id = ?', ['newTest', 'newHashedPassword', 1]);
      expect(newToken).toBe('newToken');
    });
  });
});