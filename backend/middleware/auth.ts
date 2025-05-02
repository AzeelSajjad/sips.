import {Request, Response, NextFunction} from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
import { environment } from '../config/environment';
import '../types/auth.d.ts';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if(authHeader != null){
        const token =  authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, environment.jwt.secret) as JwtPayload;
            req.userId = decoded.userId;
            next();
        } catch (error) {
            res.status(403).json({ message: 'Invalid or expired token provided.' });
        }
    } else {
        res.status(401).json({ message: 'No token provided.' });
    }

};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if(req.userId != null){
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized.' });
    }
};

