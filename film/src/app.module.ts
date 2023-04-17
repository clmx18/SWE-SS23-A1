import {
    Module,
    type NestModule,
} from '@nestjs/common';

@Module({
    imports: [],
})
export class AppModule implements NestModule {
    configure() {}
}
