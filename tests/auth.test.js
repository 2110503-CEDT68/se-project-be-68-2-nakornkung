const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/auth'); // Path to your controller
const User = require('../models/User');

// Mock User model
jest.mock('../models/User');

describe('Auth Controller Unit Tests', () => {
  let req, res, next;

  beforeAll(() => {
    // Set mock environment variables for cookie expiration calculation
    process.env.JWT_COOKIE_EXPIRE = '30';
    process.env.NODE_ENV = 'development';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: { id: 'user123' }, // Mock user id for getMe
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('register', () => {
    it('should register a user and return a token (Success)', async () => {
      const userData = { name: 'Test', email: 'test@gmail.com', password: '123' };
      req.body = userData;

      // Mock user instance and its methods
      const mockUser = {
        _id: 'user123',
        ...userData,
        getSignedJwtToken: jest.fn().mockReturnValue('mockToken')
      };

      User.create.mockResolvedValue(mockUser);

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'mockToken' })
      }));
    });

    it('should return 400 for duplicate email (Error 11000)', async () => {
      const error = new Error();
      error.code = 11000;
      User.create.mockRejectedValue(error);

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "E-Mail already registered"
      });
    });

    it('should return 400 for email validation error', async () => {
      const error = {
        errors: {
          email: { message: 'Invalid email format' }
        }
      };
      User.create.mockRejectedValue(error);

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email format'
      });
    });

    it('should handle general errors in register', async () => {
        User.create.mockRejectedValue(new Error('Generic Error'));
        await register(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Generic Error'
        });
    });
  });

  describe('login', () => {
    it('should login and return a token when credentials are valid', async () => {
      req.body = { email: 'test@gmail.com', password: '123' };

      const mockUser = {
        _id: 'user123',
        matchPassword: jest.fn().mockResolvedValue(true),
        getSignedJwtToken: jest.fn().mockReturnValue('mockToken')
      };

      // Mock chain: findOne().select()
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if email or password missing', async () => {
      req.body = { email: 'test@gmail.com' }; // Missing password
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please provide an email and password'
      }));
    });

    it('should return 400 if user not found', async () => {
      req.body = { email: 'notfound@gmail.com', password: '123' };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid credentials' }));
    });

    it('should return 401 if password does not match', async () => {
      req.body = { email: 'test@gmail.com', password: 'wrong' };
      const mockUser = {
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('getMe', () => {
    it('should get current user profile', async () => {
      const mockUser = { _id: 'user123', name: 'Test User' };
      User.findById.mockResolvedValue(mockUser);

      await getMe(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockUser });
    });
  });

  describe('logout', () => {
    it('should clear cookie and logout', async () => {
      await logout(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('token', 'none', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});