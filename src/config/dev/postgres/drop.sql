-- https://www.postgresql.org/docs/current/sql-droptable.html

DROP TABLE IF EXISTS schauspieler CASCADE;
DROP TABLE IF EXISTS regisseur CASCADE;
DROP TABLE IF EXISTS film CASCADE;

DROP TYPE IF EXISTS genreart;