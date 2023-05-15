/* eslint-disable max-len, @typescript-eslint/no-magic-numbers */

/**
 * Das Modul enthält die Entity-Klasse 'FilmDTO'
 * @packageDocumentation
 */
import {
    ArrayUnique,
    IsArray,
    IsInt,
    IsOptional,
    IsPositive,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Genre } from '../entity/film.entity.js';
import { RegisseurDTO } from './regisseurDTO.entity.js';
import { SchauspielerDTO } from './schauspielerDTO.entity.js';

export const MAX_RATING = 5;

/**
 * Entity-Klasse für einen Film ohne TypeORM und mit Validierung
 */
export class FilmDTO {
    @MaxLength(30)
    @ApiProperty({ example: 'Titanic', type: String })
    readonly titel: string | undefined;

    @MaxLength(32)
    @Matches(
        /^ACTION$|^ADVENTURE$|^ANIMATION$|^BIOGRAPHY$|^COMEDY$|^DRAMA$|^FANTASY$|^FILM-NOIR$|^HISTORY$|^HORROR$|^MYSTERY$|^ROMANCE$|^SCI-FI$|^THRILLER$|^WESTERN'/u,
    )
    @ApiProperty({ example: 'COMEDY', type: String })
    readonly genre: Genre | undefined;

    @Min(0)
    @Max(MAX_RATING)
    @ApiProperty({ example: 2, type: Number })
    readonly rating: number | undefined;

    @IsPositive()
    @IsInt()
    @ApiProperty({ example: 90, type: Number })
    readonly spieldauer: number | undefined;

    @IsPositive()
    @IsInt()
    @ApiProperty({ example: 1989, type: Number })
    readonly erscheinungsjahr: number | undefined;

    @ValidateNested()
    @Type(() => RegisseurDTO)
    regisseur: RegisseurDTO | undefined;

    @IsArray()
    @ArrayUnique()
    @ValidateNested()
    @IsOptional()
    @Type(() => SchauspielerDTO)
    schauspieler: SchauspielerDTO[] | undefined;
}
/* eslint-enable max-len, @typescript-eslint/no-magic-numbers */
