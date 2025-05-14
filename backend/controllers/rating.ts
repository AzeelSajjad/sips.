import { Request, Response } from 'express';
import Preference, { IPREFERENCE, ratingContext } from '../models/Preference';
import Ratings, { IRATINGS } from '../models/Rating';
import Drinks, { IDRINKS } from '../models/Drinks';
import Users, { IUSER } from '../models/Users';
import mongoose from 'mongoose';
import { environment } from '../config/environment';

export const initializeRating = async (req: Request, res: Response) => {
    try {
        const {drinkId} = req.params
        const {ratingContext} = req.body
        const validDrink = await mongoose.Types.ObjectId.isValid(drinkId)
        if(!validDrink){
            res.status(401).json({message: 'Invalid DrinkID'})
            return
        }
        let initialRating = 5.0
        if(ratingContext === 'loved'){
            initialRating = 7.5
        } else if(ratingContext === 'liked'){
            initialRating = 5.0
        } else if(ratingContext === 'disliked'){
            initialRating = 2.5
        }
        const foundDrink = await Drinks.findById(drinkId)
        if(!foundDrink){
            res.status(401).json({message: 'Drink not found'})
            return
        }
        foundDrink.average_rating = initialRating
        foundDrink.total_ratings = 1
        await foundDrink.save()
        res.status(201).json({
            message: 'Drink rating initialized',
            drink: foundDrink
        })
    } catch (error) {
        
    }
}