import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Film } from './film.entity.js';

/**
 * Entity-Klasse für das Abbilden von Regisseueren
 */
@Entity()
export class Regisseur {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Quentin', type: String })
    readonly vorname: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Tarantino', type: String })
    readonly nachname: string | undefined;

    @Column('date')
    @ApiProperty({ example: '1963-03-27', type: Date })
    readonly geburtsdatum: Date | undefined;

    @OneToMany(() => Film, (film) => film.regisseur, {
        cascade: ['insert', 'remove'],
    })
    readonly filme: Film[] | undefined;
}
