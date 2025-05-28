import { Request, Response } from 'express'
import Cafe from '../models/Cafe'
import Users from '../models/Users'
import Drinks from '../models/Drinks'
import mongoose from 'mongoose'
import { verifyToken } from '../middleware/auth'
import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'

export const getDrinksByCafe = async (req: Request, res: Response) => {
    try {
        const {placeId} = req.query
        if(!placeId || typeof placeId !== 'string' || placeId.trim().length === 0){
            res.status(400).json({message: 'Invalid placeId'})
            return
        }
        const drinks = await Drinks.find({placeId: placeId})
        if(drinks.length === 0){
            res.status(200).json({message: 'Be the first to add a drink'})
            return
        } else {
            res.status(200).json(drinks)
            return
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Server error'})
    }
}

export const addDrinkToCafe = async (req: Request, res: Response) => {
    try {
        const {cafe, drink, category, description, price, image} = req.body
        const userId = req.userId
        if(!cafe || !drink || typeof cafe !== 'string' || cafe.trim().length === 0 || typeof drink !== 'string' || drink.trim().length === 0){
            res.status(400).json({message: 'Invalid cafe or drink'})
            return
        }
        const sameDrink = await Drinks.findOne({cafe: cafe, drink: drink})
        if(sameDrink){
            res.status(400).json({message: 'Drink already exists'})
            return
        }
        const newDrink = await Drinks.create({
            drink,
            cafe,
            category,
            description,
            userId,
            price,
            image
        })
        res.status(201).json({
            message: 'Drink was successfully added',
            drink: newDrink.drink,
            cafe: newDrink.cafe,
            category: newDrink.category,
            description: newDrink.description,
            price: newDrink.price,
            image: newDrink.image
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Failed to add Drink'})
    }
}