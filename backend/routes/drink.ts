import {Router} from 'express'
import { getDrinksByCafe, addDrinkToCafe, getDrinkCatalog } from '../controllers/drink';
import { verifyToken } from '../middleware/auth';

const router = Router()
router.get('/', getDrinksByCafe)
router.get('/catalog', getDrinkCatalog)
router.post('/', verifyToken, addDrinkToCafe)

export default router
