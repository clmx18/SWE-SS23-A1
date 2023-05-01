import fs from 'node:fs';
import fsExtra from 'fs-extra';
import path from 'node:path';

const { copyFileSync, mkdirSync } = fs;
const { copySync } = fsExtra;
const { join } = path

// BEACHTE: "assets" innerhalb von nest-cli.json werden bei "--watch" NICHT beruecksichtigt
// https://docs.nestjs.com/cli/monorepo#global-compiler-options

const src = 'src';
const dist = 'dist';
if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
}

const configSrc = join(src, 'config');
const configDist = join(dist, src, 'config');

//TODO Add copy actions for db scripts

// PEM-Dateien fuer TLS kopieren
const tlsPemSrc = join(configSrc, 'tls');
const tlsPemDist = join(configDist, 'tls');
mkdirSync(tlsPemDist, { recursive: true });
copySync(tlsPemSrc, tlsPemDist);

// PEM-Dateien fuer JWT kopieren
const jwtPemSrc = join(configSrc, 'jwt');
const jwtPemDist = join(configDist, 'jwt');
mkdirSync(jwtPemDist, { recursive: true });
copySync(jwtPemSrc, jwtPemDist);

//TODO Add copy actions für GraphQL!