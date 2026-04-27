/**
 * @swagger
 * tags:
 *   - name: Attractions
 *     description: Attraction management
 * /api/v1/attractions:
 *   get:
 *     tags: [Attractions]
 *     summary: Get all attractions
 *     responses:
 *       200:
 *         description: Attractions list returned successfully
 *   post:
 *     tags: [Attractions]
 *     summary: Create a new attraction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attraction'
 *     responses:
 *       201:
 *         description: Attraction created successfully
 * /api/v1/attractions/{id}:
 *   get:
 *     tags: [Attractions]
 *     summary: Get attraction details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attraction returned successfully
 *   put:
 *     tags: [Attractions]
 *     summary: Update an attraction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attraction'
 *     responses:
 *       200:
 *         description: Attraction updated successfully
 *   delete:
 *     tags: [Attractions]
 *     summary: Delete an attraction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attraction deleted successfully
 */
const express = require('express');
const { getAttractions, getAttraction, createAttraction, updateAttraction, deleteAttraction } = require('../controllers/attractions');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getAttractions)
  .post(protect, authorize('admin'), createAttraction);

router.route('/:id')
  .get(getAttraction)
  .put(protect, authorize('admin'), updateAttraction)
  .delete(protect, authorize('admin'), deleteAttraction);

module.exports = router;
