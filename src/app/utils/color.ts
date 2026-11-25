/** Utilidades pequeñas para que el color de cada categoría se lea bien sobre el fondo oscuro. */

function channels(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminancia relativa (0 = negro, 1 = blanco). */
export function luminance(hex: string): number {
  const rgb = channels(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Color de texto para escribir encima del color dado. */
export function inkFor(hex: string): string {
  return luminance(hex) > 0.2 ? '#071510' : '#f6f3e9';
}

/** Aclara los colores muy oscuros para usarlos como texto sobre el fondo de la página. */
export function readableOnDark(hex: string): string {
  const rgb = channels(hex);
  if (!rgb || luminance(hex) > 0.2) return hex;
  const mix = rgb.map((v) => Math.round(v + (255 - v) * 0.4));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}
