/**
 * Das Modul besteht aus der Klasse {@linkcode FilmWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */
/* eslint-disable max-lines */
import {
    CreateError,
    MovieDoesNotExist,
    UpdateError,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { type DeleteResult, Repository } from 'typeorm';
import { FilmReadService, Suchkriterien } from './film-read.service.js';
import { Film } from '../entity/film.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import RE2 from 're2';
import { Regisseur } from '../entity/regisseur.entity.js';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { SchauspielerDTO } from '../rest/schauspielerDTO.entity';
import { getLogger } from '../../logger/logger.js';

/** Interface für die Informationen, die zum Updaten eines Films notwendig sind */
export interface UpdateParams {
    /** ID des Films */
    id: number | undefined;
    /** Film mit aktuellen Werten */
    film: Film;
    /** Versionsnummer für die neuen Daten des Films */
    version: string;
}
@Injectable()
export class FilmWriteService {
    private static readonly VERSION_PATTERN = new RE2('"-?[\\d]*"');

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

    /**
     * Einen vorhandenen Film aktualisieren
     * @param film Der zu aktualisierende Film
     * @param id ID des Films
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/film_service_errors.UpdateError.html)
     */
    async update({
        id,
        film,
        version,
    }: UpdateParams): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%d, film=%o, version=%s',
            id,
            film,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Ungültige ID angegeben');
            return { type: 'MovieDoesNotExist', id };
        }

        const validateResult = await this.#validateUpdate(film, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Film)) {
            return validateResult;
        }

        const filmDb = validateResult;
        film.schauspieler = this.#removeDuplicatesSchauspieler(filmDb, film);

        const merged = this.#repo.merge(filmDb, film);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Einen Film anhand einer ID löschen
     *
     * @param id ID des Films
     * @returns true, falls ein Film gelöscht wurde. Sonst false.
     */
    async delete(id: number) {
        this.#logger.debug('delete: id=%d', id);
        const film = await this.#readService.findById({
            id,
            mitRegisseuren: true,
            mitSchauspielern: true,
        });
        if (film === undefined) {
            return false;
        }

        let deleteResult: DeleteResult | undefined;
        await this.#repo.manager.transaction(async (transactionalMgr) => {
            deleteResult = await transactionalMgr.delete(Film, id);

            const schauspieler = film.schauspieler ?? [];
            for (const actor of schauspieler) {
                await transactionalMgr.delete(Schauspieler, actor.id);
            }

            const regisseurId = film.regisseur?.id;
            if (regisseurId !== undefined) {
                await transactionalMgr.delete(Regisseur, regisseurId);
            }

            this.#logger.debug('delete: deleteResult=%o', deleteResult);
        });

        return (
            deleteResult?.affected !== undefined &&
            deleteResult.affected !== null &&
            deleteResult.affected > 0
        );
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
            return { type: 'MovieExists', titel, erscheinungsjahr, spieldauer };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        film: Film,
        id: number,
        versionStr: string,
    ): Promise<Film | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: film=%o, version=%s',
            film,
            version,
        );

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !FilmWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(
        id: number,
        version: number,
    ): Promise<Film | MovieDoesNotExist | VersionOutdated> {
        const filmDb = await this.#readService.findById({ id });
        if (filmDb === undefined) {
            const result: MovieDoesNotExist = { type: 'MovieDoesNotExist', id };
            this.#logger.debug(
                '#findByIdAndCheckVersion: MovieDoesNotExist=%o',
                result,
            );
            return result;
        }

        const versionDb = filmDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#findByIdAndCheckVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return filmDb;
    }

    #schauspielerToSchauspielerDto(
        schauspieler: Schauspieler,
    ): SchauspielerDTO {
        const schauspielerDto: SchauspielerDTO = {
            vorname: schauspieler.vorname,
            nachname: schauspieler.nachname,
            geburtsdatum:
                typeof schauspieler.geburtsdatum === 'string'
                    ? new Date(schauspieler.geburtsdatum)
                    : schauspieler.geburtsdatum,
            groesse: schauspieler.groesse,
            sozialeMedien: schauspieler.sozialeMedien,
        };
        return schauspielerDto;
    }

    #compareSchauspieler(
        schauspielerA: Schauspieler,
        schauspielerB: Schauspieler,
    ): boolean {
        this.#logger.debug(
            '#compareSchauspieler: schauspielerA=%o, schauspielerB=%o',
            schauspielerA,
            schauspielerB,
        );
        const schauspielerADto =
            this.#schauspielerToSchauspielerDto(schauspielerA);
        const schauspielerBDto =
            this.#schauspielerToSchauspielerDto(schauspielerB);
        this.#logger.debug(
            '#compareSchauspieler: stringifyA=%s, stringifyB=%s, bool=%s',
            JSON.stringify(schauspielerADto),
            JSON.stringify(schauspielerBDto),
            JSON.stringify(schauspielerADto) ===
                JSON.stringify(schauspielerBDto),
        );
        const returner =
            JSON.stringify(schauspielerADto) ===
            JSON.stringify(schauspielerBDto);
        return returner;
    }

    #removeDuplicatesSchauspieler(
        filmDb: Film,
        film: Film,
    ): Schauspieler[] | undefined {
        this.#logger.debug(
            '#removeDuplicatesSchauspieler: filmDb=%o, film=%o',
            filmDb,
            film,
        );
        if (
            film.schauspieler !== undefined &&
            filmDb.schauspieler !== undefined
        ) {
            const neueSchauspieler: Schauspieler[] = [];
            film.schauspieler.forEach((schauspielerA) => {
                let duplicate = false;
                filmDb.schauspieler?.forEach((schauspielerB) => {
                    if (
                        this.#compareSchauspieler(schauspielerA, schauspielerB)
                    ) {
                        duplicate = true;
                    }
                });
                //eslint-disable-next-line  @typescript-eslint/no-unnecessary-condition
                if (!duplicate) {
                    neueSchauspieler.push(schauspielerA);
                }
            });
            this.#logger.debug(
                '#removeDuplicatesSchauspieler: neueSchauspieler=%o',
                neueSchauspieler,
            );
            return neueSchauspieler;
        }
        return undefined;
    }
}
/* eslint-enable max-lines */
