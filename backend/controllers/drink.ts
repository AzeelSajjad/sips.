import { Request, Response } from 'express'
import Cafe from '../models/Cafe'
import Users from '../models/Users'
import Drinks from '../models/Drinks'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
import { DRINK_CATALOG, DRINK_CATEGORIES } from '../data/drinkCatalog'

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

export const getDrinkCatalog = async (req: Request, res: Response) => {
    try {
        const { category, search } = req.query

        let results = DRINK_CATALOG

        if (category && typeof category === 'string') {
            results = results.filter(d => d.category.toLowerCase() === category.toLowerCase())
        }

        if (search && typeof search === 'string') {
            const q = search.toLowerCase()
            results = results.filter(d =>
                d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
            )
        }

        res.status(200).json({ categories: DRINK_CATEGORIES, drinks: results })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch drink catalog' })
    }
}

export const addDrinkToCafe = async (req: Request, res: Response) => {
    try {
        const {placeId, cafeName, cafeAddress, latitude, longitude, drink, category, description, price, image, ratingContext} = req.body
        const userId = req.userId
        if(!placeId || !drink || typeof placeId !== 'string' || placeId.trim().length === 0 || typeof drink !== 'string' || drink.trim().length === 0){
            res.status(400).json({message: 'Invalid cafe or drink'})
            return
        }
        if(!ratingContext || !['loved', 'liked', 'disliked'].includes(ratingContext)){
            res.status(400).json({message: 'Invalid rating context'})
            return
        }

        // Find or create the cafe by placeId
        let cafe = await Cafe.findOne({placeId})
        if(!cafe){
            cafe = await Cafe.create({
                name: cafeName || 'Unknown Cafe',
                placeId,
                address: cafeAddress,
                latitude,
                longitude
            })
        }

        // Find or create the drink
        let drinkDoc: any = await Drinks.findOne({cafe: cafe._id, drink: drink})
        if(!drinkDoc){
            drinkDoc = await Drinks.create({
                drink,
                cafe: cafe._id,
                category,
                description,
                userId,
                price,
                image
            })
        }

        // Add drink to user's ranked list with initial rating
        const user = await Users.findById(userId)
        if(!user){
            res.status(404).json({message: 'User not found'})
            return
        }

        const alreadyRanked = user.rankedDrinks.find(
            rd => rd.drink.toString() === drinkDoc!._id.toString()
        )

        // Count how many drinks are already in this tier
        const tierCount = user.rankedDrinks.filter(
            rd => rd.ratingContext === ratingContext
        ).length

        // First drink in tier = 10.0, then 9.9, 9.8, etc. Floor at 5.0
        const initialRating = Math.max(10.0 - (tierCount * 0.1), 5.0)

        if(!alreadyRanked){
            user.rankedDrinks.push({
                drink: drinkDoc._id as mongoose.Types.ObjectId,
                rating: parseFloat(initialRating.toFixed(1)),
                comparisons: 0,
                ratingContext
            })
            await user.save()
        }

        res.status(201).json({
            message: 'Drink was successfully added and rated',
            drinkId: drinkDoc._id,
            drink: drinkDoc.drink,
            cafe: drinkDoc.cafe,
            category: drinkDoc.category,
            description: drinkDoc.description,
            price: drinkDoc.price,
            rating: alreadyRanked ? alreadyRanked.rating : parseFloat(initialRating.toFixed(1)),
            ratingContext
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Failed to add Drink'})
    }
}