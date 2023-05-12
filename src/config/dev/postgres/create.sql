-- docker compose exec postgres bash
-- psql --dbname=film --username=film --file=/scripts/create-table-film.sql

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION film;

ALTER ROLE film SET search_path = 'film';

-- https://www.postgresql.org/docs/current/sql-createtype.html
-- https://www.postgresql.org/docs/current/datatype-enum.html
CREATE TYPE genreart AS ENUM ('ACTION', 'ADVENTURE', 'ANIMATION', 'BIOGRAPHY', 'COMEDY', 'CRIME','DRAMA', 'FANTASY', 'FILM-NOIR', 'HISTORY', 'HORROR', 'MYSTERY', 'ROMANCE', 'SCI-FI','THRILLER', 'WESTERN');

CREATE TABLE IF NOT EXISTS regisseur (
    id          integer GENERATED ALWAYS AS IDENTITY(START WITH 1005) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    version     integer NOT NULL DEFAULT 0,
    vorname     varchar(20) NOT NULL,
    nachname    varchar(20) NOT NULL,
    geburtsdatum  date NOT NULL
) TABLESPACE filmspace;

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html
CREATE TABLE IF NOT EXISTS film (
                  -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-INT
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS
                  -- impliziter Index fuer Primary Key
    id            integer GENERATED ALWAYS AS IDENTITY(START WITH 1005) PRIMARY KEY USING INDEX TABLESPACE filmspace,
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#id-1.5.4.6.6
    version       integer NOT NULL DEFAULT 0,
                  -- impliziter Index als B-Baum durch UNIQUE
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS
    titel          varchar(30) NOT NULL UNIQUE USING INDEX TABLESPACE filmspace,
                  -- https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS
                  -- https://www.postgresql.org/docs/current/functions-matching.html#FUNCTIONS-POSIX-REGEXP
    genre         genreart,
    rating        integer NOT NULL CHECK (rating >= 0 AND rating <= 5),
                  -- https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-NUMERIC-DECIMAL
                  -- 10 Stellen, davon 2 Nachkommastellen
    spieldauer    integer NOT NULL CHECK (spieldauer > 0),
    erscheinungsjahr    integer NOT NULL CHECK (erscheinungsjahr > 0),
    regisseur_id     integer NOT NULL UNIQUE USING INDEX TABLESPACE filmspace REFERENCES regisseur,
    
                  -- https://www.postgresql.org/docs/current/datatype-datetime.html
    erzeugt       timestamp NOT NULL DEFAULT NOW(),
    aktualisiert  timestamp NOT NULL DEFAULT NOW()
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS schauspieler (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1005) PRIMARY KEY USING INDEX TABLESPACE filmspace,
    version         integer NOT NULL DEFAULT 0,
    vorname         varchar(20) NOT NULL,
    nachname        varchar(20) NOT NULL,
    geburtsdatum    date NOT NULL,
    groesse    integer NOT NULL CHECK (groesse > 0),
    soziale_medien jsonb
    -- https://www.postgresql.org/docs/current/datatype-json.html
) TABLESPACE filmspace;

CREATE TABLE IF NOT EXISTS film_schauspieler (
    film_id    int REFERENCES film(id) ON UPDATE CASCADE ON DELETE CASCADE,
    schauspieler_id int REFERENCES schauspieler(id) ON UPDATE CASCADE,
    CONSTRAINT film_schauspieler_pkey PRIMARY KEY (film_id, schauspieler_id)
) TABLESPACE filmspace;