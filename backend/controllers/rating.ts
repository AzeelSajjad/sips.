import { Request, Response } from 'express';
import Preference from '../models/Preference';
import Drinks from '../models/Drinks';
import Users, { IRankedDrink } from '../models/Users';
import mongoose from 'mongoose';

/**
 * Initialize a drink in the user's personal ranked list.
 * Sets the starting rating based on context (loved/liked/disliked).
 */
export const initializeRating = async (req: Request, res: Response) => {
    try {
        const { userId } = req
        const { drinkId } = req.params
        const { ratingContext } = req.body

        if (!mongoose.Types.ObjectId.isValid(drinkId)) {
            res.status(400).json({ message: 'Invalid DrinkID' })
            return
        }
        if (!['loved', 'liked', 'disliked'].includes(ratingContext)) {
            res.status(400).json({ message: 'Invalid rating context' })
            return
        }

        const foundDrink = await Drinks.findById(drinkId)
        if (!foundDrink) {
            res.status(400).json({ message: 'Drink not found' })
            return
        }

        const user = await Users.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        // Check if drink is already in user's ranked list
        const existing = user.rankedDrinks.find(
            rd => rd.drink.toString() === drinkId.toString()
        )
        if (existing) {
            res.status(200).json({
                message: 'Drink already in your ranked list',
                rankedDrink: existing
            })
            return
        }

        // Count existing drinks in this tier to calculate starting rating
        const tierCount = user.rankedDrinks.filter(
            rd => rd.ratingContext === ratingContext
        ).length
        const initialRating = Math.max(10.0 - (tierCount * 0.1), 5.0)

        user.rankedDrinks.push({
            drink: new mongoose.Types.ObjectId(drinkId),
            rating: parseFloat(initialRating.toFixed(1)),
            comparisons: 0,
            ratingContext
        })
        await user.save()

        res.status(201).json({
            message: 'Drink added to your ranked list',
            rankedDrink: {
                drink: drinkId,
                rating: initialRating,
                comparisons: 0
            }
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
 * Calculate expected outcome using Elo formula.
 * Returns probability that drink A will be preferred over drink B.
 * Divisor of 3 scales appropriately for a 1-10 rating range.
 */
export const calculateExpectedOutcome = (ratingA: number, ratingB: number): number => {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 3));
}

/**
 * Calculate dynamic K-factor for a drink based on context and comparison count.
 *
 * - Context sets the base intensity (loved moves ratings more, disliked less)
 * - More comparisons = lower K = more stable rating
 *
 * Formula: K = baseK / (1 + 0.1 * comparisons)
 *   0 comparisons  → K = baseK        (new drink, volatile)
 *   10 comparisons → K = baseK / 2    (settling in)
 *   20 comparisons → K = baseK / 3    (fairly stable)
 *   50 comparisons → K = baseK / 6    (very stable)
 */
export const calculateKFactor = (ratingContext: string, comparisons: number): number => {
    let baseK = 1.0
    if (ratingContext === 'loved') {
        baseK = 1.5
    } else if (ratingContext === 'liked') {
        baseK = 1.0
    } else if (ratingContext === 'disliked') {
        baseK = 0.6
    }

    return baseK / (1 + 0.1 * comparisons)
}

/**
 * Update ratings for a pair of drinks using modified Elo algorithm.
 * Each drink gets its own K-factor based on its individual comparison count,
 * so new drinks move fast while established drinks stay stable.
 */
export const updateRatingsPair = (
    winnerRating: number,
    loserRating: number,
    winnerComparisons: number,
    loserComparisons: number,
    ratingContext: string
): { newWinnerRating: number; newLoserRating: number } => {
    const expectedWinner = calculateExpectedOutcome(winnerRating, loserRating)
    const expectedLoser = calculateExpectedOutcome(loserRating, winnerRating)

    const winnerK = calculateKFactor(ratingContext, winnerComparisons)
    const loserK = calculateKFactor(ratingContext, loserComparisons)

    const newWinnerRating = Math.max(1, Math.min(10,
        winnerRating + winnerK * (1 - expectedWinner)
    ))
    const newLoserRating = Math.max(1, Math.min(10,
        loserRating + loserK * (0 - expectedLoser)
    ))

    return { newWinnerRating, newLoserRating }
}

/**
 * Record a pairwise preference between two drinks.
 * Updates the user's personal ratings (not global), then recalculates
 * the global average_rating on each drink across all users.
 */
export const recordPreference = async (req: Request, res: Response) => {
    try {
        const { userId } = req
        const { drinkA, drinkB, winner, context } = req.body

        if (!mongoose.Types.ObjectId.isValid(drinkA)) {
            res.status(400).json({ message: 'DrinkA ID is invalid' })
            return
        }
        if (!mongoose.Types.ObjectId.isValid(drinkB)) {
            res.status(400).json({ message: 'DrinkB ID is invalid' })
            return
        }
        if (drinkA === drinkB) {
            res.status(400).json({ message: 'Cannot compare a drink to itself' })
            return
        }
        if (!['drinkA', 'drinkB'].includes(winner)) {
            res.status(400).json({ message: 'Winner must be either "drinkA" or "drinkB"' })
            return
        }
        if (!['loved', 'liked', 'disliked'].includes(context)) {
            res.status(400).json({ message: 'Invalid rating context' })
            return
        }

        // Verify both drinks exist
        const [foundDrinkA, foundDrinkB] = await Promise.all([
            Drinks.findById(drinkA),
            Drinks.findById(drinkB)
        ])
        if (!foundDrinkA) {
            res.status(400).json({ message: 'DrinkA not found' })
            return
        }
        if (!foundDrinkB) {
            res.status(400).json({ message: 'DrinkB not found' })
            return
        }

        const user = await Users.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        // Find or create per-user rating entries
        let entryA = user.rankedDrinks.find(
            rd => rd.drink.toString() === drinkA.toString()
        )
        let entryB = user.rankedDrinks.find(
            rd => rd.drink.toString() === drinkB.toString()
        )

        if (!entryA) {
            entryA = { drink: new mongoose.Types.ObjectId(drinkA), rating: 5.0, comparisons: 0, ratingContext: context }
            user.rankedDrinks.push(entryA)
            entryA = user.rankedDrinks[user.rankedDrinks.length - 1]
        }
        if (!entryB) {
            entryB = { drink: new mongoose.Types.ObjectId(drinkB), rating: 5.0, comparisons: 0, ratingContext: context }
            user.rankedDrinks.push(entryB)
            entryB = user.rankedDrinks[user.rankedDrinks.length - 1]
        }

        // Determine winner/loser
        const winnerEntry = winner === 'drinkA' ? entryA : entryB
        const loserEntry = winner === 'drinkA' ? entryB : entryA

        // Calculate new ratings with per-drink K-factors
        const { newWinnerRating, newLoserRating } = updateRatingsPair(
            winnerEntry.rating,
            loserEntry.rating,
            winnerEntry.comparisons,
            loserEntry.comparisons,
            context
        )

        // Update per-user ratings and comparison counts
        winnerEntry.rating = newWinnerRating
        loserEntry.rating = newLoserRating
        winnerEntry.comparisons += 1
        loserEntry.comparisons += 1

        await user.save()

        // Record the preference
        const newPreference = await Preference.create({
            user: userId,
            preferred: winnerEntry.drink,
            against: loserEntry.drink,
            ratingContext: context
        })

        // Update global average_rating on both drinks across all users
        await updateGlobalDrinkRating(drinkA)
        await updateGlobalDrinkRating(drinkB)

        res.status(201).json({
            message: 'Drink was successfully ranked',
            preference: newPreference,
            winnerDrink: {
                id: winnerEntry.drink,
                rating: winnerEntry.rating,
                comparisons: winnerEntry.comparisons
            },
            loserDrink: {
                id: loserEntry.drink,
                rating: loserEntry.rating,
                comparisons: loserEntry.comparisons
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

/**
 * Recalculate a drink's global average_rating as the mean of all
 * users' personal ratings for that drink.
 */
async function updateGlobalDrinkRating(drinkId: string) {
    const result = await Users.aggregate([
        { $unwind: '$rankedDrinks' },
        { $match: { 'rankedDrinks.drink': new mongoose.Types.ObjectId(drinkId) } },
        {
            $group: {
                _id: '$rankedDrinks.drink',
                avgRating: { $avg: '$rankedDrinks.rating' },
                totalUsers: { $sum: 1 }
            }
        }
    ])

    if (result.length > 0) {
        await Drinks.findByIdAndUpdate(drinkId, {
            average_rating: Math.round(result[0].avgRating * 100) / 100,
            total_ratings: result[0].totalUsers
        })
    }
}

/**
 * Get a drink to compare against the current drink from the user's ranked list.
 * Pairing strategy adapts to list size:
 *   - Small lists (< 4): pick any other drink
 *   - Larger lists: use context-aware selection (loved→top, disliked→bottom, liked→middle)
 */
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

        const user = await Users.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        // Filter to only drinks in the same tier, excluding the current drink
        const otherDrinks = user.rankedDrinks.filter(
            rd => rd.drink.toString() !== currDrinkID.toString() && rd.ratingContext === ratingContext
        )

        if (otherDrinks.length === 0) {
            res.status(400).json({
                message: 'No other ranked drinks available for comparison',
                shouldInitialize: true
            })
            return
        }

        let chosen: IRankedDrink

        // For small lists, just pick randomly — not enough data for quartiles
        if (otherDrinks.length < 4) {
            chosen = otherDrinks[Math.floor(Math.random() * otherDrinks.length)]
        } else {
            // Sort by rating descending for quartile selection
            const sorted = [...otherDrinks].sort((a, b) => b.rating - a.rating)
            const n = sorted.length

            let candidates: IRankedDrink[]

            if (ratingContext === 'loved') {
                // Compare against the top quarter (highest rated)
                candidates = sorted.slice(0, Math.max(1, Math.floor(n * 0.25)))
            } else if (ratingContext === 'disliked') {
                // Compare against the bottom quarter (lowest rated)
                candidates = sorted.slice(Math.floor(n * 0.75))
            } else {
                // 'liked' — compare against the middle half
                const start = Math.floor(n * 0.25)
                const end = Math.ceil(n * 0.75)
                candidates = sorted.slice(start, end)
            }

            // Fallback if slice produced empty (shouldn't happen, but safe)
            if (candidates.length === 0) {
                candidates = sorted
            }

            chosen = candidates[Math.floor(Math.random() * candidates.length)]
        }

        // Populate the chosen drink's full details
        const comparisonDrink = await Drinks.findById(chosen.drink)

        res.status(200).json({
            message: 'Comparison pair fetched successfully',
            currentDrink,
            comparisonDrink,
            comparisonRating: chosen.rating,
            comparisonComparisons: chosen.comparisons,
            totalRankedDrinks: user.rankedDrinks.length
        })
    } catch (error) {
        console.error('Error fetching pair for comparison:', error)
        res.status(500).json({
            message: 'Failed to fetch comparison pair',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
