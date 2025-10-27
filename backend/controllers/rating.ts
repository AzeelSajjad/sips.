import { Request, Response } from 'express';
import Preference from '../models/Preference';
import Drinks, { IDRINKS } from '../models/Drinks';
import Users from '../models/Users';
import mongoose from 'mongoose';

export const initializeRating = async (req: Request, res: Response) => {
    try {
        const {drinkId} = req.params
        const {ratingContext} = req.body
        
        if (!mongoose.Types.ObjectId.isValid(drinkId)) {
            res.status(400).json({message: 'Invalid DrinkID'})
            return
        }
        
        const foundDrink = await Drinks.findById(drinkId)
        if (!foundDrink) {
            res.status(400).json({message: 'Drink not found'})
            return
        }
        
        // Don't reinitialize if drink already has ratings
        if (foundDrink.total_ratings && foundDrink.total_ratings > 0) {
            res.status(200).json({
                message: 'Drink already has ratings',
                drink: foundDrink
            })
            return
        }
        
        let initialRating = 5.0
        if (ratingContext === 'loved') {
            initialRating = 7.5
        } else if (ratingContext === 'liked') {
            initialRating = 5.0
        } else if (ratingContext === 'disliked') {
            initialRating = 2.5
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

/**
 * Calculate expected outcome using Elo-like formula
 * Returns probability that A will be preferred over B
 */
export const calculateExpectedOutcome = (ratingA: number, ratingB: number): number => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 3));
}

/**
 * Update ratings for a pair of drinks using modified Elo algorithm
 * @param ratingWinner - Current rating of the winning drink
 * @param ratingLoser - Current rating of the losing drink
 * @param ratingContext - Context of the rating (loved, liked, disliked)
 * @returns Updated ratings for both drinks
 */
export const updateRatingsPair = (
    ratingWinner: number,
    ratingLoser: number,
    ratingContext: string
) : { newWinnerRating: number, newLoserRating: number } => {
    // Adjust K-factor based on rating context
    let kfactor = 0.5
    if (ratingContext === 'loved') {
        kfactor = 0.7  // More weight for strong preferences
    } else if (ratingContext === 'liked') {
        kfactor = 0.5  // Medium weight
    } else if (ratingContext === 'disliked') {
        kfactor = 0.3  // Less weight for weak preferences
    }
    
    // Calculate expected outcomes for both drinks
    const expectedWinner = calculateExpectedOutcome(ratingWinner, ratingLoser)
    const expectedLoser = calculateExpectedOutcome(ratingLoser, ratingWinner)
    
    // Actual outcome: winner "won" (1), loser "lost" (0)
    // Update using Elo formula: NewRating = OldRating + K * (ActualScore - ExpectedScore)
    const newWinnerRating = ratingWinner + kfactor * (1 - expectedWinner)
    const newLoserRating = ratingLoser + kfactor * (0 - expectedLoser)
    
    // Bound ratings between 1 and 10
    const boundedWinnerRating = Math.max(1, Math.min(10, newWinnerRating))
    const boundedLoserRating = Math.max(1, Math.min(10, newLoserRating))
    
    return {
        newWinnerRating: boundedWinnerRating,
        newLoserRating: boundedLoserRating
    }
}

