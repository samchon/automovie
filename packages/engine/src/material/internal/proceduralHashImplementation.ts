import { hashPcg3d } from "./hashPcg3d";

/*
 * The words of one lattice cell under a seed and a salt: `pcg3d(cell ^ key)`,
 * with `key = pcg3d(seed, salt, 0x9E3779B9)`.
 *
 * The key folds the seed and the salt into all three words before the cell is
 * hashed, so two salts of one seed (the octaves of the fractal noise, the stone
 * cells, the fabric threads) and two seeds of one salt read unrelated values at
 * the same cell. The constant third word is the 32-bit golden-ratio fraction, a
 * conventional nonzero filler. The renderer's GLSL form computes the same words
 * (see `hashPcg3d`).
 * Parameter seed: Unsigned 32-bit seed.
 * Parameter salt: Unsigned 32-bit purpose tag.
 * Parameter i: Lattice cell X, an integer.
 * Parameter j: Lattice cell Y, an integer.
 * Parameter k: Lattice cell Z, an integer.
 * Returns: Three words within [0, 2³²).
 */
export function proceduralHashImplementation(
  seed: number,
  salt: number,
  i: number,
  j: number,
  k: number,
): [number, number, number] {
  const key: [number, number, number] = hashPcg3d(seed, salt, 0x9e3779b9);
  return hashPcg3d(
    (i ^ key[0]) >>> 0,
    (j ^ key[1]) >>> 0,
    (k ^ key[2]) >>> 0,
  );
}
