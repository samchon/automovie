/*
 * Refuse a fractal noise octave count or roughness outside its range.
 * Parameter octaves: Number of octaves; a positive safe integer.
 * Parameter roughness: Amplitude ratio between successive octaves; in (0, 1), so
 * every finer octave is weaker than the one before it.
 * Naming `octaves` or `roughness`, whichever is out of range.
 */
export function admitAutoMovieNoiseOctaves(
  octaves: number,
  roughness: number,
): void {
  if (!(octaves >= 1))
    throw new Error(
      `Fractal noise octaves must be a positive integer: ${octaves}`,
    );
  if (!(roughness > 0 && roughness < 1))
    throw new Error(
      `Fractal noise roughness must lie strictly between 0 and 1: ${roughness}`,
    );
}