export const recordPreference = async (req: Request, res: Response) => {
    try {
        const {userId} = req
        const {drinkA, drinkB, winner, context} = req.body
        
        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(drinkA)) {
            res.status(400).json({message: 'DrinkA ID is invalid'})
            return
        }
        if (!mongoose.Types.ObjectId.isValid(drinkB)) {
            res.status(400).json({message: 'DrinkB ID is invalid'})
            return
        }
        if (drinkA === drinkB) {
            res.status(400).json({message: 'Cannot compare a drink to itself'})
            return
        }
        if (!['drinkA', 'drinkB'].includes(winner)) {
            res.status(400).json({message: 'Winner must be either "drinkA" or "drinkB"'})
            return
        }
        if (!['loved', 'liked', 'disliked'].includes(context)) {
            res.status(400).json({message: 'Invalid rating context'})
            return
        }
        
        const foundDrinkA = await Drinks.findById(drinkA)
        const foundDrinkB = await Drinks.findById(drinkB)
        
        if (!foundDrinkA) {
            res.status(400).json({message: 'DrinkA not found'})
            return
        }
        if (!foundDrinkB) {
            res.status(400).json({message: 'DrinkB not found'})
            return
        }
        
        // Initialize ratings if needed (with default 5.0)
        const drinkARating = foundDrinkA.average_rating || 5.0
        const drinkBRating = foundDrinkB.average_rating || 5.0
        
        // Determine winner and loser
        const winnerDrink = winner === 'drinkA' ? foundDrinkA : foundDrinkB
        const loserDrink = winner === 'drinkA' ? foundDrinkB : foundDrinkA
        const winnerRating = winner === 'drinkA' ? drinkARating : drinkBRating
        const loserRating = winner === 'drinkA' ? drinkBRating : drinkARating
        
        // Calculate new ratings
        const newRatings = updateRatingsPair(winnerRating, loserRating, context)
        
        // Update drink ratings
        winnerDrink.average_rating = newRatings.newWinnerRating
        loserDrink.average_rating = newRatings.newLoserRating
        winnerDrink.total_ratings = (winnerDrink.total_ratings || 0) + 1
        loserDrink.total_ratings = (loserDrink.total_ratings || 0) + 1
        
        await winnerDrink.save()
        await loserDrink.save()
        
        // Record the preference
        const newPreference = await Preference.create({
            user: userId,
            preferred: winnerDrink._id,
            against: loserDrink._id,
            ratingContext: context
        })
        
        // Update user's ranked drinks list
        const user = await Users.findById(userId)
        if (user) {
            if (!user.rankedDrinks.includes(drinkA)) {
                user.rankedDrinks.push(drinkA)
            }
            if (!user.rankedDrinks.includes(drinkB)) {
                user.rankedDrinks.push(drinkB)
            }
            await user.save()
        }
        
        res.status(201).json({
            message: 'Drink was successfully ranked',
            preference: newPreference,
            winnerDrink: {
                id: winnerDrink._id,
                drink: winnerDrink.drink,
                rating: winnerDrink.average_rating
            },
            loserDrink: {
                id: loserDrink._id,
                drink: loserDrink.drink,
                rating: loserDrink.average_rating
            }
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
        
        if (!mongoose.Types.ObjectId.isValid(currDrinkID)) {
            res.status(400).json({ message: 'Current Drink ID is invalid' })
            return
        }
        if (!['loved', 'liked', 'disliked'].includes(ratingContext)) {
            res.status(400).json({ message: 'Invalid rating context' })
            return
        }

        const currentDrink = await Drinks.findById(currDrinkID)
        if (!currentDrink) {
            res.status(400).json({ message: 'Current drink not found' })
            return
        }

        const user = await Users.findById(userId).populate('rankedDrinks')
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        const rankedDrinks = user.rankedDrinks as unknown as IDRINKS[]
        
        // Filter out the current drink from ranked drinks
        const filteredRankedDrinks = rankedDrinks.filter(
            d => (d._id as mongoose.Types.ObjectId).toString() !== currDrinkID.toString()
        )
        
        if (filteredRankedDrinks.length === 0) {
            res.status(400).json({ 
                message: 'No other ranked drinks available for comparison',
                shouldInitialize: true 
            })
            return
        }

        // Sort by rating (descending)
        const sortedDrinks = [...filteredRankedDrinks]
            .sort((a, b) => (b.average_rating || 5) - (a.average_rating || 5))
        
        const n = sortedDrinks.length
        
        // Calculate quartile indices
        const q1Index = Math.max(0, Math.floor(n * 0.25))
        const q3Index = Math.max(0, Math.floor(n * 0.75))
        
        let candidates: IDRINKS[] = []
        
        // Select candidates based on rating context
        if (ratingContext === 'loved') {
            // Compare against top quartile (highest rated drinks)
            candidates = sortedDrinks.slice(0, Math.max(1, q1Index))
            if (candidates.length === 0) {
                candidates = sortedDrinks.slice(0, Math.min(3, n))
            }
        } else if (ratingContext === 'liked') {
            // Compare against middle half
            const start = Math.max(0, q1Index)
            const end = Math.min(n, Math.max(start + 1, q3Index))
            candidates = sortedDrinks.slice(start, end)
            if (candidates.length === 0) {
                candidates = sortedDrinks
            }
        } else if (ratingContext === 'disliked') {
            // Compare against bottom quartile (lowest rated drinks)
            candidates = sortedDrinks.slice(Math.max(0, q3Index))
            if (candidates.length === 0) {
                candidates = sortedDrinks.slice(-Math.min(3, n))
            }
        }
        
        // Fallback to all drinks if no candidates
        if (candidates.length === 0) {
            candidates = sortedDrinks
        }
        
        // Select random drink from candidates
        const randomIndex = Math.floor(Math.random() * candidates.length)
        const chosenDrink = candidates[randomIndex]
        
        res.status(200).json({
            message: 'Comparison pair fetched successfully',
            currentDrink,
            comparisonDrink: chosenDrink,
            totalRankedDrinks: rankedDrinks.length,
            candidatesConsidered: candidates.length
        })
    } catch (error) {
        console.error('Error fetching pair for comparison:', error)
        res.status(500).json({
            message: 'Failed to fetch comparison pair',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}