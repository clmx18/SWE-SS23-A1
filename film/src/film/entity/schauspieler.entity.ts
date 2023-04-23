import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Entity-Klasse für das Abbilden von Schauspielern
 */
@Entity()
export class Schauspieler {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Quentin', type: String })
    readonly vorname: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Tarantino', type: String })
    readonly nachname: string | undefined;

    @Column('date')
    @ApiProperty({ example: '1963-03-27', type: Date })
    readonly geburtsdatum: Date | undefined;

    @Column('int')
    @ApiProperty({ example: 179, type: Number })
    readonly groesse: number | undefined;

    @Column('simple-json')
    @ApiProperty({ example: '{ twitter: @peter1 }', type: JSON })
    readonly sozialeMedien: { twitter: string; instagram: string } | undefined;
}
