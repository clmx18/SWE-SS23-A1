/**
 * Das Modul enthält die Funktion, um die Test-DB neu zu laden.
 * @packageDocumentation
 */

import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import {
    adminDataSourceOptions,
    dbPopulate,
    typeOrmModuleOptions,
} from '../db.js';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { configDir } from '../node.js';
import { getLogger } from '../../logger/logger.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
 * initialisiert sind, was durch `OnApplicationBootstrap` realisiert wird.
 *
 * DB-Migration mit TypeORM (ohne Nest): https://typeorm.io/migrations
 */
@Injectable()
export class DbPopulateService implements OnApplicationBootstrap {
    readonly #tabellen = [
        'film',
        'regisseur',
        'schauspieler',
        'film_schauspieler',
    ];

    readonly #datasource: DataSource;

    readonly #logger = getLogger(DbPopulateService.name);

    /**
     * Initialisierung durch DI mit `DataSource` für SQL-Queries.
     */
    constructor(@InjectDataSource() dataSource: DataSource) {
        this.#datasource = dataSource;
    }

    /**
     * Die Test-DB wird im Development-Modus neu geladen.
     */
    async onApplicationBootstrap() {
        await this.populateTestdaten();
    }

    async populateTestdaten() {
        if (!dbPopulate) {
            return;
        }

        const basePath = resolve(
            configDir,
            'dev',
            typeOrmModuleOptions.type!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
        );
        this.#logger.warn(`${typeOrmModuleOptions.type}: DB wird neu geladen`);
        await this.#populatePostgres(basePath);
        this.#logger.warn('DB wurde neu geladen');
    }

    async #populatePostgres(basePath: string) {
        const dropScript = resolve(basePath, 'drop.sql');
        // https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
        const dropStatements = readFileSync(dropScript, 'utf8'); // eslint-disable-line security/detect-non-literal-fs-filename
        await this.#datasource.query(dropStatements);

        const createScript = resolve(basePath, 'create.sql');
        // https://nodejs.org/api/fs.html#fs_fs_readfilesync_path_options
        const createStatements = readFileSync(createScript, 'utf8'); // eslint-disable-line security/detect-non-literal-fs-filename
        await this.#datasource.query(createStatements);

        // https://typeorm.io/data-source
        const dataSource = new DataSource(adminDataSourceOptions);
        await dataSource.initialize();
        await dataSource.query(
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `SET search_path TO ${adminDataSourceOptions.database};`,
        );
        const copyStmt =
            "COPY %TABELLE% FROM '/csv/%TABELLE%.csv' (FORMAT csv, DELIMITER ';', HEADER true, QUOTE '\"', ESCAPE '\"');";
        for (const tabelle of this.#tabellen) {
            await dataSource.query(copyStmt.replace(/%TABELLE%/gu, tabelle));
        }
        await dataSource.destroy();
    }
}
