/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication and user session management
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegister'
 *     responses:
 *       200:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or duplicate email
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in a user and receive a JWT cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLogin'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user returned successfully
 * /api/v1/auth/logout:
 *   get:
 *     tags: [Auth]
 *     summary: Log out the current user
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
const express = require('express');
const { register, login, getMe, logout } = require('../controllers/auth');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', logout);

module.exports = router;
