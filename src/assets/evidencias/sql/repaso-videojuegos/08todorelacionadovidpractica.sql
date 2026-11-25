-- Apuntes 08: ejercicios integradores (reuniones + agrupación + subconsultas + CTE + vistas + CASE)
-- WITH (CTE) requiere MySQL 8.0 o superior.
USE videojuegos_practica;

-- 8.1 Top 5: ORDER BY con desempate y LIMIT al final (5 filas)
SELECT v.titulo, d.nombre AS desarrolladora, v.calificacion
FROM VIDEOJUEGO v
JOIN DESARROLLADORA d ON d.id = v.id_desarrolladora
ORDER BY v.calificacion DESC, v.titulo
LIMIT 5;

-- 8.2 Al unir con LANZAMIENTO cada juego se repite por plataforma, por eso COUNT(DISTINCT v.id).
--     Un AVG de calificación aquí quedaría ponderado por # de lanzamientos (7 filas)
SELECT d.nombre AS desarrolladora,
       COUNT(DISTINCT v.id)    AS juegos,
       COUNT(l.id_plataforma)  AS lanzamientos
FROM DESARROLLADORA d
LEFT JOIN VIDEOJUEGO v  ON v.id_desarrolladora = d.id
LEFT JOIN LANZAMIENTO l ON l.id_videojuego = v.id
GROUP BY d.id, d.nombre
ORDER BY lanzamientos DESC, d.nombre;

-- 8.3 CTE: le da nombre al paso intermedio (promedio por plataforma) para leerlo mejor (3 filas)
WITH precio_plataforma AS (
  SELECT id_plataforma, AVG(precio_usd) AS promedio
  FROM LANZAMIENTO
  GROUP BY id_plataforma
)
SELECT p.nombre, ROUND(pp.promedio, 2) AS precio_promedio
FROM precio_plataforma pp
JOIN PLATAFORMA p ON p.id = pp.id_plataforma
WHERE pp.promedio > (SELECT AVG(precio_usd) FROM LANZAMIENTO)
ORDER BY pp.promedio DESC, p.nombre;

-- 8.4 Vista: guarda la consulta, no los datos; se consulta como una tabla.
--     DROP IF EXISTS permite volver a ejecutar el script sin error.
DROP VIEW IF EXISTS v_catalogo;

CREATE VIEW v_catalogo AS
SELECT v.titulo,
       v.anio_lanzamiento,
       d.nombre AS desarrolladora,
       p.nombre AS plataforma,
       l.fecha_lanzamiento
FROM LANZAMIENTO l
JOIN VIDEOJUEGO v     ON v.id = l.id_videojuego
JOIN DESARROLLADORA d ON d.id = v.id_desarrolladora
JOIN PLATAFORMA p     ON p.id = l.id_plataforma;

-- Consulta sobre la vista (10 filas)
SELECT titulo, desarrolladora, fecha_lanzamiento
FROM v_catalogo
WHERE plataforma = 'PC'
ORDER BY fecha_lanzamiento, titulo;

-- 8.5 CASE sobre un agregado; los WHEN se evalúan en orden, por eso va de mayor a menor (16 filas)
SELECT v.titulo,
       COUNT(*) AS plataformas,
       CASE
         WHEN COUNT(*) >= 4 THEN 'Multiplataforma'
         WHEN COUNT(*) >= 2 THEN 'En varias'
         ELSE 'Una PLATAFORMA'
       END AS clasificacion
FROM VIDEOJUEGO v
JOIN LANZAMIENTO l ON l.id_videojuego = v.id
GROUP BY v.id, v.titulo
ORDER BY plataformas DESC, v.titulo;

-- 8.6 Mejor de cada grupo: subconsulta correlacionada con el género de la fila externa.
--     Usar = MAX (no LIMIT 1) deja pasar los empates (8 filas)
SELECT g.nombre AS genero, v.titulo, v.calificacion
FROM GENERO g
JOIN VIDEOJUEGO_GENERO vg ON vg.id_genero = g.id
JOIN VIDEOJUEGO v         ON v.id = vg.id_videojuego
WHERE v.calificacion = (
  SELECT MAX(v2.calificacion)
  FROM VIDEOJUEGO v2
  JOIN VIDEOJUEGO_GENERO vg2 ON vg2.id_videojuego = v2.id
  WHERE vg2.id_genero = g.id
)
ORDER BY g.nombre, v.titulo;

-- 8.7 Agregado de agregado: HAVING compara el conteo de cada juego con el promedio de esos conteos.
--     La tabla derivada (alias t) es necesaria porque AVG(COUNT(*)) no existe (9 filas)
SELECT v.titulo, COUNT(*) AS plataformas
FROM VIDEOJUEGO v
JOIN LANZAMIENTO l ON l.id_videojuego = v.id
GROUP BY v.id, v.titulo
HAVING COUNT(*) > (
  SELECT AVG(n)
  FROM (SELECT COUNT(*) AS n FROM LANZAMIENTO GROUP BY id_videojuego) AS t
)
ORDER BY plataformas DESC, v.titulo;

-- RETOS R1-R7 (sin solución): intenta primero el álgebra relacional y luego el SQL.
--  R1. Desarrolladoras japonesas con promedio mayor al promedio general.
--  R2. Juegos en PS5 pero no en PS4.
--  R3. Por plataforma, el título del juego más caro.
--  R4. Parejas de plataformas (A.id < B.id) con al menos 5 juegos en común.
--  R5. Cadenas de tres: juego -> previo -> previo del previo.
--  R6. Desarrolladoras con juegos en TODAS las plataformas donde salió algún juego de Capcom.
--  R7. Géneros con más juegos que el promedio (contando géneros sin juegos).
