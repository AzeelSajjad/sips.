export interface Enviornment {
    nodeEnv: string;
    port: number;
    dbUri: string;
    jwt: {
        secret: string;
        expires_in: string;
    };
}

export const environment: Enviornment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    dbUri: process.env.MONGO_URI || '',
    jwt: {
        secret: process.env.JWT_SECRET || '',
        expires_in: process.env.EXPIRES_IN || '2d'
    },
};