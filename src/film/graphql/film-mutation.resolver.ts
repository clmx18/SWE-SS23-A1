/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { CreateError, UpdateError } from '../service/errors.js';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';

import { BadUserInputError } from './errors.js';
import { Film } from '../entity/film.entity.js';
import { FilmDTO } from '../rest/filmDTO.entity.js';
import { FilmWriteService } from '../service/film-write.service.js';
import { IdInput } from './film-query.resolver.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { Regisseur } from '../entity/regisseur.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export class FilmUpdateDTO extends FilmDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class FilmMutationResolver {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmMutationResolver.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('admin', 'user')
    async create(@Args('input') filmDTO: FilmDTO) {
        this.#logger.debug('create: filmDTO=%o', filmDTO);

        const film = this.#filmDtoToFilm(filmDTO);
        const result = await this.#service.create(film);
        this.#logger.debug('createFilm: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new BadUserInputError(
                this.#errorMsgCreateFilm(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @RolesAllowed('admin', 'user')
    async update(@Args('input') filmDTO: FilmUpdateDTO) {
        this.#logger.debug('update: film=%o', filmDTO);

        const film = this.#filmUpdateDtoToFilm(filmDTO);
        const versionStr = `"${filmDTO.version.toString()}"`;

        const result = await this.#service.update({
            id: Number.parseInt(filmDTO.id, 10),
            film,
            version: versionStr,
        });
        if (typeof result === 'object') {
            throw new BadUserInputError(this.#errorMsgUpdateFilm(result));
        }
        this.#logger.debug('updateFilm: result=%d', result);
        return result;
    }

    @Mutation()
    @RolesAllowed('admin')
    async delete(@Args() id: IdInput) {
        const idStr = id.id;
        this.#logger.debug('delete: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteFilm: result=%s', result);
        return result;
    }

    #filmDtoToFilm(filmDTO: FilmDTO): Film {
        const regisseur: Regisseur = {
            id: undefined,
            version: undefined,
            filme: undefined,
            vorname: filmDTO.regisseur?.vorname,
            nachname: filmDTO.regisseur?.nachname,
            geburtsdatum:
                filmDTO.regisseur?.geburtsdatum === undefined
                    ? undefined
                    : new Date(filmDTO.regisseur.geburtsdatum as string),
        };

        const schauspielerListe = filmDTO.schauspieler?.map(
            (schauspielerDTO) => {
                const schauspieler: Schauspieler = {
                    id: undefined,
                    version: undefined,
                    vorname: schauspielerDTO.vorname,
                    nachname: schauspielerDTO.nachname,
                    geburtsdatum: schauspielerDTO.geburtsdatum,
                    groesse: schauspielerDTO.groesse,
                    sozialeMedien: undefined,
                };
                return schauspieler;
            },
        );

        const film = {
            id: undefined,
            version: undefined,
            titel: filmDTO.titel,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            spieldauer: filmDTO.spieldauer,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            regisseur,
            schauspieler: schauspielerListe,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        return film;
    }

    #filmUpdateDtoToFilm(filmDTO: FilmUpdateDTO): Film {
        return {
            id: undefined,
            version: undefined,
            titel: filmDTO.titel,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            spieldauer: filmDTO.spieldauer,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            regisseur: undefined,
            schauspieler: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #errorMsgCreateFilm(err: CreateError) {
        switch (err.type) {
            case 'MovieExists': {
                return `Das Film ${err.id} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdateFilm(err: UpdateError) {
        switch (err.type) {
            case 'MovieDoesNotExist': {
                return `Es gibt kein Film mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
