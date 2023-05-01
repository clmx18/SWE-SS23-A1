import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { AuthModule } from './security/auth/auth.module.js';
import { DevModule } from './config/dev/dev.module.js';
import { FilmGetController } from './film/rest/film-get.controller.js';
import { FilmModule } from './film/film.module.js';
import { HealthModule } from './health/health.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleOptions } from './config/db.js';

@Module({
    imports: [
        DevModule,
        AuthModule,
        FilmModule,
        HealthModule,
        LoggerModule,
        TypeOrmModule.forRoot(typeOrmModuleOptions),
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes(FilmGetController, 'auth');
    }
}
