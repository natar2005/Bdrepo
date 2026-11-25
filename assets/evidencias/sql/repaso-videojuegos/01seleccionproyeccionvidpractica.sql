-- Apuntes 01: selección (σ), proyección (π), renombrado (ρ)
-- σ -> WHERE | π -> lista de columnas del SELECT | ρ -> AS
-- Diferencia clave: en álgebra π elimina duplicados; en SQL hay que usar DISTINCT.
USE videojuegos_practica;

-- 1.1 Todas las desarrolladoras (7 filas)
SELECT *
FROM DESARROLLADORA;

-- 1.2 Proyección: solo las columnas que necesito (16 filas)
SELECT titulo, anio_lanzamiento
FROM VIDEOJUEGO;

-- 1.3 Selección + proyección: WHERE filtra filas (6 filas)
SELECT titulo, anio_lanzamiento
FROM VIDEOJUEGO
WHERE anio_lanzamiento > 2017;

-- 1.4 ORDER BY no es álgebra, es presentación; el 2.º criterio desempata (9 filas)
SELECT titulo, calificacion
FROM VIDEOJUEGO
WHERE calificacion >= 9.5
ORDER BY calificacion DESC, titulo;

-- 1.5 DISTINCT simula la eliminación de duplicados del álgebra (4 filas)
SELECT DISTINCT pais
FROM DESARROLLADORA;

-- 1.6 NULL no se compara con "=", siempre se usa IS NULL (1 fila)
SELECT *
FROM PLATAFORMA
WHERE fabricante IS NULL;

-- 1.7 BETWEEN es inclusivo en ambos extremos (6 filas)
SELECT titulo, anio_lanzamiento
FROM VIDEOJUEGO
WHERE anio_lanzamiento BETWEEN 2010 AND 2016
ORDER BY anio_lanzamiento, titulo;

-- 1.8 LIKE con % a ambos lados busca la palabra en cualquier posición (2 filas)
SELECT titulo, anio_lanzamiento
FROM VIDEOJUEGO
WHERE titulo LIKE '%Souls%';

-- 1.9 Los paréntesis fijan la precedencia: (AND) OR (LIKE) (7 filas)
--     El ORDER BY puede usar los alias porque se evalúa después del SELECT.
SELECT titulo AS nombre_juego,
       anio_lanzamiento AS anio,
       calificacion AS nota
FROM VIDEOJUEGO
WHERE (anio_lanzamiento >= 2018 AND calificacion >= 9)
   OR titulo LIKE 'Dark%'
ORDER BY anio, nombre_juego;
