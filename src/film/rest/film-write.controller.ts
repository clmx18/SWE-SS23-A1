/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */
/* eslint-disable max-lines */
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    Delete,
    Headers,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { Request, Response } from 'express';
import { type Film } from '../entity/film.entity.js';
import { FilmDTO } from './filmDTO.entity.js';
import { FilmWriteService } from '../service/film-write.service.js';
import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGuard } from '../../security/auth/roles/roles.guard.js';
import { type Schauspieler } from '../entity/schauspieler.entity.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/**
 * Die Controller-Klasse für die Verwaltung von Filmen.
 */
@Controller(paths.rest)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Film API')
@ApiBearerAuth()
export class FilmWriteController {
    readonly #service: FilmWriteService;

    readonly #logger = getLogger(FilmWriteController.name);

    constructor(service: FilmWriteService) {
        this.#service = service;
    }

    /**
     * Ein neuer Film wird asynchron angelegt.
     *
     * @param film JSON-Daten für einen Film im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @RolesAllowed('admin', 'user')
    @ApiOperation({ summary: 'Einen neuen Film anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Filmdaten' })
    async create(
        @Body() filmDTO: FilmDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('create: filmDTO=%o', filmDTO);

        const film = this.#filmDtoToFilm(filmDTO);
        const result = await this.#service.create(film);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            return this.#handleCreateError(result as CreateError, res);
        }

        const location = `${getBaseUri(req)}/${result as number}`;
        this.#logger.debug('create: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandener Film wird asynchron aktualisiert.
     *
     * @param film Filmdaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @RolesAllowed('admin', 'user')
    @ApiOperation({
        summary: 'Einen vorhandenen Film aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiHeader({
        name: 'Authorization',
        description: 'Header für JWT',
        required: true,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Filmdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    async update(
        @Body() filmDTO: FilmDTO,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'update: id=%s, filmDTO=%o, version=%s',
            id,
            filmDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('#handleUpdateError: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }

        const film = this.#filmDtoToFilm(filmDTO);
        const result = await this.#service.update({ id, film, version });
        if (typeof result === 'object') {
            return this.#handleUpdateError(result, res);
        }

        this.#logger.debug('update: version=%d', result);
        return res.set('ETag', `"${result}"`).sendStatus(HttpStatus.NO_CONTENT);
    }

    /**
     * Ein Film wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param id Pfad-Paramater für die ID.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Delete(':id')
    @RolesAllowed('admin')
    @ApiOperation({ summary: 'Film mit der ID löschen', tags: ['Loeschen'] })
    @ApiHeader({
        name: 'Authorization',
        description: 'Header für JWT',
        required: true,
    })
    @ApiNoContentResponse({
        description: 'Der Film wurde gelöscht',
    })
    @ApiNotFoundResponse({
        description: 'Der Film war nicht vorhanden',
    })
    async delete(
        @Param('id') id: number,
        @Res() res: Response,
    ): Promise<Response<undefined>> {
        this.#logger.debug('delete: id=%s', id);

        try {
            const deleteResult = await this.#service.delete(id);
            if (!deleteResult) {
                return res.sendStatus(HttpStatus.NOT_FOUND);
            }
        } catch (err) {
            this.#logger.error('delete: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return res.sendStatus(HttpStatus.NO_CONTENT);
    }

    #filmDtoToFilm(filmDTO: FilmDTO): Film {
        let regisseur;
        if (filmDTO.regisseur) {
            const regisseurDTO = filmDTO.regisseur;
            regisseur = {
                id: undefined,
                version: undefined,
                vorname: regisseurDTO.vorname,
                nachname: regisseurDTO.nachname,
                geburtsdatum:
                    typeof regisseurDTO.geburtsdatum === 'string'
                        ? new Date(regisseurDTO.geburtsdatum)
                        : regisseurDTO.geburtsdatum,
                filme: undefined,
            };
        }
        const schauspieler = filmDTO.schauspieler?.map((schauspielerDTO) => {
            const actor: Schauspieler = {
                id: undefined,
                version: undefined,
                vorname: schauspielerDTO.vorname,
                nachname: schauspielerDTO.nachname,
                geburtsdatum:
                    typeof schauspielerDTO.geburtsdatum === 'string'
                        ? new Date(schauspielerDTO.geburtsdatum)
                        : schauspielerDTO.geburtsdatum,
                groesse: schauspielerDTO.groesse,
                sozialeMedien: schauspielerDTO.sozialeMedien,
            };
            return actor;
        });
        const film = {
            id: undefined,
            version: undefined,
            titel: filmDTO.titel,
            genre: filmDTO.genre,
            rating: filmDTO.rating,
            spieldauer: filmDTO.spieldauer,
            erscheinungsjahr: filmDTO.erscheinungsjahr,
            regisseur,
            schauspieler,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
        return film;
    }

    #handleCreateError(err: CreateError, res: Response) {
        //eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (err.type === 'MovieExists') {
            return this.#handleMovieExists(err, res);
        }
        return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    #handleMovieExists(err: CreateError, res: Response): Response {
        const msg = `Der Film '${err.titel}'(${err.erscheinungsjahr}) mit Spieldauer ${err.spieldauer} Minuten existiert bereits.`;
        this.#logger.debug('#handleMovieExists(): msg=%s', msg);
        return res
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    #handleUpdateError(err: UpdateError, res: Response): Response {
        switch (err.type) {
            case 'MovieDoesNotExist': {
                const { id } = err;
                const msg = `Es gibt keinen Film mit der ID "${id}".`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionInvalid': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionOutdated': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            default: {
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
/* eslint-enable max-lines */
