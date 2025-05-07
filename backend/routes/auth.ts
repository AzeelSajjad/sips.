import { signUp, login, changePassword } from "../controllers/auth";
import { validateSignUp, validateLogin, validateChangePassword } from "../middleware/validation";
import { Router } from "express";
import { verifyToken, requireAuth } from "../middleware/auth";

const router = Router()
router.post('/signup', validateSignUp, signUp)

router.post('/login', validateLogin, login)

router.patch('/change-password', verifyToken, requireAuth, validateChangePassword, changePassword)
