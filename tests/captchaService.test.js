const captchaService = require('../services/captchaService');
const dbService = require('../services/databaseService');

jest.mock('../services/databaseService');

describe('captchaService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createCaptcha', () => {
    it('should create a new captcha', async () => {
      const captchaText = 'ABCD';
      dbService.executeQuery.mockResolvedValue({ insertId: 1 });
      const captchaId = await captchaService.createCaptcha(captchaText);
      expect(dbService.executeQuery).toHaveBeenCalledWith('INSERT INTO Captchas (text) VALUES (?)', [captchaText]);
      expect(captchaId).toBe(1);
    });
  });

  describe('getCaptcha', () => {
    it('should get a captcha by id', async () => {
      const captchaId = 1;
      const captchaText = 'ABCD';
      dbService.executeQuery.mockResolvedValue([{ id: captchaId, text: captchaText }]);
      const captcha = await captchaService.getCaptcha(captchaId);
      expect(dbService.executeQuery).toHaveBeenCalledWith('SELECT * FROM Captchas WHERE id = ?', [captchaId]);
      expect(captcha).toEqual({ id: captchaId, text: captchaText });
    });
  });

  describe('deleteCaptcha', () => {
    it('should delete a captcha by id', async () => {
      const captchaId = 1;
      dbService.executeQuery.mockResolvedValue(); // Ensure a Promise is returned
      await captchaService.deleteCaptcha(captchaId);
      expect(dbService.executeQuery).toHaveBeenCalledWith('DELETE FROM Captchas WHERE id = ?', [captchaId]);
    });
  });
});