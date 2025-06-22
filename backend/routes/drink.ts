import {Router} from 'express'
import { getDrinksByCafe, addDrinkToCafe } from '../controllers/drink';
import { verifyToken } from '../middleware/auth';

const router = Router()
router.get('/', getDrinksByCafe)
router.post('/', verifyToken, addDrinkToCafe)

export default router
