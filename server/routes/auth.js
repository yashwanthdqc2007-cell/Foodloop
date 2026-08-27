const express = require('express');
const router = express.Router();
const { login, getMe, register } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/me', getMe);

module.exports = router;
