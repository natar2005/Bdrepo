-- Apuntes 04: reunión externa (⟕ ⟖), antirreunión y autorreunión
-- JOIN interno descarta filas sin pareja; LEFT/RIGHT JOIN las conserva con NULL.
-- Antirreunión: LEFT JOIN + WHERE llave_del_lado_derecho IS NULL.
-- Casos de prueba en los datos: Andes Games (sin juegos), Dreamcast (sin lanzamientos), Carreras (sin juegos).
USE videojuegos_practica;

-- 4.1 LEFT JOIN conserva todas las desarrolladoras; Andes Games sale con título NULL (17 filas)
SELECT d.nombre AS desarrolladora, v.titulo
FROM DESARROLLADORA d
LEFT JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
ORDER BY d.nombre, v.titulo;

-- 4.2 Antirreunión: se filtra la PK del lado derecho, que solo es NULL si no hubo pareja (1 fila)
SELECT d.id, d.nombre
FROM DESARROLLADORA d
LEFT JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
WHERE v.id IS NULL;

-- 4.3 Misma técnica; en LANZAMIENTO la PK es compuesta, basta con revisar una de sus columnas (1 fila)
SELECT p.id, p.nombre
FROM PLATAFORMA p
LEFT JOIN LANZAMIENTO l ON l.id_plataforma = p.id
WHERE l.id_videojuego IS NULL;

-- 4.4a Géneros sin juegos con LEFT JOIN (1 fila)
SELECT g.id, g.nombre
FROM GENERO g
LEFT JOIN VIDEOJUEGO_GENERO vg ON vg.id_genero = g.id
WHERE vg.id_videojuego IS NULL;

-- 4.4b Igual con RIGHT JOIN: es el mismo JOIN con las tablas intercambiadas (1 fila)
SELECT g.id, g.nombre
FROM VIDEOJUEGO_GENERO vg
RIGHT JOIN GENERO g ON vg.id_genero = g.id
WHERE vg.id_videojuego IS NULL;

-- 4.5 MySQL no tiene FULL OUTER JOIN: se simula con LEFT UNION RIGHT.
--     UNION (no ALL) quita las filas que salen en ambos lados (17 filas)
SELECT d.nombre AS desarrolladora, v.titulo
FROM DESARROLLADORA d
LEFT JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id
UNION
SELECT d.nombre AS desarrolladora, v.titulo
FROM DESARROLLADORA d
RIGHT JOIN VIDEOJUEGO v ON v.id_desarrolladora = d.id;

-- 4.6 Autorreunión: la misma tabla con dos alias, v = juego nuevo, p = juego previo.
--     Es INNER JOIN, así que los juegos sin previo (NULL) no aparecen (4 filas)
SELECT v.titulo AS juego, p.titulo AS juego_previo
FROM VIDEOJUEGO v
JOIN VIDEOJUEGO p ON v.id_juego_previo = p.id
ORDER BY v.titulo;

-- 4.7 Al tener los dos lados en la misma fila se pueden comparar notas con WHERE (2 filas)
SELECT v.titulo AS juego, v.calificacion AS nota_nuevo,
       p.titulo AS juego_previo, p.calificacion AS nota_previo
FROM VIDEOJUEGO v
JOIN VIDEOJUEGO p ON v.id_juego_previo = p.id
WHERE v.calificacion > p.calificacion;

-- 4.8 Parejas sin repetir: "<" evita (A,A) y también (B,A) cuando ya está (A,B) (14 filas)
SELECT v1.titulo AS juego_1, v2.titulo AS juego_2
FROM VIDEOJUEGO v1
JOIN VIDEOJUEGO v2
  ON v1.id_desarrolladora = v2.id_desarrolladora
 AND v1.id < v2.id
ORDER BY v1.id_desarrolladora, v1.titulo, v2.titulo;

-- 4.9 Se añade una condición más en el ON: mismo año (1 fila)
SELECT v1.titulo AS juego_1, v2.titulo AS juego_2, v1.anio_lanzamiento AS anio
FROM VIDEOJUEGO v1
JOIN VIDEOJUEGO v2
  ON v1.id_desarrolladora = v2.id_desarrolladora
 AND v1.anio_lanzamiento  = v2.anio_lanzamiento
 AND v1.id < v2.id;
