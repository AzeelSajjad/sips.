import { Request, Response } from 'express'
import Users from '../models/Users'         
import Drinks from '../models/Drinks'
import Friends from '../models/Friends'
import mongoose from 'mongoose'

export const getUserInfo = async (req: Request, res: Response) => {
    try {
        const {userId} = req.params
        const validId = mongoose.Types.ObjectId.isValid(userId)
        if(!validId){
            res.status(400).json({message: 'Invalid userId'})
            return
        }
        const foundUser = await Users.findById(validId).populate('rankedDrinks')
        if(!foundUser){
            res.status(400).json({message: 'No User Found'})
            return
        }
        const userFriend = await Friends.find({user: userId}).populate('friends')
        res.status(200).json({
            message: 'User info retrieved',
            name: foundUser.name,
            rankedDrinks: foundUser.rankedDrinks,
            friends: userFriend.map(f => f.friend)
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Failed to retrieve user info'})
    }
}