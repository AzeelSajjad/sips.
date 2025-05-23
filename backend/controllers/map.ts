import { Request, Response } from 'express'
import Cafe from '../models/Cafe'
import Users from '../models/Users'
import Drinks from '../models/Drinks'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'

export const searchCafeByName = async (req: Request, res: Response) => {
    try {
        const {name, loc} = req.query
        if(!name || !loc){
            res.status(400).json({message: 'Missing Fields'})
            return
        }
        const api_key = process.env.GOOGLE_MAP_API_KEY
        const radius = 3000
        const type = 'cafe'
        const encodedName = encodeURIComponent(name as string)
        const encodedLoc = encodeURIComponent(loc as string)
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLoc}&key=${api_key}`
        const response = await axios.get(geocodeUrl)
        if(response.data.results.length > 0){
            const location = response.data.results[0].geometry.location as { lat: number; lng: number }
            const longitude = location.lng
            const latitude = location.lat
            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodedName}&location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${api_key}`
            const newRes = await axios.get(placesUrl)
            if(newRes.data.results.length > 0){
                const places = newRes.data.results
                const placeName = places[0].name
                const address = places[0].vicinity
                const placeId = response.data.results[0].place_id
                const place_lng = places[0].geometry.location.lng
                const place_lat = places[0].geometry.location.lat
            } else {
                res.status(404).json({message: 'Location not found'})
            }
        } else {
            res.status(404).json({message: 'Location not found'})
            return
        }
    } catch (error) {
        
    }
}