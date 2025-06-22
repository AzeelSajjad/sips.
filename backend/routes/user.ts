import {Router} from 'express';
import { getUserInfo, addFriend } from '../controllers/user';

const router = Router();

router.get('/user/:userId', getUserInfo);
router.post('/friends', addFriend);

export default router;
