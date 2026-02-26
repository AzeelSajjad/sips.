import { Router } from 'express'
import { searchCafeByName, getCafeDetails, getCafesWithFilters } from '../controllers/map'
import { verifyToken } from '../middleware/auth'

const router = Router()
router.get('/search', verifyToken, searchCafeByName)
router.get('/cafe/:placeId', verifyToken, getCafeDetails)
router.get('/cafes', verifyToken, getCafesWithFilters)

export default router
