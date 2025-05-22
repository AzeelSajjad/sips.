import { Request, Response } from 'express';
import Preference from '../models/Preference';
import Drinks, { IDRINKS } from '../models/Drinks';
import Users from '../models/Users';
import mongoose from 'mongoose';

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

export const recordPreference = async (req: Request, res: Response) => {
    try {
        const {userId} = req
        const {prefDrink, againstDrink, context} = req.body
        const validPref = await mongoose.Types.ObjectId.isValid(prefDrink)
        const validAgainst = await mongoose.Types.ObjectId.isValid(againstDrink)
        if(!validPref){
            res.status(400).json({message: 'PrefDrink ID is invalid'})
            return
        }
        if(!validAgainst){
            res.status(400).json({message: 'AgainstDrink ID is invalid'})
            return
        }
        const foundPrefDrink = await Drinks.findById(prefDrink)
        const foundAgainstDrink = await Drinks.findById(againstDrink)
        if(!foundPrefDrink){
            res.status(400).json({message: 'PrefDrink not found'})
            return
        }
        if(!foundAgainstDrink){
            res.status(400).json({message: 'Against Drink not found'})
            return
        }
        const prefCurrRating = foundPrefDrink.average_rating
        const againstCurrRating = foundAgainstDrink.average_rating
        const newRatings = updateRatingsPair(prefCurrRating, againstCurrRating, context)
        foundPrefDrink.average_rating = newRatings.newPrefRating
        foundAgainstDrink.average_rating = newRatings.newNonPrefRating
        foundPrefDrink.total_ratings = (foundPrefDrink.total_ratings || 0) + 1
        foundAgainstDrink.total_ratings = (foundAgainstDrink.total_ratings || 0) + 1
        await foundPrefDrink.save()
        await foundAgainstDrink.save()
        const newPreference = await Preference.create({
            user: userId,
            preferred: foundPrefDrink,
            against: foundAgainstDrink,
            ratingContext: context
        })
        const user = await Users.findById(userId);
        if (user) {
            if (!user.rankedDrinks.includes(prefDrink)) {
                user.rankedDrinks.push(prefDrink);
            }
            if (!user.rankedDrinks.includes(againstDrink)) {
                user.rankedDrinks.push(againstDrink);
            }
            await user.save();
        }
        res.status(201).json({
            message: 'Drink was successfully ranked',
            preference: newPreference,
            preferredDrink: foundPrefDrink,
            againstDrink: foundAgainstDrink
        })
    } catch (error) {
        console.error('Error ranking Drink:', error)
        res.status(500).json({
            message: 'Failed to rank Drink',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export const getPairForComparison = async (req: Request, res: Response) => {
    try {
        const { userId } = req
        const { currDrinkID, ratingContext } = req.body
        const validCurrDrinkID = mongoose.Types.ObjectId.isValid(currDrinkID)

        if (!validCurrDrinkID) {
            res.status(400).json({ message: 'Current Drink ID is invalid' })
            return
        }

        const currentDrink = await Drinks.findById(currDrinkID)
        if (!currentDrink) {
            res.status(400).json({ message: 'Current drink not found' })
            return
        }

        const user = await Users.findById(userId).populate('rankedDrinks');
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        const rankedDrinks = user.rankedDrinks as unknown as IDRINKS[]
        if (rankedDrinks.length === 0) {
            res.status(400).json({ message: 'User has no ranked drinks for comparison' })
            return;
        }
        const sortedDrinks = [...rankedDrinks]
            .sort((a, b) => b.average_rating - a.average_rating)
        const filteredSortedDrinks = sortedDrinks.filter(d => d.id !== currDrinkID)
        if (filteredSortedDrinks.length === 0) {
            res.status(400).json({ message: 'No other ranked drinks available for comparison' })
            return;
        }
        const n = filteredSortedDrinks.length
        const q1Index = Math.floor(n * 0.25)
        const q3Index = Math.floor(n * 0.75)
        
        let candidates: IDRINKS[] = []
        
        if (ratingContext === 'loved') {
            candidates = filteredSortedDrinks.slice(0, q1Index);
            if (candidates.length === 0) candidates = filteredSortedDrinks.slice(0, Math.min(3, n))
        } else if (ratingContext === 'liked') {
            candidates = filteredSortedDrinks.slice(q1Index, q3Index)
            if (candidates.length === 0) candidates = filteredSortedDrinks.slice(Math.floor(n / 3), Math.floor(n / 3) + Math.min(3, n))
        } else if (ratingContext === 'disliked') {
            candidates = filteredSortedDrinks.slice(q3Index)
            if (candidates.length === 0) candidates = filteredSortedDrinks.slice(-Math.min(3, n))
        }
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const chosenDrink = candidates[randomIndex]
        
        res.status(200).json({
            message: 'Comparison pair fetched successfully',
            currentDrink,
            rankedDrinkForComparison: chosenDrink,
            totalRankedDrinks: rankedDrinks.length
        })
    } catch (error) {
        console.error('Error fetching pair for comparison:', error)
        res.status(500).json({
            message: 'Failed to fetch comparison pair',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}