import { AuthModule } from '../security/auth/auth.module.js';
import { FilmGetController } from './rest/film-get.controller.js';
import { FilmMutationResolver } from './graphql/film-mutation.resolver.js';
import { FilmQueryResolver } from './graphql/film-query.resolver.js';
import { FilmReadService } from './service/film-read.service.js';
import { FilmWriteController } from './rest/film-write.controller.js';
import { FilmWriteService } from './service/film-write.service.js';
import { Module } from '@nestjs/common';
import { QueryBuilder } from './service/query-builder.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Filmen.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [TypeOrmModule.forFeature(entities), AuthModule],
    controllers: [FilmGetController, FilmWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        FilmReadService,
        FilmWriteService,
        FilmQueryResolver,
        FilmMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [FilmReadService, FilmWriteService],
})
export class FilmModule {}
