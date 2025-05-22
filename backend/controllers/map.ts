import { Request, Response } from 'express'
import Cafe from '../models/Cafe'
import Users from '../models/Users'
import Drinks from '../models/Drinks'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
import axios from 'axios'

