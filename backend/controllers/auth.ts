import { Request, Response, NextFunction } from 'express';
import Users from '../models/Users';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

