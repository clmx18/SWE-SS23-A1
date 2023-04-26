/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul enthält die Entity-Klasse 'SchauspielerDTO'
 * @packageDocumentation
 */
import {
    IsISO8601,
    IsInt,
    IsJSON,
    IsOptional,
    IsPositive,
    MaxLength,
} from 'class-validator';

/**
 * Entity-Klasse für einen Schauspieler ohne TypeORM und mit Validierung
 */
export class SchauspielerDTO {
    @MaxLength(32)
    readonly vorname: string | undefined;

    @MaxLength(32)
    readonly nachname: string | undefined;

    @IsISO8601({ strict: true })
    readonly geburtsdatum: Date | string | undefined;

    @IsInt()
    @IsPositive()
    @IsOptional()
    readonly groesse: number | undefined;

    @IsJSON()
    @IsOptional()
    readonly sozialeMedien: { twitter: string; instagram: string } | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
