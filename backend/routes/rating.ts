import { Router } from 'express'
import { initializeRating, recordPreference, getPairForComparison } from '../controllers/rating'
import { verifyToken } from '../middleware/auth'

const router = Router()
router.post('/init/:drinkId', initializeRating)
router.post('/preference', recordPreference)
router.post('/compare', getPairForComparison)

export default router