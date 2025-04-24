export interface Enviornment {
    nodeEnv: string;
    port: number;
    dbUri: string;
    jwt: {
        secret: string;
        expires_in: string;
    };
}