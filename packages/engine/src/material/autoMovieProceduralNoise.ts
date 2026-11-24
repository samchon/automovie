import { autoMoviePcg3d } from "./autoMoviePcg3d";

/**
 * Seeded three-dimensional gradient noise of procedural surfaces, in lattice
 * units, within [-1, 1]: Perlin's improved noise (Perlin 2002, "Improving
 * noise", SIGGRAPH) with its corner gradients chosen by the PCG3D hash of the
 * corner instead of a permutation table.
 *
 * Each of the eight corners around the point takes the gradient that the low
 * four bits of the first word of `autoMovieProceduralHash(seed, salt, corner)`
 * select from Perlin's twelve cube-edge directions (four repeated to fill
 * sixteen), dotted with the offset from the corner. The eight dot products
 * blend by the quintic fade `6t⁵ − 15t⁴ + 10t³` along X, then Y, then Z. The
 * value is zero at every lattice corner and has continuous first and second
 * derivatives. The result is clamped to [-1, 1] to bound rounding.
 *
 * The renderer's fragment shader evaluates the same arithmetic in 32-bit
 * floats, so the two agree to float rounding.
 *
 * @param seed Unsigned 32-bit seed.
 * @param salt Unsigned 32-bit purpose tag, distinct per use.
 * @returns Noise at the lattice-unit point `(x, y, z)`.
 */
export function autoMovieProceduralNoise(
  seed: number,
  salt: number,
  x: number,
  y: number,
  z: number,
): number {
  const i: number = Math.floor(x);
  const j: number = Math.floor(y);
  const k: number = Math.floor(z);
  const u: number = x - i;
  const v: number = y - j;
  const w: number = z - k;

  // One corner's gradient dotted with the offset from it (Perlin 2002, `grad`);
  // the key is hashed once for the eight corners.
  const key: [number, number, number] = autoMoviePcg3d(seed, salt, 0x9e3779b9);
  const corner: (di: number, dj: number, dk: number) => number = (
    di: number,
    dj: number,
    dk: number,
  ): number => {
    const h: number =
      autoMoviePcg3d(
        ((i + di) ^ key[0]) >>> 0,
        ((j + dj) ^ key[1]) >>> 0,
        ((k + dk) ^ key[2]) >>> 0,
      )[0] & 15;
    const px: number = u - di;
    const py: number = v - dj;
    const pz: number = w - dk;
    const a: number = h < 8 ? px : py;
    const b: number = h < 4 ? py : h === 12 || h === 14 ? px : pz;
    return ((h & 1) === 0 ? a : -a) + ((h & 2) === 0 ? b : -b);
  };
  const fu: number = fade(u);
  const fv: number = fade(v);
  const fw: number = fade(w);
  const x00: number = lerp(corner(0, 0, 0), corner(1, 0, 0), fu);
  const x10: number = lerp(corner(0, 1, 0), corner(1, 1, 0), fu);
  const x01: number = lerp(corner(0, 0, 1), corner(1, 0, 1), fu);
  const x11: number = lerp(corner(0, 1, 1), corner(1, 1, 1), fu);
  const value: number = lerp(lerp(x00, x10, fv), lerp(x01, x11, fv), fw);
  return Math.max(-1, Math.min(1, value));
}

/** Perlin's 2002 quintic fade. */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Linear interpolation from `a` to `b` by `t`. */
function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}
