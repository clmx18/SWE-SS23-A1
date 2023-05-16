import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type FilmDTO } from '../../src/film/rest/filmDTO.entity.js';
import { FilmReadService } from '../../src/film/service/film-read.service.js';
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const neuerFilm: FilmDTO = {
    titel: 'Interstellar',
    rating: 5,
    genre: 'DRAMA',
    spieldauer: 169,
    erscheinungsjahr: 2014,
    regisseur: {
        vorname: 'Christopher',
        nachname: 'Nolan',
        geburtsdatum: '1970-07-30',
    },
    schauspieler: [
        {
            vorname: 'Matthew',
            nachname: 'McConaughey',
            geburtsdatum: '1969-11-04',
            groesse: 182,
            sozialeMedien: undefined,
        },
    ],
};
const neuerFilmInvalid: Record<string, unknown> = {
    titel: 'SehrLangerGutUnüberlegterTitelDerAufJedenFallZuLangIst',
    rating: 6,
    genre: 'ROMCOM',
    spieldauer: -1,
    erscheinungsjahr: -1,
    regisseur: {
        vorname: 'Christopher',
        nachname: 'Nolan',
        geburtsdatum: '20.03.1990',
    },
    schauspieler: [
        {
            vorname: 'Matthew',
            nachname: 'McConaughey',
            geburtsdatum: '1969-11-04',
            groesse: -1,
            sozialeMedien: undefined,
        },
    ],
};
const neuerFilmExistiert: FilmDTO = {
    titel: 'The Godfather',
    rating: 5,
    genre: 'DRAMA',
    spieldauer: 175,
    erscheinungsjahr: 1972,
    regisseur: {
        vorname: 'Francis Ford',
        nachname: 'Coppola',
        geburtsdatum: '1939-04-07',
    },
    schauspieler: undefined,
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('POST /rest', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Neuer Film', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/rest',
            neuerFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.CREATED);

        const { location } = response.headers as { location: string };

        expect(location).toBeDefined();

        // ObjectID: Muster von HEX-Ziffern
        const indexLastSlash: number = location.lastIndexOf('/');

        expect(indexLastSlash).not.toBe(-1);

        const idStr = location.slice(indexLastSlash + 1);

        expect(idStr).toBeDefined();
        expect(FilmReadService.ID_PATTERN.test(idStr)).toBe(true);

        expect(data).toBe('');
    });

    test('Neuer Film mit ungueltigen Daten', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        const expectedMsg = [
            expect.stringMatching(/^titel /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^genre /u),
            expect.stringMatching(/^spieldauer /u),
            expect.stringMatching(/^erscheinungsjahr /u),
            expect.stringMatching(/^regisseur.regisseur /u),
            expect.stringMatching(/^schauspieler.schauspieler /u),
        ];

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuerFilmInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Neuer Film, der bereits existiert', async () => {
        // given
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<string> = await client.post(
            '/rest',
            neuerFilmExistiert,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(expect.stringContaining('ISBN'));
    });

    test('Neuer Film, aber ohne Token', async () => {
        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuerFilm,
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Neuer Film, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.post(
            '/rest',
            neuerFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test.todo('Abgelaufener Token');
});
