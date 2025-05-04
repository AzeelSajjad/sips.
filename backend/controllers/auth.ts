import { Request, Response, NextFunction } from 'express';
import Users from '../models/Users';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const signUp = (req: Request, res: Response, next: NextFunction) => {
    const {email, password, name} = req.body
    
};