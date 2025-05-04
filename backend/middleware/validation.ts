import { Request, Response, NextFunction } from "express"
import { body, validationResult } from 'express-validator'
import Users from "../models/Users";

export const validateSignUp =  [
    body('email').isEmail().withMessage('Please enter a valid email.').custom(async (email) => {
        const existingUser = await Users.findOne({ email })
        if(existingUser){
           throw new Error('Email already in use.')
        }
        return true
    }),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters.').matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    body('name').notEmpty().withMessage('Name should not be empty.'), 
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }
        next()
}];

export const validateLogin = [
    body('email').isEmail().withMessage('Email is invalid.'),
    body('password').isLength({min: 8}).withMessage('Password is invalid.').matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }
        next()
    }
];

export const validateChangePassword = [
    body('currentPassword').isLength({min: 8}).withMessage('Password is invalid.'),
    body('newPassword').isLength({min: 8}).withMessage('Password must be at least 8 characters.').matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.newPassword){
            throw new Error('Passwords do not match.')
        }
        return true;
    }), 
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() })
        }
        next()
    }
];