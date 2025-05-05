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
         res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).json({
            message: 'Sign up failed.',
            error: 'An error occurred during sign up.'
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const {identifier, password} = req.body
        const foundUser = await Users.findOne({ $or: [
            {email: identifier},
            {name: identifier}
        ]});
        if(!foundUser){
            res.status(401).json({message: 'Invalid credentials.'})
            return
        }
        const foundPassword = await bcrypt.compare(password, foundUser.password)
        if(!foundPassword){
            res.status(401).json({message: 'Invalid credentials.'})
            return
        }
        const token = jwt.sign(
            { userId: foundUser._id},
            environment.jwt.secret,
            { expiresIn: '1h'}
        )
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: foundUser._id,
                email: foundUser.email,
                name: foundUser.name
            }
        })
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Login failed',
            error: 'An error occurred during login.'
        });
    }
}

export const changePassword = async (req: Request, res: Response) => {
    try {
        const {currPassword, newPassword} = req.body
        const foundUser = await Users.findOne({ _id: req.userId })
        if(!foundUser){
            res.status(401).json({message: 'User not found.'})
            return
        }
        const foundPassword = await bcrypt.compare(currPassword, foundUser.password)
        if(!foundPassword){
            res.status(401).json({message: 'Password is incorrect.'})
            return
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        foundUser.password = hashedPassword
        await foundUser.save()
        res.status(201).json({
            message: 'Password change successful.',
            user: {
                id: foundUser._id,
                email: foundUser.email,
                name: foundUser.name
            }
        });
    } catch (error) {
        console.error('Password error:', error);
        res.status(500).json({
            message: 'Change Password failed.',
            error: 'An error occurred during the change password.'
        });
    }
}