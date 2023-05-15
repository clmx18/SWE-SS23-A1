/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from './testserver.js';
import { type FilmDTO } from '../src/film/graphql/film-query.resolver.js';
import { HttpStatus } from '@nestjs/common';

/* eslint-disable jest/no-export */
export type GraphQLQuery = Pick<GraphQLRequest, 'query'>;
export type GraphQLResponseBody = Pick<GraphQLResponse, 'data' | 'errors'>;
/* eslint-enable jest/no-export */

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
