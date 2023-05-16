/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
import {
    type GraphQLQuery,
    type GraphQLResponseBody,
} from './film-query.resolver.test.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { FilmReadService } from '../../src/film/service/film-read.service.js';
import { HttpStatus } from '@nestjs/common';
import { loginGraphQL } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    // -------------------------------------------------------------------------
    test('Neuer Film', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            id: 123,
                            version: 123,
                            titel: "Interstellar",
                            genre: "DRAMA",
                            rating: 5,
                            spieldauer: 169,
                            erscheinungsjahr: 2014,
                            regisseur: {
                                vorname: "Christopher",
                                nachname: "Nolan",
                                geburtsdatum: "1970-07-30",
                            },
                            schauspieler: [{
                                "vorname": "Matthew",
                                "nachname": "McConaughey",
                                "geburtsdatum": "1969-11-04",
                                "groesse": 182,
                                "sozialeMedien": null
                            }]
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ObjectID
        expect(create).toBeDefined();
        expect(FilmReadService.ID_PATTERN.test(create as string)).toBe(true);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('Film mit ungueltigen Werten neu anlegen', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            id: abc,
                            version: abc,
                            titel: "SehrLangerGutUnüberlegterTitelDerAufJedenFallZuLangIst",
                            genre: "ROMCOM",
                            rating: 100,
                            spieldauer: -20,
                            erscheinungsjahr: -1,
                            schauspieler: {
                                "vorname": "Actor",
                                "nachname": "Actor",
                                "geburtsdatum": "42412.2",
                                "groesse": 2.2,
                                "sozialeMedien": "null"
                            }
                        }
                    )
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^titel /u),
            expect.stringMatching(/^genre /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^spieldauer /u),
            expect.stringMatching(/^erscheinungsjahr /u),
            expect.stringMatching(/^regisseur.regisseur /u),
            expect.stringMatching(/^schauspieler.schauspieler /u),
        ];

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.create).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const extensions: any = error?.extensions;

        expect(extensions).toBeDefined();

        const messages: string[] = extensions?.originalError?.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Neuer Film nur als "admin"/"user"', async () => {
        // given
        const token = await loginGraphQL(client, 'dirk.delta', 'p');
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            id: 111,
                            version: 111,
                            titel: "Interstellar",
                            genre: "DRAMA",
                            rating: 5,
                            spieldauer: 169,
                            erscheinungsjahr: 2014,
                            regisseur: {
                                vorname: "Christopher",
                                nachname: "Nolan",
                                geburtsdatum: "1970-07-30",
                            },
                            schauspieler: [{
                                "vorname": "Matthew",
                                "nachname": "McConaughey",
                                "geburtsdatum": "1969-11-04",
                                "groesse": 182,
                                "sozialeMedien": null
                            }]
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, extensions } = error!;

        expect(message).toBe('Forbidden resource');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('FORBIDDEN');
    });

    // -------------------------------------------------------------------------
    test('Film aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: 1001,
                            version: 1,
                            titel: "The Godfather",
                            genre: "DRAMA",
                            rating: 5,
                            spieldauer: 176,
                            erscheinungsjahr: 1972,
                            regisseur: {
                                vorname: "Francis",
                                nachname: "Ford",
                                geburtsdatum: "1939-04-07",
                            },
                            schauspieler: [{
                                "vorname": "Al",
                                "nachname": "Pacino",
                                "geburtsdatum": "1940-04-25",
                                "groesse": 167,
                                "sozialeMedien": null
                            }]
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const { update } = data.data!;

        // Der Wert der Mutation ist die neue Versionsnummer
        expect(update).toBe(1);
    });

    // -------------------------------------------------------------------------
    // eslint-disable-next-line max-lines-per-function
    test('Film mit ungueltigen Werten aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: 1001,
                            version: 1,
                            titel: "SehrLangerGutUnüberlegterTitelDerAufJedenFallZuLangIst",
                            genre: "ROMCOM",
                            rating: 100,
                            spieldauer: -20,
                            erscheinungsjahr: -1,
                            schauspieler: {
                                "vorname": "Actor",
                                "nachname": "Actor",
                                "geburtsdatum": "42412.2",
                                "groesse": 2.2,
                                "sozialeMedien": "null"
                            }
                        }
                    )
                }
            `,
        };
        const expectedMsg = [
            expect.stringMatching(/^titel /u),
            expect.stringMatching(/^genre /u),
            expect.stringMatching(/^rating /u),
            expect.stringMatching(/^spieldauer /u),
            expect.stringMatching(/^erscheinungsjahr /u),
            expect.stringMatching(/^regisseur.regisseur /u),
            expect.stringMatching(/^schauspieler.schauspieler /u),
        ];

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const extensions: any = error?.extensions;

        expect(extensions).toBeDefined();

        const messages: string[] = extensions.originalError.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.arrayContaining(expectedMsg));
    });

    // -------------------------------------------------------------------------
    test('Nicht-vorhandenen Film aktualisieren', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const id = '999999';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    update(
                        input: {
                            id: "${id}",
                            version: 1,
                            titel: "The Godfather",
                            genre: "DRAMA",
                            rating: 5,
                            spieldauer: 176,
                            erscheinungsjahr: 1972,
                            regisseur: {
                                vorname: "Francis",
                                nachname: "Ford",
                                geburtsdatum: "1939-04-07",
                            }
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(
            `Es gibt keinen Film mit der ID ${id.toLowerCase()}`,
        );
        expect(path).toBeDefined();
        expect(path!![0]).toBe('update');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    // -------------------------------------------------------------------------
    test('Film loeschen', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const id = '1001';
        const body: GraphQLQuery = {
            query: `
                mutation {
                    delete(id: "${id}")
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();

        const deleteMutation = data.data!.delete;

        // Der Wert der Mutation ist true (falls geloescht wurde) oder false
        expect(deleteMutation).toBe(true);
    });
});
/* eslint-enable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
