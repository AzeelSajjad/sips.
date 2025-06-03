import { Request, Response } from 'express'
import Cafe from '../models/Cafe'
import Users from '../models/Users'
import Drinks from '../models/Drinks'
import mongoose from 'mongoose'
import { verifyToken } from '../middleware/auth'
import dotenv from 'dotenv'
dotenv.config()
import axios, { all } from 'axios'

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
                const placeId = places[0].place_id
                const place_lng = places[0].geometry.location.lng
                const place_lat = places[0].geometry.location.lat
                const responseObj = {
                    name: placeName,
                    address,
                    placeId,
                    latitude: place_lat,
                    longitude: place_lng
                  }
                res.status(200).json(responseObj)
                return
            } else {
                res.status(404).json({message: 'Location not found'})
            }
        } else {
            res.status(404).json({message: 'Location not found'})
            return
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const getCafeDetails = async (req:Request, res: Response) => {
    try {
        const {placeId} = req.params
        if(!placeId || typeof placeId !== 'string' || placeId.trim().length === 0){
            res.status(400).json({message: 'Invalid placeId'})
            return
        }
        const api_key = process.env.GOOGLE_MAP_API_KEY
        const fields = [
            'name',
            'formatted_address', 
            'formatted_phone_number',
            'website',
            'rating',
            'opening_hours',
            'photos'
        ].join(',')
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${api_key}`
        const response = await axios.get(detailsUrl)
        if(response.data.result){
            const places = response.data.result
            const name = places.name
            const address = places.formatted_address
            const phone = places.formatted_phone_number
            const website = places.website
            const rating = places.rating
            const hours = places.opening_hours
            const responseObj = {
                name,
                address,
                phone,
                website,
                rating,
                hours
            }
            res.status(200).json(responseObj)
        } else {
            res.status(400).json({message: 'Location not found'})
            return
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({message: 'Failed to get places details'})
    }
}

export const getCafesWithFilters = async (req: Request, res: Response) => {
    try {
        const {loc, drinks, radius, openNow} = req.query
        if(!loc || typeof loc !== 'string'){
            res.status(400).json({message: 'Location not found'})
            return
        }
        const drinksArray = drinks ? (drinks as string).split(',').map(d => d.trim()) : []
        const allowedDrinks = ['matcha', 'coffee', 'boba', 'tea', 'espresso', 'latte', 'cappuccino']
        const invalidDrinks = drinksArray.filter(drink => !allowedDrinks.includes(drink.toLowerCase()))
        if(invalidDrinks.length > 0){
            res.status(400).json({message: `Invalid drink types: ${invalidDrinks.join(', ')}`})
        }
        const searchRadius = radius ? parseInt(radius as string) : 3000
        const searchOpen = openNow === 'true'
        const api_key = process.env.GOOGLE_MAP_API_KEY
        const encodedLoc = encodeURIComponent(loc as string)
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedLoc}&key=${api_key}`
        const response = await axios.get(geocodeUrl)
        if(response.data.results.length > 0){
            const location = response.data.results[0].geometry.location as { lat: number; lng: number }
            const longitude = location.lng
            const latitude = location.lat
            const type = 'cafe'
            const keywordString = drinksArray.join(' OR ')
            const encodedKeyword = encodeURIComponent(keywordString)
            const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodedKeyword}&location=${latitude},${longitude}&radius=${searchRadius}&type=${type}&key=${api_key}`
            const newRes = await axios.get(placesUrl)
            if(newRes.data.results.length > 0){

            } else {
                
            }
        } else {

        }
    } catch (error) {
        
    }
}