import { Request, Response, NextFunction } from 'express';
import Users from '../models/Users';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { environment } from '../config/environment';

export const signUp = async (req: Request, res: Response) => {
    const {email, password, name} = req.body
    const salt = await bcrypt.genSalt()
    const hashed = await bcrypt.hash(password, salt)
    const newUser = await Users.create({email, name, password: hashed})
    const newJWT = jwt.sign({ userId: newUser._id }, environment.jwt.secret, { expiresIn: '1h' });
    return res.status(201).json({ token: newJWT });
};