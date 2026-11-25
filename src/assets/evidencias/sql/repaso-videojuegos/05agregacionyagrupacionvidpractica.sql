-- Apuntes 05: agregación y agrupación (γ)
-- WHERE filtra filas ANTES de agrupar; HAVING filtra grupos DESPUÉS.
-- ONLY_FULL_GROUP_BY: toda columna no agregada del SELECT debe ir en el GROUP BY.
-- COUNT(*) cuenta filas; COUNT(columna) ignora los NULL.
-- Se agrupa por d.id además de d.nombre porque dos desarrolladoras podrían tener el mismo nombre.
USE videojuegos_practica;

-- 5.1 Conteo total (16)
SELECT COUNT(*) AS total_juegos
FROM VIDEOJUEGO;

-- 5.2 Varias agregaciones en una consulta; ROUND solo afecta la presentación (16 | 9.34 | 8 | 9.9)
SELECT COUNT(*)                    AS total,
       ROUND(AVG(calificacion), 2) AS promedio,
       MIN(calificacion)           AS minima,
       MAX(calificacion)           AS maxima
FROM VIDEOJUEGO;

-- 5.3 Con JOIN interno solo salen desarrolladoras que tienen juegos (6 filas)
SELECT d.nombre, COUNT(*) AS total_juegos
FROM DESARROLLADORA d
JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
GROUP BY d.id, d.nombre
ORDER BY total_juegos DESC, d.nombre;

-- 5.4 Con LEFT JOIN, COUNT(v.id) da 0 para Andes Games; COUNT(*) daría 1 porque cuenta la fila con NULL (7 filas)
SELECT d.nombre, COUNT(v.id) AS total_juegos
FROM DESARROLLADORA d
LEFT JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
GROUP BY d.id, d.nombre
ORDER BY total_juegos DESC, d.nombre;

-- 5.5 Promedio por grupo (6 filas)
SELECT d.nombre, ROUND(AVG(v.calificacion), 2) AS promedio
FROM DESARROLLADORA d
JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
GROUP BY d.id, d.nombre
ORDER BY promedio DESC, d.nombre;

-- 5.6 HAVING porque la condición es sobre el resultado del COUNT, no sobre filas (4 filas)
SELECT d.nombre, COUNT(*) AS total_juegos
FROM DESARROLLADORA d
JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
GROUP BY d.id, d.nombre
HAVING COUNT(*) >= 3
ORDER BY d.nombre;

-- 5.7 Cada fila de LANZAMIENTO es una plataforma distinta de ese juego, por eso COUNT(*) sirve (5 filas)
SELECT v.titulo, COUNT(*) AS num_plataformas
FROM VIDEOJUEGO v
JOIN LANZAMIENTO l ON l.id_videojuego = v.id
GROUP BY v.id, v.titulo
HAVING COUNT(*) >= 4
ORDER BY v.titulo;

-- 5.8 Varias agregaciones por grupo; PC cuenta aquí aunque su anio_salida sea NULL (6 filas)
SELECT p.nombre AS plataforma,
       COUNT(*)                     AS lanzamientos,
       ROUND(AVG(l.precio_usd), 2)  AS precio_promedio,
       MIN(l.precio_usd)            AS precio_min,
       MAX(l.precio_usd)            AS precio_max
FROM PLATAFORMA p
JOIN LANZAMIENTO l ON l.id_plataforma = p.id
GROUP BY p.id, p.nombre
ORDER BY lanzamientos DESC, p.nombre;

-- 5.9 LEFT JOIN + COUNT de la columna del lado derecho para que "Carreras" salga con 0 (7 filas)
SELECT g.nombre AS genero, COUNT(vg.id_videojuego) AS total_juegos
FROM GENERO g
LEFT JOIN VIDEOJUEGO_GENERO vg ON vg.id_genero = g.id
GROUP BY g.id, g.nombre
ORDER BY total_juegos DESC, g.nombre;

-- 5.10 Agrupar por una columna de la propia tabla (sin JOIN) (5 filas)
SELECT anio_lanzamiento, COUNT(*) AS total
FROM VIDEOJUEGO
GROUP BY anio_lanzamiento
HAVING COUNT(*) > 1
ORDER BY anio_lanzamiento;
