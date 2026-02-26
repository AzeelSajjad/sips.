import { Request, Response } from 'express'
import Users from '../models/Users'
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
        const foundUser = await Users.findById(userId).populate({
            path: 'rankedDrinks.drink',
            populate: { path: 'cafe', select: 'name' }
        })
        if(!foundUser){
            res.status(400).json({message: 'No User Found'})
            return
        }
        console.log('--- GET USER DEBUG ---')
        console.log('userId:', userId)
        console.log('rankedDrinks count:', foundUser.rankedDrinks?.length)
        console.log('rankedDrinks:', JSON.stringify(foundUser.rankedDrinks))
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

export const addFriend = async (req: Request, res: Response) => {
    try {
        const {userId, friendId} = req.body
        const validUID = mongoose.Types.ObjectId.isValid(userId)
        const validFID = mongoose.Types.ObjectId.isValid(friendId)
        if(!validUID){
            res.status(400).json({message: 'No user found'})
            return
        }
        if(!validFID){
            res.status(400).json({message: 'No user found'})
            return
        }
        const exists = await Friends.findOne({
            $or: [
                {user: validUID, friend: validFID},
                {user: validFID, friend: validUID}
            ]
        })
        if(exists){
            res.status(200).json({message: 'Friend is already added'})
            return
        }
        if(!exists){
            await Friends.create({ user: validUID, friend: validFID})
            res.status(200).json({message : 'New friend added'})
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Friend not found'})
    }
}