import { Request, Response } from 'express';
import Preference, { IPREFERENCE, ratingContext } from '../models/Preference';
import Ratings, { IRATINGS } from '../models/Rating';
import Drinks, { IDRINKS } from '../models/Drinks';
import Users, { IUSER } from '../models/Users';
import mongoose from 'mongoose';
import { environment } from '../config/environment';