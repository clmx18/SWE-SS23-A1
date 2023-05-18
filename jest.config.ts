import { type Config } from '@jest/types';

const jestConfig: Config.InitialOptions = {
    // globalSetup: '<rootDir>/dist/__tests__/global-setup.js',
    // globalTeardown: '<rootDir>/dist/__tests__/global-teardown.js',
    // setupFilesAfterEnv: ['<rootDir>/dist/__tests__/setup-jest.js'],

    // Verzeichnis in node_modules mit einer Datei jest-preset.js
    // https://kulshekhar.github.io/ts-jest/docs/next/guides/esm-support
    // https://kulshekhar.github.io/ts-jest/docs/getting-started/presets
    // https://jestjs.io/docs/getting-started#via-ts-jest
    // https://swc.rs/docs/usage/jest: swc ("speedy web compiler") statt ts-jest
    preset: 'ts-jest/presets/default-esm',

    extensionsToTreatAsEsm: ['.ts', '.mts', '.json'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.m?js$': '$1', // eslint-disable-line @typescript-eslint/naming-convention
    },

    transform: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '\\.test\\.m?ts$': [
            'ts-jest',
            {
                useESM: true,
                isolatedModules: false,
            },
        ],
    },
    //Use jest default https://jestjs.io/docs/configuration#testregex-string--arraystring
    //testRegex: '__tests__\\.*\\\\.*test\\.m?ts$', //(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$
    collectCoverageFrom: ['<rootDir>/src/**/*.*ts'],
    // coverageDirectory: 'coverage',
    testEnvironment: 'node',

    bail: true,
    coveragePathIgnorePatterns: [
        '<rootDir>/src/main\\.m?ts$',
        '.*\\.module\\.m?ts$',
        '<rootDir>/src/health/',
    ],
    coverageReporters: ['text-summary', 'html'],
    errorOnDeprecated: true,
    // Hoher Timeout-Wert, insbesondere fuer den ersten Mutation-Test
    testTimeout: 60_000,
    verbose: true,
    // showSeed: true,
};

export default jestConfig;
