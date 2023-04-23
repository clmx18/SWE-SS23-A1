import {
    type MiddlewareConsumer,
    Module,
    type NestModule,
} from '@nestjs/common';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware.js';
import { LoggerModule } from './logger/logger.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
    imports: [
        HealthModule,
        LoggerModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggerMiddleware)
    }
}
