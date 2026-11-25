-- Apuntes: esquema y datos de la BD de videojuegos (MySQL 8.x)
-- Ejecutar una sola vez; se puede repetir para reiniciar los datos.

CREATE DATABASE IF NOT EXISTS videojuegos_practica
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE videojuegos_practica;

-- Se borra de hijas a padres para no violar las llaves foráneas
DROP TABLE IF EXISTS VIDEOJUEGO_GENERO;
DROP TABLE IF EXISTS LANZAMIENTO;
DROP TABLE IF EXISTS VIDEOJUEGO;
DROP TABLE IF EXISTS GENERO;
DROP TABLE IF EXISTS PLATAFORMA;
DROP TABLE IF EXISTS DESARROLLADORA;

CREATE TABLE DESARROLLADORA (
  id             INT PRIMARY KEY,
  nombre         VARCHAR(80) NOT NULL,
  pais           VARCHAR(40) NOT NULL,
  anio_fundacion INT
);

CREATE TABLE PLATAFORMA (
  id          INT PRIMARY KEY,
  nombre      VARCHAR(40) NOT NULL,
  fabricante  VARCHAR(40),            -- NULL permitido (PC no tiene fabricante)
  anio_salida INT
);

CREATE TABLE GENERO (
  id     INT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE VIDEOJUEGO (
  id                INT PRIMARY KEY,
  titulo            VARCHAR(120) NOT NULL,
  anio_lanzamiento  INT NOT NULL,
  calificacion      DECIMAL(3,1),
  id_desarrolladora INT NOT NULL,
  id_juego_previo   INT,              -- autorrelación: apunta al juego anterior de la saga
  CONSTRAINT chk_calificacion CHECK (calificacion BETWEEN 0 AND 10),
  CONSTRAINT fk_vj_desarrolladora FOREIGN KEY (id_desarrolladora) REFERENCES DESARROLLADORA(id),
  CONSTRAINT fk_vj_previo FOREIGN KEY (id_juego_previo) REFERENCES VIDEOJUEGO(id)
);

-- Relación N:M VIDEOJUEGO-PLATAFORMA; la PK compuesta evita lanzamientos duplicados
CREATE TABLE LANZAMIENTO (
  id_videojuego     INT NOT NULL,
  id_plataforma     INT NOT NULL,
  fecha_lanzamiento DATE NOT NULL,
  precio_usd        DECIMAL(6,2),
  PRIMARY KEY (id_videojuego, id_plataforma),
  CONSTRAINT fk_lz_videojuego FOREIGN KEY (id_videojuego) REFERENCES VIDEOJUEGO(id),
  CONSTRAINT fk_lz_plataforma FOREIGN KEY (id_plataforma) REFERENCES PLATAFORMA(id)
);

-- Relación N:M VIDEOJUEGO-GENERO
CREATE TABLE VIDEOJUEGO_GENERO (
  id_videojuego INT NOT NULL,
  id_genero     INT NOT NULL,
  PRIMARY KEY (id_videojuego, id_genero),
  CONSTRAINT fk_vg_videojuego FOREIGN KEY (id_videojuego) REFERENCES VIDEOJUEGO(id),
  CONSTRAINT fk_vg_genero     FOREIGN KEY (id_genero)     REFERENCES GENERO(id)
);

INSERT INTO DESARROLLADORA (id, nombre, pais, anio_fundacion) VALUES
  (1, 'Nintendo',          'Japón',          1889),
  (2, 'Capcom',            'Japón',          1979),
  (3, 'CD Projekt Red',    'Polonia',        2002),
  (4, 'Naughty Dog',       'Estados Unidos', 1984),
  (5, 'FromSoftware',      'Japón',          1986),
  (6, 'Rockstar Games',    'Estados Unidos', 1998),
  (7, 'Andes Games',       'Colombia',       2015);   -- sin juegos (caso para probar LEFT JOIN)

INSERT INTO PLATAFORMA (id, nombre, fabricante, anio_salida) VALUES
  (1, 'PlayStation 4',  'Sony',      2013),
  (2, 'PlayStation 5',  'Sony',      2020),
  (3, 'Xbox One',       'Microsoft', 2013),
  (4, 'Nintendo Switch','Nintendo',  2017),
  (5, 'PC',             NULL,        NULL),
  (6, 'Nintendo 64',    'Nintendo',  1996),
  (7, 'Dreamcast',      'Sega',      1998);          -- sin lanzamientos

INSERT INTO GENERO (id, nombre) VALUES
  (1, 'Acción'), (2, 'Aventura'), (3, 'RPG'), (4, 'Plataformas'),
  (5, 'Terror'), (6, 'Mundo abierto'),
  (7, 'Carreras');                                    -- sin juegos

-- Los juegos previos tienen id menor para poder insertarse antes (FK autorreferenciada)
INSERT INTO VIDEOJUEGO (id, titulo, anio_lanzamiento, calificacion, id_desarrolladora, id_juego_previo) VALUES
  ( 1, 'The Legend of Zelda: Ocarina of Time',   1998, 9.9, 1, NULL),
  ( 2, 'The Legend of Zelda: Breath of the Wild', 2017, 9.7, 1, NULL),
  ( 3, 'Super Mario Odyssey',                    2017, 9.7, 1, NULL),
  ( 4, 'Resident Evil 2',                        1998, 9.0, 2, NULL),
  ( 5, 'Resident Evil 2 Remake',                 2019, 9.3, 2, 4),
  ( 6, 'Monster Hunter: World',                  2018, 9.0, 2, NULL),
  ( 7, 'The Witcher 3: Wild Hunt',               2015, 9.6, 3, NULL),
  ( 8, 'Cyberpunk 2077',                         2020, 8.0, 3, NULL),
  ( 9, 'The Last of Us',                         2013, 9.5, 4, NULL),
  (10, 'The Last of Us Part II',                 2020, 9.3, 4, 9),
  (11, 'Dark Souls',                             2011, 9.1, 5, NULL),
  (12, 'Dark Souls III',                         2016, 8.9, 5, 11),
  (13, 'Elden Ring',                             2022, 9.6, 5, NULL),
  (14, 'Red Dead Redemption',                    2010, 9.5, 6, NULL),
  (15, 'Red Dead Redemption 2',                  2018, 9.7, 6, 14),
  (16, 'Grand Theft Auto V',                     2013, 9.6, 6, NULL);

INSERT INTO LANZAMIENTO (id_videojuego, id_plataforma, fecha_lanzamiento, precio_usd) VALUES
  ( 1, 6, '1998-11-21', 59.99),
  ( 2, 4, '2017-03-03', 59.99),
  ( 3, 4, '2017-10-27', 59.99),
  ( 4, 5, '1998-02-28', 39.99),
  ( 5, 1, '2019-01-25', 59.99),
  ( 5, 3, '2019-01-25', 59.99),
  ( 5, 5, '2019-01-25', 59.99),
  ( 6, 1, '2018-01-26', 59.99),
  ( 6, 3, '2018-01-26', 59.99),
  ( 6, 5, '2018-08-09', 29.99),
  ( 7, 1, '2015-05-19', 59.99),
  ( 7, 3, '2015-05-19', 59.99),
  ( 7, 5, '2015-05-19', 49.99),
  ( 7, 4, '2019-10-15', 49.99),
  ( 8, 1, '2020-12-10', 59.99),
  ( 8, 3, '2020-12-10', 59.99),
  ( 8, 5, '2020-12-10', 59.99),
  ( 8, 2, '2022-02-15', 39.99),
  ( 9, 1, '2014-07-29', 49.99),
  (10, 1, '2020-06-19', 59.99),
  (10, 2, '2024-01-19', 49.99),
  (11, 5, '2012-08-24', 39.99),
  (11, 1, '2018-05-25', 39.99),
  (11, 3, '2018-05-25', 39.99),
  (11, 4, '2018-10-19', 39.99),
  (12, 1, '2016-04-12', 59.99),
  (12, 3, '2016-04-12', 59.99),
  (12, 5, '2016-04-12', 59.99),
  (13, 1, '2022-02-25', 59.99),
  (13, 2, '2022-02-25', 59.99),
  (13, 3, '2022-02-25', 59.99),
  (13, 5, '2022-02-25', 59.99),
  (14, 1, '2023-10-17', 49.99),
  (14, 4, '2023-10-17', 49.99),
  (15, 1, '2018-10-26', 59.99),
  (15, 3, '2018-10-26', 59.99),
  (15, 5, '2019-11-05', 59.99),
  (16, 1, '2014-11-18', 59.99),
  (16, 3, '2014-11-18', 59.99),
  (16, 5, '2015-04-14', 29.99),
  (16, 2, '2022-03-15', 39.99);

-- Géneros: 1 Acción, 2 Aventura, 3 RPG, 4 Plataformas, 5 Terror, 6 Mundo abierto, 7 Carreras
INSERT INTO VIDEOJUEGO_GENERO (id_videojuego, id_genero) VALUES
  ( 1, 2), ( 1, 1),
  ( 2, 2), ( 2, 6),
  ( 3, 4), ( 3, 2),
  ( 4, 5), ( 4, 1),
  ( 5, 5), ( 5, 1),
  ( 6, 1), ( 6, 3),
  ( 7, 3), ( 7, 6),
  ( 8, 3), ( 8, 1), ( 8, 6),
  ( 9, 1), ( 9, 2), ( 9, 5),
  (10, 1), (10, 2),
  (11, 3), (11, 1),
  (12, 3), (12, 1),
  (13, 3), (13, 6),
  (14, 1), (14, 6), (14, 2),
  (15, 1), (15, 6),
  (16, 1), (16, 6);

-- Verificación: 7, 7, 7, 16, 41 y 35 filas
SELECT 'DESARROLLADORA' AS tabla, COUNT(*) AS filas FROM DESARROLLADORA
UNION ALL SELECT 'PLATAFORMA',        COUNT(*) FROM PLATAFORMA
UNION ALL SELECT 'GENERO',            COUNT(*) FROM GENERO
UNION ALL SELECT 'VIDEOJUEGO',        COUNT(*) FROM VIDEOJUEGO
UNION ALL SELECT 'LANZAMIENTO',       COUNT(*) FROM LANZAMIENTO
UNION ALL SELECT 'VIDEOJUEGO_GENERO', COUNT(*) FROM VIDEOJUEGO_GENERO;
