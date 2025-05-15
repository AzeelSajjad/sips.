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
            res.status(400).json({message: 'Invalid DrinkID'})
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
            res.status(400).json({message: 'Drink not found'})
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
        console.error('Error initializing drink rating:', error)
        res.status(500).json({
            message: 'Failed to initialize drink rating',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const calculateExpectedOutcome = (ratingA: number, ratingB: number): number => {
    let E = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 3));
    return E;
}

export const updateRatingsPair = (
    ratingPreferred: number,
    ratingNonPreferred: number,
    ratingContext: string,
    kfactor: number = .5
) : { newPrefRating: number, newNonPrefRating: number } => {
    if(ratingContext === 'loved'){
        kfactor = .7
    } else if(ratingContext === 'liked'){
        kfactor = .5
    } else if(ratingContext === 'disliked'){
        kfactor = .3
    }
    const expectedOutcome = calculateExpectedOutcome(ratingPreferred, ratingNonPreferred)
    const boundedPrefRating = Math.max(1, Math.min(10, ratingPreferred + kfactor * (1 - expectedOutcome)));
    const boundedNonPrefRating = Math.max(1, Math.min(10, ratingNonPreferred + kfactor * (0 - expectedOutcome)));
    return {
        newPrefRating: boundedPrefRating,
        newNonPrefRating: boundedNonPrefRating
    }
}