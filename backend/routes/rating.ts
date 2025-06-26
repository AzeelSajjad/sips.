import { Router } from 'express'
import { initializeRating, recordPreference, getPairForComparison } from '../controllers/rating'
import { verifyToken } from '../middleware/auth'

const router = Router()
router.post('/init/:drinkId', verifyToken, initializeRating)
router.post('/preference', verifyToken, recordPreference)
router.post('/compare', verifyToken, getPairForComparison)

export default router