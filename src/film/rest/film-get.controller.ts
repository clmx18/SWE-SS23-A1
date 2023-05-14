/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */
/* eslint-disable max-lines */
// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { type Film, type Genre } from '../entity/film.entity.js';
import {
    FilmReadService,
    type Suchkriterien,
} from '../service/film-read.service.js';
import { Request, Response } from 'express';
import { Regisseur } from '../entity/regisseur.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { Schauspieler } from '../entity/schauspieler.entity.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    /** href-Link für HATEOAS-Links */
    href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    self: Link;
    /** Optionaler Linke für list */
    list?: Link;
    /** Optionaler Linke für add */
    add?: Link;
    /** Optionaler Linke für update */
    update?: Link;
    /** Optionaler Linke für remove */
    remove?: Link;
}

/** Film-Objekt mit HATEOAS-Links */
export type RegisseurModel = Omit<Regisseur, 'id' | 'version'>;
export type SchauspielerModel = Omit<Schauspieler, 'id' | 'version'>;
export type FilmModel = Omit<
    Film,
    'aktualisiert' | 'erzeugt' | 'id' | 'regisseur' | 'schauspieler' | 'version'
> & {
    regisseur: RegisseurModel | undefined;
    schauspieler: SchauspielerModel[] | undefined;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Film-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface FilmeModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        filme: FilmModel[];
    };
}

/**
 * Klasse für `FilmGetController`, um Queries in _OpenAPI_ zu
 * formulieren.
 */
export class FilmQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly titel: string;

    @ApiProperty({ required: false })
    declare readonly rating: number;

    @ApiProperty({ required: false })
    declare readonly genre: Genre;

    @ApiProperty({ required: false })
    declare readonly spieldauer: number;

    @ApiProperty({ required: false })
    declare readonly erscheinungsjahr: number;

    @ApiProperty({ required: false })
    declare readonly mitRegisseur: boolean;

    @ApiProperty({ required: false })
    declare readonly mitSchauspielern: boolean;
}

/**
 * Die Controller-Klasse für die Verwaltung von Filmen.
 */
@Controller(paths.rest)
// @UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film API')
// @ApiBearerAuth()
// Klassen ab ES 2015
export class FilmGetController {
    // readonly in TypeScript
    // private ab ES 2019
    readonly #service: FilmReadService;

    readonly #logger = getLogger(FilmGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: FilmReadService) {}
    constructor(service: FilmReadService) {
        this.#service = service;
    }

    /**
     * Ein Film wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Film-ID', tags: ['Suchen'] })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 1000',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Der Film wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Film zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Der Film wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let film: Film | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            film = await this.#service.findById({ id });
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (film === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): film=%o', film);

        // ETags
        const versionDb = film.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        if (version !== undefined && version !== `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_ACCEPTABLE');
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const filmModel = this.#toModel(film, req);
        this.#logger.debug('findById: filmModel=%o', filmModel);
        return res.json(filmModel);
    }

    /**
     * Bücher werden mit Query-Parametern asynchron gesucht.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien', tags: ['Suchen'] })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Filmen' })
    async find(
        @Query() query: FilmQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<FilmeModel | undefined>> {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const filme = await this.#service.find(query);
        this.#logger.debug('find: %o', filme);
        if (filme.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Film
        const filmeModel = filme.map((film) => this.#toModel(film, req, false));
        this.#logger.debug('find: filmeModel=%o', filmeModel);

        const result: FilmeModel = { _embedded: { filme: filmeModel } };
        return res.json(result).send();
    }

    #toModel(film: Film, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = film;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: film=%o, links=%o', film, links);
        /* eslint-disable unicorn/consistent-destructuring */
        const filmModel: FilmModel = {
            titel: film.titel,
            rating: film.rating,
            genre: film.genre,
            spieldauer: film.spieldauer,
            erscheinungsjahr: film.erscheinungsjahr,
            regisseur: film.regisseur
                ? this.#regisseurToModel(film.regisseur)
                : undefined,
            schauspieler: film.schauspieler
                ? this.#schauspielerToModel(film.schauspieler)
                : undefined,
            _links: links,
        };
        /* eslint-enable unicorn/consistent-destructuring */

        return filmModel;
    }

    #regisseurToModel(regisseur: Regisseur) {
        const regisseurModel: RegisseurModel = {
            vorname: regisseur.vorname,
            nachname: regisseur.nachname,
            geburtsdatum: regisseur.geburtsdatum,
            filme: regisseur.filme,
        };
        return regisseurModel;
    }

    #schauspielerToModel(schauspieler: Schauspieler[]) {
        const schauspielerModel = schauspieler.map((actor) => {
            const actorModel = {
                vorname: actor.vorname,
                nachname: actor.nachname,
                geburtsdatum: actor.geburtsdatum,
                groesse: actor.groesse,
                sozialeMedien: actor.sozialeMedien,
            };
            return actorModel;
        });
        return schauspielerModel;
    }
}
/*eslint-enable max-lines */
