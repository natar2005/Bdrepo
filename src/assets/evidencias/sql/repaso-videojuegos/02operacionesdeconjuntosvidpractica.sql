-- Apuntes 02: unión (∪), intersección (∩), diferencia (−)
-- Las dos consultas deben ser compatibles: mismo # de columnas y tipos en el mismo orden.
-- INTERSECT y EXCEPT requieren MySQL >= 8.0.31 (abajo van alternativas con IN / NOT IN).
-- ids: DESARROLLADORA 1 Nintendo, 2 Capcom, 5 FromSoftware
--      PLATAFORMA 1 PS4, 2 PS5, 3 Xbox One, 4 Switch, 5 PC | GENERO 1 Acción, 5 Terror
USE videojuegos_practica;

-- 2.1 UNION elimina duplicados automáticamente (6 filas)
SELECT titulo FROM VIDEOJUEGO WHERE id_desarrolladora = 2
UNION
SELECT titulo FROM VIDEOJUEGO WHERE id_desarrolladora = 5;

-- 2.2 Columna constante para distinguir el origen de cada fila (14 filas)
--     ORDER BY va una sola vez, al final de toda la unión.
SELECT nombre, 'Desarrolladora' AS tipo FROM DESARROLLADORA
UNION
SELECT nombre, 'Plataforma'     AS tipo FROM PLATAFORMA
ORDER BY tipo, nombre;

-- 2.3a UNION ALL conserva los repetidos (6 filas)
SELECT anio_lanzamiento FROM VIDEOJUEGO WHERE id_desarrolladora = 1
UNION ALL
SELECT anio_lanzamiento FROM VIDEOJUEGO WHERE id_desarrolladora = 2;

-- 2.3b UNION los elimina (4 filas); comparar con 2.3a. UNION ALL es más rápido (no ordena/compara).
SELECT anio_lanzamiento FROM VIDEOJUEGO WHERE id_desarrolladora = 1
UNION
SELECT anio_lanzamiento FROM VIDEOJUEGO WHERE id_desarrolladora = 2;

-- 2.4 Intersección: juegos en PS4 Y en PC (9 filas)
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 1
INTERSECT
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 5;
-- Sin INTERSECT:
-- SELECT DISTINCT id_videojuego FROM LANZAMIENTO
-- WHERE id_plataforma = 1
--   AND id_videojuego IN (SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 5);

-- 2.5 Diferencia: el orden importa (PC − PS4 no es PS4 − PC) (1 fila)
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 5
EXCEPT
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 1;
-- Sin EXCEPT:
-- SELECT DISTINCT id_videojuego FROM LANZAMIENTO
-- WHERE id_plataforma = 5
--   AND id_videojuego NOT IN (SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 1);

-- 2.6 "ni en Xbox ni en PC" = restar el conjunto de ambas; IN (3,5) hace la unión implícita (3 filas)
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma = 1
EXCEPT
SELECT id_videojuego FROM LANZAMIENTO WHERE id_plataforma IN (3, 5);

-- 2.7 Una fila por juego en VIDEOJUEGO_GENERO, así que "dos géneros a la vez" requiere intersección (3 filas)
SELECT id_videojuego FROM VIDEOJUEGO_GENERO WHERE id_genero = 5
INTERSECT
SELECT id_videojuego FROM VIDEOJUEGO_GENERO WHERE id_genero = 1;

-- Para pensar: 2.7 da lo mismo que "todos los de Terror" porque en estos datos
-- cada juego de Terror también es de Acción.
