/**
 * Das Modul enthält die möglichen Fehlerfälle, die beim Schreiben von Filmen, in die DB, abgefagen werden.
 * @packageDocumentation
 */

import { Suchkriterien } from './film-read.service';

/**
 * Klasse für einen bereits existierenden Film.
 */
export interface MovieExists {
    readonly type: 'MovieExists';
    readonly suchkriterien?: Suchkriterien;
    readonly id?: number;
    readonly titel: string | undefined;
    readonly erscheinungsjahr: number | undefined;
    readonly spieldauer: number | undefined;
}

/**
 * Klasse für einen nicht bereits existierenden Film.
 */
export interface MovieDoesNotExist {
    readonly type: 'MovieDoesNotExist';
    readonly id: number | undefined;
}

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: number;
    readonly version: number;
}

/**
 * Union-Type für die möglichen Fehler beim Hinzufügen eines neuen Films in die DB:
 * - {@linkcode MovieExists}
 */
export type CreateError = MovieExists;

/**
 * Union-Type für die möglichen Fehler beim Ändern eines Films in der DB:
 * - {@linkcode MovieDoesNotExist}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError = MovieDoesNotExist | VersionInvalid | VersionOutdated;
