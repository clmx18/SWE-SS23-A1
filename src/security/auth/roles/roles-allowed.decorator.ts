import { type Role } from '../service/role.js';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Rest Parameter: beliebig viele Parameter als Array zusammenfassen, seit ES 2015
// eslint-disable-next-line @typescript-eslint/naming-convention
export const RolesAllowed = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
