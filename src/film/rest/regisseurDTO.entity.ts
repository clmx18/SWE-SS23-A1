/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul enthält die Entity-Klasse 'RegisseurDTO'
 * @packageDocumentation
 */
import { IsISO8601, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für einen Regisseur ohne TypeORM und mit Validierung
 */
export class RegisseurDTO {
    @MaxLength(20)
    readonly vorname: string | undefined;

    @MaxLength(20)
    readonly nachname: string | undefined;

    @IsISO8601({ strict: true })
    readonly geburtsdatum: Date | string | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
