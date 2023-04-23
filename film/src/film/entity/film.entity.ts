/**
 * Das Modul enthält die Entity-Klasse 'Film'
 * @packageDocumentation
 */
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Regisseur } from './regisseur.entity.js';
import { Schauspieler } from './schauspieler.entity.js';

/**
 * Union-Type für die bei Filmen zur Einteilung verfügbaren Genres
 */
export type Genre = 'Action' | 'Adventure' | 'Comedy' | 'Horror';

/**
 * Entity-Klasse für das Abbilden von Filmen
 */
@Entity()
export class Film {
    @Column('int')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Titanic', type: String })
    readonly titel: string | undefined;

    @Column('varchar')
    @ApiProperty({ example: 'Comedy', type: String })
    readonly genre: Genre | undefined;

    @Column('int')
    @ApiProperty({ example: 2, type: Number })
    readonly rating: number | undefined;

    @Column('int')
    @ApiProperty({ example: 90, type: Number })
    readonly spieldauer: number | undefined;

    @Column('int')
    @ApiProperty({ example: 1989, type: Number })
    readonly erscheinungsjahr: number | undefined;

    @ManyToOne(() => Regisseur, (regisseur) => regisseur.filme)
    @JoinColumn({ name: 'regisseur_id' })
    regisseur: Regisseur | undefined;

    @ManyToMany(() => Schauspieler)
    @JoinTable()
    schauspieler: Schauspieler | undefined;

    @CreateDateColumn('timestamp')
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn('timestamp')
    readonly aktualisiert: Date | undefined;
}
