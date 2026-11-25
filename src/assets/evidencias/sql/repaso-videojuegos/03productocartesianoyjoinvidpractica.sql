-- Apuntes 03: producto cartesiano (×), reunión theta (⋈θ), natural (⋈), varias tablas
-- Idea central: una reunión es un producto cartesiano + una selección.
USE videojuegos_practica;

-- 3.1 CROSS JOIN: todas las combinaciones, 7 × 7 = 49 filas (crece muy rápido)
SELECT d.nombre AS desarrolladora, p.nombre AS plataforma
FROM DESARROLLADORA d
CROSS JOIN PLATAFORMA p;

-- 3.2 Estilo antiguo: producto con coma + WHERE (equivale a un JOIN) (16 filas)
SELECT v.titulo, d.nombre AS desarrolladora
FROM VIDEOJUEGO v, DESARROLLADORA d
WHERE v.id_desarrolladora = d.id;

-- 3.3 Mismo resultado con JOIN ... ON, que deja claro cuál es la condición de unión (9 filas)
SELECT v.titulo, d.nombre AS desarrolladora
FROM VIDEOJUEGO v
JOIN DESARROLLADORA d ON v.id_desarrolladora = d.id
WHERE d.pais = 'Japón'
ORDER BY d.nombre, v.titulo;

-- 3.4 Tabla puente en el centro: LANZAMIENTO conecta VIDEOJUEGO y PLATAFORMA (41 filas)
SELECT v.titulo, p.nombre AS plataforma, l.fecha_lanzamiento
FROM LANZAMIENTO l
JOIN VIDEOJUEGO v ON v.id = l.id_videojuego
JOIN PLATAFORMA p ON p.id = l.id_plataforma
ORDER BY v.titulo, l.fecha_lanzamiento;

-- 3.5 Cuatro tablas, dos filtros: uno por la desarrolladora y otro por la plataforma (2 filas)
SELECT v.titulo, l.fecha_lanzamiento, l.precio_usd
FROM VIDEOJUEGO v
JOIN DESARROLLADORA d ON d.id = v.id_desarrolladora
JOIN LANZAMIENTO l    ON l.id_videojuego = v.id
JOIN PLATAFORMA p     ON p.id = l.id_plataforma
WHERE d.nombre = 'Nintendo'
  AND p.nombre = 'Nintendo Switch';

-- 3.6 USING une por la columna común y la muestra una sola vez.
--     Elden Ring: 4 plataformas × 2 géneros = 8 filas (producto entre dos N:M) (8 filas)
SELECT id_videojuego, id_plataforma, id_genero
FROM LANZAMIENTO
JOIN VIDEOJUEGO_GENERO USING (id_videojuego)
WHERE id_videojuego = 13
ORDER BY id_plataforma, id_genero;

-- 3.7 Reunión theta: la condición no es igualdad sino ">".
--     PC queda fuera porque comparar con NULL nunca es verdadero (4 filas)
SELECT p.nombre, p.anio_salida
FROM PLATAFORMA p
JOIN VIDEOJUEGO v ON p.anio_salida > v.anio_lanzamiento
WHERE v.titulo = 'Dark Souls'
ORDER BY p.anio_salida, p.nombre;

-- 3.8 Cadena de 4 tablas pasando por la tabla puente VIDEOJUEGO_GENERO (5 filas)
SELECT v.titulo, g.nombre AS genero
FROM DESARROLLADORA d
JOIN VIDEOJUEGO v         ON v.id_desarrolladora = d.id
JOIN VIDEOJUEGO_GENERO vg ON vg.id_videojuego = v.id
JOIN GENERO g             ON g.id = vg.id_genero
WHERE d.nombre = 'CD Projekt Red'
ORDER BY v.titulo, g.nombre;
