/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Film } from '../entity/film.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Regisseur } from '../entity/regisseur.entity.js';
import { Repository } from 'typeorm';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/** Typdefinitionen für die Suche mit der Buch-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Films. */
    id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    mitSchauspielern?: boolean;
    mitRegisseuren?: boolean;
}
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Filme und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #filmAlias = `${Film.name
        .charAt(0)
        .toLowerCase()}${Film.name.slice(1)}`;

    readonly #schauspielerAlias = `${Schauspieler.name
        .charAt(0)
        .toLowerCase()}${Schauspieler.name.slice(1)}`;

    readonly #regisseurAlias = `${Regisseur.name
        .charAt(0)
        .toLowerCase()}${Regisseur.name.slice(1)}`;

    readonly #repo: Repository<Film>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Film) repo: Repository<Film>) {
        this.#repo = repo;
    }

    /**
     * Ein Film mit der ID suchen.
     * @param id ID des gesuchten Films
     * @returns QueryBuilder
     */
    buildId({
        id,
        mitSchauspielern = false,
        mitRegisseuren = false,
    }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);
        // queryBuilder.select(`${this.#filmAlias}.titel`);

        if (mitSchauspielern) {
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.schauspieler`,
                this.#schauspielerAlias,
            );
        }
        if (mitRegisseuren) {
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.regisseur`,
                this.#regisseurAlias,
            );
        }

        queryBuilder.where(`${this.#filmAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Filme asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#filmAlias);

        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line

        const { titel, mitRegisseur, mitSchauspielern, ...props } =
            suchkriterien;

        let useWhere = true;

        const ilike =
            typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (titel !== undefined && typeof titel === 'string') {
            queryBuilder = queryBuilder.where(
                `${this.#filmAlias}.titel ${ilike} :titel`,
                { titel: `%${titel}%` },
            );
            useWhere = false;
        }

        if (mitSchauspielern === 'true') {
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.schauspieler`,
                this.#schauspielerAlias,
            );
        }
        if (mitRegisseur === 'true') {
            queryBuilder.leftJoinAndSelect(
                `${this.#filmAlias}.regisseur`,
                this.#regisseurAlias,
            );
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = props[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#filmAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
