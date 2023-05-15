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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { BadUserInputError } from './errors.js';
import { type Film } from '../entity/film.entity.js';
import { FilmReadService } from '../service/film-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';

export type FilmDTO = Omit<Film, 'aktualisiert' | 'erzeugt'>;
export interface IdInput {
    id: number;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class FilmQueryResolver {
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmQueryResolver.name);

    constructor(service: FilmReadService) {
        this.#service = service;
    }

    @Query()
    async film(@Args() idInput: IdInput) {
        const { id } = idInput;
        this.#logger.debug('findById: id=%d', id);

        const film = await this.#service.findById({ id });
        if (film === undefined) {
            // https://www.apollographql.com/docs/apollo-server/data/errors
            throw new BadUserInputError(
                `Es wurde kein Film mit der ID ${id} gefunden.`,
            );
        }
        const filmDTO = this.#toFilmDTO(film);
        this.#logger.debug('findById: filmDTO=%o', filmDTO);
        return filmDTO;
    }

    @Query()
    async filme(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const filme = await this.#service.find(suchkriterium);
        if (filme.length === 0) {
            throw new BadUserInputError('Es wurden keine Filme gefunden.');
        }

        const filmeDTO = filme.map((film) => this.#toFilmDTO(film));
        this.#logger.debug('find: filmeDTO=%o', filmeDTO);
        return filmeDTO;
    }

    #toFilmDTO(film: Film): FilmDTO {
        return {
            id: film.id,
            version: film.version,
            titel: film.titel,
            genre: film.genre,
            rating: film.rating,
            spieldauer: film.spieldauer,
            erscheinungsjahr: film.erscheinungsjahr,
            regisseur: film.regisseur,
            schauspieler: film.schauspieler,
        };
    }
}
