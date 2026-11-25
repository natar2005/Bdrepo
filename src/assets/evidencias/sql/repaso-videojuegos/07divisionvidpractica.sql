-- Apuntes 07: división (÷), para preguntas con "TODOS"
-- R ÷ S = { a | para todo b en S, (a, b) está en R }
-- SQL no tiene operador de división. Dos técnicas:
--   (1) Doble NOT EXISTS: "no existe un b de S que a NO tenga".
--   (2) GROUP BY + HAVING COUNT(DISTINCT ...) = total de elementos de S.
-- Cuidado con la verdad vacía: si S está vacío, TODO elemento cumple.
USE videojuegos_practica;

-- 7.1 Doble NOT EXISTS: juegos sin ninguna plataforma Sony faltante (4 filas)
--     Externo: por cada juego | medio: plataformas Sony | interno: ¿existe el lanzamiento?
SELECT v.titulo
FROM VIDEOJUEGO v
WHERE NOT EXISTS (
  SELECT 1
  FROM PLATAFORMA p
  WHERE p.fabricante = 'Sony'
    AND NOT EXISTS (
      SELECT 1
      FROM LANZAMIENTO l
      WHERE l.id_videojuego = v.id
        AND l.id_plataforma = p.id
    )
)
ORDER BY v.titulo;

-- 7.2 Con Nintendo (N64 y Switch) no sale nadie: ningún juego está en ambas (0 filas)
--     Si el fabricante no existe (ej. 'Atari'), S queda vacío y salen TODOS los juegos.
SELECT v.titulo
FROM VIDEOJUEGO v
WHERE NOT EXISTS (
  SELECT 1
  FROM PLATAFORMA p
  WHERE p.fabricante = 'Nintendo'
    AND NOT EXISTS (
      SELECT 1
      FROM LANZAMIENTO l
      WHERE l.id_videojuego = v.id
        AND l.id_plataforma = p.id
    )
)
ORDER BY v.titulo;

-- 7.3 Con HAVING: plataformas Sony distintas del juego = total de plataformas Sony (4 filas)
--     DISTINCT por seguridad; el WHERE ya filtra solo Sony antes de contar.
SELECT v.titulo
FROM VIDEOJUEGO v
JOIN LANZAMIENTO l ON l.id_videojuego = v.id
JOIN PLATAFORMA p  ON p.id = l.id_plataforma
WHERE p.fabricante = 'Sony'
GROUP BY v.id, v.titulo
HAVING COUNT(DISTINCT p.id) = (SELECT COUNT(*) FROM PLATAFORMA WHERE fabricante = 'Sony')
ORDER BY v.titulo;

-- 7.4 Divisor fijo {1, 3, 5}: se filtra con IN y se exige que estén las 3 (9 filas)
SELECT v.titulo
FROM VIDEOJUEGO v
JOIN LANZAMIENTO l ON l.id_videojuego = v.id
WHERE l.id_plataforma IN (1, 3, 5)
GROUP BY v.id, v.titulo
HAVING COUNT(DISTINCT l.id_plataforma) = 3
ORDER BY v.titulo;

-- 7.5 División "al revés": ahora el divisor son los juegos de Rockstar y el resultado, plataformas (1 fila)
SELECT p.nombre
FROM PLATAFORMA p
WHERE NOT EXISTS (
  SELECT 1
  FROM VIDEOJUEGO v
  WHERE v.id_desarrolladora = (SELECT id FROM DESARROLLADORA WHERE nombre = 'Rockstar Games')
    AND NOT EXISTS (
      SELECT 1
      FROM LANZAMIENTO l
      WHERE l.id_videojuego = v.id
        AND l.id_plataforma = p.id
    )
)
ORDER BY p.nombre;

-- 7.6 División sobre una reunión: se une primero y luego se exige tener los 2 géneros {1, 3} (3 filas)
SELECT d.nombre
FROM DESARROLLADORA d
JOIN VIDEOJUEGO v         ON v.id_desarrolladora = d.id
JOIN VIDEOJUEGO_GENERO vg ON vg.id_videojuego = v.id
WHERE vg.id_genero IN (1, 3)
GROUP BY d.id, d.nombre
HAVING COUNT(DISTINCT vg.id_genero) = 2
ORDER BY d.nombre;
