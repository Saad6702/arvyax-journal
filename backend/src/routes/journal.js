const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

router.post('/analyze', journalController.analyzeEntry);
router.get('/insights/:userId', journalController.getInsights);
router.post('/', journalController.createEntry);
router.get('/:userId', journalController.getEntries);

module.exports = router;