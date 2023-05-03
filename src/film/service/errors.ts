/**
 * Das Modul enthält die möglichen Fehlerfälle, die beim Schreiben von Filmen, in die DB, abgefagen werden.
 * @packageDocumentation
 */

import { Suchkriterien } from './film-read.service';

/**
 * Klasse für eine bereits existierende ID.
 */
export interface MovieExists {
    readonly type: 'MovieExists';
    readonly suchkriterien: Suchkriterien;
}

/**
 * Union-Type für die möglichen Fehler beim Hinzufügen eines neuen Films in die DB:
 * - {@linkcode MovieExists}
 */
export type CreateError = MovieExists;
