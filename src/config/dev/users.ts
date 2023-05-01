import { type User } from '../../security/auth/service/user.service.js';
import { env } from '../env.js';

const { USER_PASSWORD_ENCODED } = env;
const password = USER_PASSWORD_ENCODED ?? 'p3ahem';

/**
 * Ein JSON-Array der Benutzerdaten mit den vorhandenen Rollen.
 * Nicht Set, weil es dafür keine Suchfunktion gibt.
 */
export const users: User[] = [
    {
        userId: 1,
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'user'],
    },
    {
        userId: 2,
        username: 'jane.doe',
        password,
        email: 'jane.doe@acme.com',
        roles: ['admin', 'user'],
    },
    {
        userId: 3,
        username: 'john.doe',
        password,
        email: 'john.doe@acme.com',
        roles: ['user'],
    },
];
