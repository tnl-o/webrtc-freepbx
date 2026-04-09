'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Space } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Helper: set the JWT as a secure httpOnly cookie on the response.
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });
};

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { login, password }
// Returns: { role } + sets httpOnly cookie with JWT
// ---------------------------------------------------------------------------
router.post('/login', async (req, res, next) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'Login and password are required.' });
    }

    const user = await User.findOne({ where: { login } });

    if (!user) {
      // Use a generic message to avoid user enumeration
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid login credentials.' });
    }

    const payload = { id: user.id, login: user.login, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    setTokenCookie(res, token);

    return res.status(200).json({ role: user.role });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// Returns: { id, login, role, space: { extension, sipPassword, pbxWssUrl } }
// ---------------------------------------------------------------------------
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'login', 'role'],
      include: [
        {
          model: Space,
          as: 'space',
          attributes: ['id', 'extension', 'sipPassword', 'pbxWssUrl'],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      id: user.id,
      login: user.login,
      role: user.role,
      space: user.space
        ? {
            id: user.space.id,
            extension: user.space.extension,
            sipPassword: user.space.sipPassword,
            pbxWssUrl: user.space.pbxWssUrl,
          }
        : null,
    });
  } catch (err) {
    return next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// Clears the token cookie
// ---------------------------------------------------------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
});

module.exports = router;
