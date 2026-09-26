import type { IAutoMovieTextureReference } from "@automovie/interface";

/** Surface contract for the current house: stone covers its existing envelope,
 * cassette and seal cover the metal spandrel and its joints, paving the site
 * approach, soil the garden bed, plaster the room lining,
 * oak the floor/door/furniture wood, felt and linen the soft finishes, and tile
 * the wet-room lining. The table gives each asset and physical U/V repeat.
 * The uploader keeps existing primary UVs and derives metre UVs for missing
 * sets after placement scale; a nonfinite projection or missing declared asset
 * throws. Unlisted finishes use their explicit solid base colour. */
const tiles: Record<string, { asset: string; u: number; v: number }> = {
  stone: { asset: "limestone-grain", u: 0.64, v: 0.64 },
  cassette: { asset: "cassette-grain", u: 0.4, v: 0.4 },
  seal: { asset: "seal-grain", u: 0.16, v: 0.16 },
  plaster: { asset: "paint-grain", u: 0.256, v: 0.256 },
  oak: { asset: "oak-grain", u: 0.36, v: 1.8 },
  felt: { asset: "woven-grain", u: 0.256, v: 0.256 },
  linen: { asset: "woven-grain", u: 0.256, v: 0.256 },
  tile: { asset: "tile-grain", u: 0.45, v: 0.45 },
  soil: { asset: "earth-grain", u: 0.5, v: 0.5 },
  paving: { asset: "paving-grain", u: 0.8, v: 0.8 },
};

export function materialTexture(id: string): IAutoMovieTextureReference | null {
  const tile = tiles[id];
  if (!tile) return null;
  return {
    asset: tile.asset,
    texCoord: 0,
    coordinateSource: "surface-metres",
    colorSpace: "srgb",
    sampler: {
      wrapS: "repeat",
      wrapT: "repeat",
      minFilter: "linearMipmapLinear",
      magFilter: "linear",
    },
    transform: {
      offset: { x: 0, y: 0 },
      scale: { x: 1 / tile.u, y: 1 / tile.v },
      rotationDeg: 0,
    },
  };
}
