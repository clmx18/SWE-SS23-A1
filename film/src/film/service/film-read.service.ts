/**
 * Das Modul besteht aus der Klasse {@linkcode FilmReadService}.
 * @packageDocumentation
 */

import { Film, type Genre } from './../entity/film.entity.js';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    /** ID des gesuchten Films */
    id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    mitSchauspielern?: boolean;
    mitRegisseuren?: boolean;
}
export interface Suchkriterien {
    readonly titel?: string;
    readonly rating?: number;
    readonly genre?: Genre;
    readonly spieldauer?: number;
    readonly erscheinungsjahr?: number;
    readonly javascript?: boolean;
    readonly typescript?: boolean;
}
/**
 * Die Klasse `FilmReadService` implementiert das Lesen für Filme und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class FilmReadService {
    static readonly ID_PATTERN = new RE2('^[1-9][\\d]*$');

    readonly #filmProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(FilmReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const filmDummy = new Film();
        this.#filmProps = Object.getOwnPropertyNames(filmDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Einen Film asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Films
     * @returns Der gefundene Film vom Typ [Film](film_entity_film_entity.Film.html) oder undefined
     *          in einem Promise aus ES2015
     */
    async findById({
        id,
        mitSchauspielern = false,
        mitRegisseuren = false,
    }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        const film = await this.#queryBuilder
            .buildId({ id, mitSchauspielern, mitRegisseuren })
            .getOne();
        if (film === null) {
            this.#logger.debug('findById: Keinen Film gefunden');
            return;
        }

        this.#logger.debug('findById: film=%o', film);
        return film;
    }

    /**
     * Filme asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Filmen. Ggf. ist das Array leer.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            const filme = await this.#queryBuilder.build({}).getMany();
            return filme;
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            const filme = await this.#queryBuilder
                .build(suchkriterien)
                .getMany();
            return filme;
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys)) {
            return [];
        }

        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: Keine Transaktion erforderlich
        const filme = await this.#queryBuilder.build(suchkriterien).getMany();
        this.#logger.debug('find: filme=%o', filme);

        return filme;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Film?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#filmProps.includes(key) &&
                key !== 'javascript' &&
                key !== 'typescript'
            ) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
