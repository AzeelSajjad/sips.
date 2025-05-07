import { JwtPayload } from 'jsonwebtoken';

declare module 'express' {
  interface Request {
    userId?: string | JwtPayload;
  }
}