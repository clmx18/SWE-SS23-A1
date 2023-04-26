/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul enthält die Entity-Klasse 'RegisseurDTO'
 * @packageDocumentation
 */
import {
    ArrayUnique,
    IsArray,
    IsISO8601,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { FilmDTO } from './filmDTO.entity.js';
import { Type } from 'class-transformer';

/**
 * Entity-Klasse für einen Regisseur ohne TypeORM und mit Validierung
 */
export class RegisseurDTO {
    @MaxLength(32)
    readonly vorname: string | undefined;

    @MaxLength(32)
    readonly nachname: string | undefined;

    @IsISO8601({ strict: true })
    readonly geburtsdatum: Date | string | undefined;

    @IsArray()
    @ArrayUnique()
    @ValidateNested()
    @Type(() => FilmDTO)
    readonly filme: FilmDTO[] | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
