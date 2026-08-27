const express = require('express');
const router = express.Router();
const { getRequirements, createRequirement, updateRequirement, claimDonation } = require('../controllers/communityController');

router.get('/requirements', getRequirements);
router.post('/requirements', createRequirement);
router.put('/requirements/:id', updateRequirement);
router.post('/matches/:id/claim', claimDonation);

module.exports = router;
