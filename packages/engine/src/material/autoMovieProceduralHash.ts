import { autoMoviePcg3d } from "./autoMoviePcg3d";

/**
 * The words of one lattice cell under a seed and a salt: `pcg3d(cell ^ key)`,
 * with `key = pcg3d(seed, salt, 0x9E3779B9)`.
 *
 * The key folds the seed and the salt into all three words before the cell is
 * hashed, so two salts of one seed (the octaves of the fractal noise, the stone
 * cells, the fabric threads) and two seeds of one salt read unrelated values at
 * the same cell. The constant third word is the 32-bit golden-ratio fraction, a
 * conventional nonzero filler. The renderer's GLSL form computes the same words
 * (see `autoMoviePcg3d`).
 *
 * @param seed Unsigned 32-bit seed.
 * @param salt Unsigned 32-bit purpose tag.
 * @param i Lattice cell X, an integer.
 * @param j Lattice cell Y, an integer.
 * @param k Lattice cell Z, an integer.
 * @returns Three words within [0, 2³²).
 */
export function autoMovieProceduralHash(
  seed: number,
  salt: number,
  i: number,
  j: number,
  k: number,
): [number, number, number] {
  const key: [number, number, number] = autoMoviePcg3d(seed, salt, 0x9e3779b9);
  return autoMoviePcg3d(
    (i ^ key[0]) >>> 0,
    (j ^ key[1]) >>> 0,
    (k ^ key[2]) >>> 0,
  );
}
