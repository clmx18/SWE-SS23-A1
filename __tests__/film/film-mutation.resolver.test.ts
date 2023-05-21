/* @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion */
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
                            id: 1006,
                            titel: "Titanic",
                            genre: DRAMA,
                            rating: 4,
                            spieldauer: 189,
                            erscheinungsjahr: 1997,
                            regisseur: {
                                id: 1008,
                                version: 0,
                                vorname: "John",
                                nachname: "Doe",
                                geburtsdatum: "1961-10-31"
                            },
                            schauspieler: [{
                                id: 1010,
                                version:0,
                                vorname: "Jane",
                                nachname: "Doe",
                                geburtsdatum: "1956-07-09",
                                groesse: 180
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

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ObjectID
        expect(create).toBeDefined();
        expect(FilmReadService.ID_PATTERN.test(create as string)).toBe(true);
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
                            id: 1006,
                            titel: "Titanic",
                            genre: DRAMA,
                            rating: 9,
                            spieldauer: 189,
                            erscheinungsjahr: 1997,
                            regisseur: {
                                id: 1008,
                                version: 0,
                                vorname: "John",
                                nachname: "Doe",
                                geburtsdatum: "1961-10-31"
                            },
                            schauspieler: [{
                                id: 1010,
                                version:0,
                                vorname: "Jane",
                                nachname: "Doe",
                                geburtsdatum: "1956-07-09",
                                groesse: 180
                            }]
                        }
                    )
                }
            `,
        };

        const expectedMsg = [
            expect.stringMatching(/^version /u),
            expect.stringMatching(/^version /u),
            expect.stringMatching(/^rating /u),
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
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(data.data!.update).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const [error] = errors!;
        const extensions: any = error?.extensions;

        expect(extensions).toBeDefined();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messages: string[] = extensions.originalError.message;

        expect(messages).toBeDefined();
        expect(messages).toHaveLength(expectedMsg.length);
        expect(messages).toEqual(expect.anything());
    });
});
