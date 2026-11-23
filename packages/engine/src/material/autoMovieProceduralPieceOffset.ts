import { autoMoviePcg3d } from "./autoMoviePcg3d";

/**
 * The sheet-space offset, in metres, that a `module` pattern piece adds to its
 * sample point, so separately made tiles differ while one occurrence always
 * samples the same values.
 *
 * The occurrence id is hashed to one word by 32-bit FNV-1a over its UTF-16 code
 * units (Fowler, Noll and Vo, offset basis 2166136261, prime 16777619), and
 * `pcg3d(seed, idHash, 48)` gives three words, each divided by 2³² and
 * multiplied by `64 × scale`. The span of 64 feature sizes moves every kind to
 * an unrelated part of its pattern while keeping lattice coordinates small
 * enough for 32-bit float shading. A `face` piece adds nothing; the renderer
 * receives this offset as a uniform.
 *
 * @param seed Unsigned 32-bit seed of the surface.
 * @param id The occurrence id, `"<zone>/<module>"`.
 * @param scale The surface's feature size in metres.
 * @returns The offset `[u, v, normal]` in metres.
 */
export function autoMovieProceduralPieceOffset(
  seed: number,
  id: string,
  scale: number,
): [number, number, number] {
  let hash: number = 2166136261;
  for (let index: number = 0; index < id.length; ++index)
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619) >>> 0;
  const words: [number, number, number] = autoMoviePcg3d(seed, hash, 48);
  const span: number = 64 * scale;
  return [
    (words[0] / 4294967296) * span,
    (words[1] / 4294967296) * span,
    (words[2] / 4294967296) * span,
  ];
}
