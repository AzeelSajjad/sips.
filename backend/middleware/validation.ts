import { Request, Response, NextFunction } from "express"
import { body, validationResult } from 'express-validator'

export const validateSignUp =  [
    body('email').isEmail().withMessage('Please enter a valid email.'),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long.'),
    body('name').notEmpty().withMessage('Name should not be empty.'), 
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(401).json({ errors: errors.array() })
        }
        next()
}];

export const validateLogin = [
    body('email').isEmail().withMessage('Email is invalid.'),
    body('password').isLength({min: 8}).withMessage('Password is invalid.'),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(401).json({ errors: errors.array() })
        }
        next()
    }
];

export const validateChangePassword = [
    body('currentPassword').isLength({min: 8}).withMessage('Password is invalid.'),
    body('newPassword').isLength({min: 8}).withMessage('Password must be at least 8 characters.'),
    body('confirmPassword').custom((value, {req}) => {
        if(value !== req.body.newPassword){
            throw new Error('Passwords do not match.')
        }
        return true;
    }), 
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(401).json({ errors: errors.array() })
        }
        next()
    }
];