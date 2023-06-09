/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul enthält die Entity-Klasse 'SchauspielerDTO'
 * @packageDocumentation
 */
import {
    IsISO8601,
    IsInt,
    IsObject,
    IsOptional,
    IsPositive,
    MaxLength,
} from 'class-validator';

/**
 * Entity-Klasse für einen Schauspieler ohne TypeORM und mit Validierung
 */
export class SchauspielerDTO {
    @MaxLength(20)
    readonly vorname: string | undefined;

    @MaxLength(20)
    readonly nachname: string | undefined;

    @IsISO8601({ strict: true })
    readonly geburtsdatum: Date | string | undefined;

    @IsInt()
    @IsPositive()
    @IsOptional()
    readonly groesse: number | undefined;

    @IsOptional()
    @IsObject()
    readonly sozialeMedien: { twitter: string; instagram: string } | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
