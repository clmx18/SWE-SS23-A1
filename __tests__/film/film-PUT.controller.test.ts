/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment */
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
import { HttpStatus } from '@nestjs/common';
import { loginRest } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaenderterFilm: FilmDTO = {
    titel: 'The Godfather',
    rating: 5,
    genre: 'DRAMA',
    spieldauer: 176,
    erscheinungsjahr: 1972,
    regisseur: {
        vorname: 'Francis Ford',
        nachname: 'Coppola',
        geburtsdatum: '1939-04-07',
    },
    schauspieler: [
        {
            vorname: 'Marlon',
            nachname: 'Brando',
            geburtsdatum: '1924-04-03',
            groesse: 175,
            sozialeMedien: {
                twitter: '@marlonbrando',
                instagram: '@marlonbrando',
            },
        },
        {
            vorname: 'Al',
            nachname: 'Pacino',
            geburtsdatum: '1940-04-25',
            groesse: 167,
            sozialeMedien: undefined,
        },
    ],
};

const idVorhanden = '1001';

const geaenderterFilmIdNichtVorhanden: FilmDTO = {
    titel: 'The Godfather',
    rating: 5,
    genre: 'DRAMA',
    spieldauer: 176,
    erscheinungsjahr: 1972,
    regisseur: {
        vorname: 'Francis Ford',
        nachname: 'Coppola',
        geburtsdatum: '1939-04-07',
    },
    schauspieler: [
        {
            vorname: 'Marlon',
            nachname: 'Brando',
            geburtsdatum: '1924-04-03',
            groesse: 175,
            sozialeMedien: {
                twitter: '@marlonbrando',
                instagram: '@marlonbrando',
            },
        },
        {
            vorname: 'Al',
            nachname: 'Pacino',
            geburtsdatum: '1940-04-25',
            groesse: 167,
            sozialeMedien: undefined,
        },
    ],
};
const idNichtVorhanden = '999999';

const geaenderterFilmInvalid: Record<string, unknown> = {
    titel: '123',
    rating: 51,
    genre: 'ROMCOM',
    spieldauer: -1,
    erscheinungsjahr: -1,
    regisseur: {
        vorname: 'ad',
        nachname: 'da',
        geburtsdatum: 'aed',
    },
    schauspieler: [
        {
            vorname: 'aed',
            nachname: 'aed',
            geburtsdatum: 'aed',
            groesse: -1,
            sozialeMedien: undefined,
        },
    ],
};

const veralterFilm: FilmDTO = {
    titel: 'The Godfather',
    rating: 5,
    genre: 'DRAMA',
    spieldauer: 176,
    erscheinungsjahr: 1972,
    regisseur: {
        vorname: 'Francis Ford',
        nachname: 'Coppola',
        geburtsdatum: '1939-04-07',
    },
    schauspieler: [
        {
            vorname: 'Marlon',
            nachname: 'Brando',
            geburtsdatum: '1924-04-03',
            groesse: 175,
            sozialeMedien: {
                twitter: '@marlonbrando',
                instagram: '@marlonbrando',
            },
        },
        {
            vorname: 'Al',
            nachname: 'Pacino',
            geburtsdatum: '1940-04-25',
            groesse: 167,
            sozialeMedien: undefined,
        },
    ],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /rest/:id', () => {
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
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Vorhandenen Film aendern', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenen Film  aendern', async () => {
        // given
        const url = `/rest/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilmIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe(
            `Es gibt keinen Film mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenen Film aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';
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
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilmInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);

        const messages: string[] = data.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    test('Vorhandenen Film aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenen Film aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veralterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandenen Film aendern, aber ohne Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandenen Film aendern, aber mit falschem Token', async () => {
        // given
        const url = `/rest/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaenderterFilm,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
/* eslint-enable max-lines, @typescript-eslint/no-unsafe-assignment*/
