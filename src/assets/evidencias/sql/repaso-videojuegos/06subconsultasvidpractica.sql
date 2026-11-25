-- Apuntes 06: subconsultas
-- IN / NOT IN -> pertenencia | EXISTS / NOT EXISTS -> existencia
-- Correlacionada: usa columnas de la consulta externa, se evalúa por cada fila.
-- Trampa: NOT IN falla (no devuelve nada) si la subconsulta trae algún NULL; NOT EXISTS no.
USE videojuegos_practica;

-- 6.1 Subconsulta escalar: devuelve un solo valor y se compara como constante (9 filas)
SELECT titulo, calificacion
FROM VIDEOJUEGO
WHERE calificacion > (SELECT AVG(calificacion) FROM VIDEOJUEGO)
ORDER BY calificacion DESC, titulo;

-- 6.2 IN en vez de JOIN: no duplica filas aunque el juego salga varias veces (5 filas)
SELECT titulo
FROM VIDEOJUEGO
WHERE id IN (
  SELECT l.id_videojuego
  FROM LANZAMIENTO l
  WHERE l.id_plataforma = (SELECT id FROM PLATAFORMA WHERE nombre = 'Nintendo Switch')
)
ORDER BY titulo;

-- 6.3 NOT IN: seguro aquí porque id_videojuego es parte de la PK y nunca es NULL (6 filas)
SELECT titulo
FROM VIDEOJUEGO
WHERE id NOT IN (
  SELECT l.id_videojuego
  FROM LANZAMIENTO l
  JOIN PLATAFORMA p ON p.id = l.id_plataforma
  WHERE p.nombre = 'PC'
)
ORDER BY titulo;

-- 6.4 EXISTS solo pregunta "¿hay alguna fila?", por eso el SELECT 1 (5 filas)
SELECT d.nombre
FROM DESARROLLADORA d
WHERE EXISTS (
  SELECT 1
  FROM VIDEOJUEGO v
  WHERE v.id_desarrolladora = d.id
    AND v.calificacion >= 9.5
)
ORDER BY d.nombre;

-- 6.5 NOT EXISTS: mismo resultado que la antirreunión del 4.2 (1 fila)
SELECT d.nombre
FROM DESARROLLADORA d
WHERE NOT EXISTS (
  SELECT 1 FROM VIDEOJUEGO v WHERE v.id_desarrolladora = d.id
);

-- 6.6 Correlacionada: el promedio se recalcula para la desarrolladora de cada fila (6 filas)
SELECT v.titulo, v.calificacion
FROM VIDEOJUEGO v
WHERE v.calificacion > (
  SELECT AVG(v2.calificacion)
  FROM VIDEOJUEGO v2
  WHERE v2.id_desarrolladora = v.id_desarrolladora
)
ORDER BY v.titulo;

-- 6.7 ">= ALL" = el máximo (con empates salen todos). El IS NOT NULL evita que un NULL arruine el ALL (1 fila)
SELECT titulo, calificacion
FROM VIDEOJUEGO
WHERE calificacion >= ALL (
  SELECT calificacion FROM VIDEOJUEGO WHERE calificacion IS NOT NULL
);
-- Equivalente con MAX:
-- SELECT titulo, calificacion FROM VIDEOJUEGO
-- WHERE calificacion = (SELECT MAX(calificacion) FROM VIDEOJUEGO);

-- 6.8 "> ALL" = mayor que el máximo de ese conjunto; "> ANY" sería mayor que el mínimo (4 filas)
SELECT titulo, calificacion
FROM VIDEOJUEGO
WHERE calificacion > ALL (
  SELECT v.calificacion
  FROM VIDEOJUEGO v
  JOIN DESARROLLADORA d ON d.id = v.id_desarrolladora
  WHERE d.nombre = 'CD Projekt Red'
)
ORDER BY calificacion DESC, titulo;

-- 6.9 No se puede hacer MAX(COUNT(*)) directo: primero se cuenta por juego en una
--     tabla derivada y luego se toma el máximo. MySQL exige alias en la derivada (4)
SELECT MAX(n) AS max_plataformas
FROM (
  SELECT id_videojuego, COUNT(*) AS n
  FROM LANZAMIENTO
  GROUP BY id_videojuego
) AS conteos;

-- 6.10 Subconsulta correlacionada en el SELECT: otra forma de contar con 0 incluido (7 filas)
SELECT d.nombre,
       (SELECT COUNT(*) FROM VIDEOJUEGO v WHERE v.id_desarrolladora = d.id) AS total_juegos
FROM DESARROLLADORA d
ORDER BY total_juegos DESC, d.nombre;
