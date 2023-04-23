import { env } from './env.js';

const { DB_TYPE } = env;

export const dbType =
    DB_TYPE === 'postgres' || DB_TYPE === 'mysql' || DB_TYPE === 'sqlite'
        ? DB_TYPE
        : 'postgres';
