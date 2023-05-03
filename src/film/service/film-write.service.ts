/**
 * Das Modul besteht aus der Klasse {@linkcode FilmWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { FilmReadService, Suchkriterien } from './film-read.service.js';
import { CreateError } from './errors';
import { Film } from '../entity/film.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import RE2 from 're2';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger';

@Injectable()
export class FilmWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Film>;

    readonly #readService: FilmReadService;

    readonly #logger = getLogger(FilmWriteService.name);

    constructor(
        @InjectRepository(Film) repo: Repository<Film>,
        readService: FilmReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    }

    /**
     * Ein neuer Film wird der DB hinzugefügt.
     * @param film Der neue Film
     * @returns Die ID des neuen Films in der DB und ansonsten
     * [CreateError](../types/film_service_errors.CreateError.html)
     */
    async create(film: Film): Promise<CreateError | number> {
        this.#logger.debug('create: film=%o', film);
        const validateResult = await this.#validateCreate(film);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const filmDb = await this.#repo.save(film);
        this.#logger.debug('create: filmDb=%o', filmDb);

        return filmDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    async #validateCreate(film: Film): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: film=%o', film);

        const { titel, rating, genre, spieldauer, erscheinungsjahr } = film;
        const findParams: Suchkriterien = {
            titel: titel ?? '',
            rating: rating ?? 0,
            genre: genre ?? undefined,
            spieldauer: spieldauer ?? 0,
            erscheinungsjahr: erscheinungsjahr ?? 0,
        };
        const filme = await this.#readService.find(findParams);
        if (filme.length > 0) {
            return { type: 'MovieExists', suchkriterien: findParams };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }
}
