import { Request, Response, NextFunction } from 'express';
import Users from '../models/Users';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { environment } from '../config/environment';

export const signUp = async (req: Request, res: Response) => {
    try {
        const {email, password, name} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await Users.create({
            email,
            name,
            password: hashedPassword
        });
        const token = jwt.sign(
            { userId: newUser._id },
            environment.jwt.secret,
            { expiresIn: '1h' }
        );
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error('Sign up error:', error);
        return res.status(500).json({
            message: 'Registration failed',
            error: 'An error occurred during registration'
        });
    }
};