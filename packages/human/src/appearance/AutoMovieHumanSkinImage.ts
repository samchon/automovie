import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";

/**
 * Procedural skin micro-relief tile: one periodic height field in rest
 * millimetres, delivered as three seamlessly repeating images that the skin
 * material samples through the rest-millimetre coordinates of
 * `AutoMovieHumanSkinChart`.
 *
 * The tile spans {@link tile} mm per side. Its height field sums:
 *
 * - follicular pores: at most one pit per cell of a 64-per-side grid (about
 *   0.6 mm cells), with a third of the cells empty, the rest placed anywhere
 *   in their cell, radius 0.04 to 0.12 mm skewed toward small, depth 6 to
 *   24 um growing with size and scaled by a 5 mm patchiness between 35 and
 *   100 percent, with a squared-parabola profile;
 * - a gentle 2 to 8 mm undulation of 10 um and a 0.3 mm grain of 2 um.
 *
 * The result is a smooth, even surface whose pores show only at close
 * range and mostly in the specular highlight. Pore spacing follows the
 * order of magnitude of facial follicle densities (a few hundred per square
 * centimetre); the sizes, depths and the single pattern for the whole body
 * are conventions, not measurements, and the furrow network of real skin is
 * deliberately not drawn. Regional strength comes from per-vertex relief
 * weights on the skin mesh, not from this tile.
 *
 * Images (all shared by every person, so their ids name content only):
 *
 * - {@link reliefId}: tangent-space normal map, RGB, {@link reliefSize}
 *   square (0.039 mm per texel), x along `+u` and y along `+v` with `v`
 *   increasing down the rows, as the viewer's derivative tangent frame reads
 *   an image decoded without a vertical flip;
 * - {@link grainId}: sRGB base-colour multiplier, RGB, {@link detailSize}
 *   square: pores up to 5 percent darker and slightly warmer, plus a faint
 *   speckle; its mean is about 0.99;
 * - {@link glossId}: metallic-roughness image, RGB, {@link detailSize}
 *   square: green multiplies the material roughness (1.0 in pores, down to
 *   0.85 between them), blue is zero metalness.
 *
 * Raw sizes: 3 MiB for the normal map and 0.75 MiB for each of the other
 * two; the PNGs are stored uncompressed by the engine encoder.
 */
export namespace AutoMovieHumanSkinImage {
  /** Physical side of the tile in mm. */
  export const tile: number = 40;

  /** Normal map edge in pixels. */
  export const reliefSize: number = 1024;

  /** Colour and roughness image edge in pixels. */
  export const detailSize: number = 512;

  /** Id of the normal map. */
  export const reliefId: string = "human.skin.relief";

  /** Id of the base-colour multiplier. */
  export const grainId: string = "human.skin.grain";

  /** Id of the metallic-roughness image. */
  export const glossId: string = "human.skin.gloss";

  /**
   * Generate the three tile images. The result is computed once per process
   * and shared, since it depends on no input.
   *
   * @returns Normal, colour and roughness images
   */
  export function generate(): IAutoMovieImage[] {
    cache ??= create();
    return cache.map(
      (image: IAutoMovieImage): IAutoMovieImage => ({ ...image }),
    );
  }
}

/** Images of the first {@link AutoMovieHumanSkinImage.generate} call. */
let cache: IAutoMovieImage[] | null = null;

/**
 * Build the three images from one height field.
 *
 * @returns Normal, colour and roughness images
 */
function create(): IAutoMovieImage[] {
  const N: number = AutoMovieHumanSkinImage.reliefSize;
  const mm: number = AutoMovieHumanSkinImage.tile / N;
  const field: IField = heightField(N, mm);

  // Normal map: central differences of the periodic height, in mm per mm.
  const relief: Uint8Array = new Uint8Array(N * N * 3);
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const dx: number =
        (field.height[y * N + ((x + 1) % N)]! -
          field.height[y * N + ((x + N - 1) % N)]!) /
        (2 * mm);
      const dy: number =
        (field.height[((y + 1) % N) * N + x]! -
          field.height[((y + N - 1) % N) * N + x]!) /
        (2 * mm);
      const length: number = Math.hypot(dx, dy, 1);
      const at: number = (y * N + x) * 3;
      relief[at] = encode(-dx / length);
      relief[at + 1] = encode(-dy / length);
      relief[at + 2] = encode(1 / length);
    }

  // Colour and roughness at half resolution from the box-averaged pore
  // occupancy.
  const M: number = AutoMovieHumanSkinImage.detailSize;
  const k: number = N / M;
  const grain: Uint8Array = new Uint8Array(M * M * 3);
  const gloss: Uint8Array = new Uint8Array(M * M * 3);
  for (let y: number = 0; y < M; ++y)
    for (let x: number = 0; x < M; ++x) {
      let pit: number = 0;
      for (let j: number = 0; j < k; ++j)
        for (let i: number = 0; i < k; ++i)
          pit += field.pore[(y * k + j) * N + (x * k + i)]!;
      pit /= k * k;

      // Faint speckle of about 0.25 mm and a warmer cast in the pores.
      const speckle: number =
        AutoMovieHumanAppearanceNoise.tile2(
          811,
          (x / M) * 160,
          (y / M) * 160,
          160,
        ) - 0.5;
      const shade: number = 1 - 0.05 * pit + 0.015 * speckle;
      const at: number = (y * M + x) * 3;
      grain[at] = srgb(Math.min(1, shade * 0.995));
      grain[at + 1] = srgb(Math.min(1, shade * (0.99 - 0.02 * pit)));
      grain[at + 2] = srgb(Math.min(1, shade * (0.985 - 0.03 * pit)));
      gloss[at] = 255;
      gloss[at + 1] = Math.round(
        255 * (1 - 0.15 * (1 - Math.min(1, 1.6 * pit))),
      );
      gloss[at + 2] = 0;
    }

  return [
    image(AutoMovieHumanSkinImage.reliefId, N, relief),
    image(AutoMovieHumanSkinImage.grainId, M, grain),
    image(AutoMovieHumanSkinImage.glossId, M, gloss),
  ];
}

/** Periodic height field with the pore occupancy that shaped it. */
interface IField {
  /** Height in mm per pixel, row-major. */
  height: Float64Array;

  /** Pore occupancy in `[0, 1]` per pixel. */
  pore: Float64Array;
}

/**
 * Evaluate the micro-relief height field over one tile.
 *
 * @param N Edge in pixels
 * @param mm Pixel size in mm
 * @returns Height and pore occupancy
 */
function heightField(N: number, mm: number): IField {
  const noise: typeof AutoMovieHumanAppearanceNoise =
    AutoMovieHumanAppearanceNoise;
  const tile: number = N * mm;
  const height: Float64Array = new Float64Array(N * N);
  const pore: Float64Array = new Float64Array(N * N);

  // Pores: at most one per grid cell, drawn by splatting each pit. About a
  // third of the cells hold none, sizes are skewed toward small, depth grows
  // with size, and a 5 mm patchiness varies depth, so the pores never read
  // as a regular perforation.
  const cells: number = 64;
  const cell: number = tile / cells;
  for (let cj: number = 0; cj < cells; ++cj)
    for (let ci: number = 0; ci < cells; ++ci) {
      if (noise.hash(900, ci, cj) < 0.35) continue;
      const px: number = (ci + noise.hash(901, ci, cj)) * cell;
      const py: number = (cj + noise.hash(902, ci, cj)) * cell;
      const size: number = noise.hash(903, ci, cj) ** 3;
      const radius: number = 0.04 + 0.08 * size;
      const patch: number =
        0.35 + 0.65 * noise.tile2(904, (ci / cells) * 8, (cj / cells) * 8, 8);
      const depth: number = (0.006 + 0.018 * size) * patch;
      const reach: number = Math.ceil(radius / mm) + 1;
      const cx: number = px / mm;
      const cy: number = py / mm;
      for (
        let y: number = Math.floor(cy - reach);
        y <= Math.ceil(cy + reach);
        ++y
      )
        for (
          let x: number = Math.floor(cx - reach);
          x <= Math.ceil(cx + reach);
          ++x
        ) {
          const d: number = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) * mm;
          if (d >= radius) continue;
          const q: number = 1 - (d / radius) ** 2;
          const at: number = wrap(y, N) * N + wrap(x, N);
          height[at]! -= depth * q * q;
          pore[at] = Math.max(pore[at]!, q);
        }
    }

  // Undulation of 2 to 8 mm and a 0.3 mm grain.
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const u: number = (x + 0.5) / N;
      const v: number = (y + 0.5) / N;
      height[y * N + x]! +=
        0.01 * (noise.tile2(909, u * 5, v * 5, 5) - 0.5) +
        0.006 * (noise.tile2(910, u * 20, v * 20, 20) - 0.5) +
        0.002 * (noise.tile2(911, u * 128, v * 128, 128) - 0.5);
    }
  return { height, pore };
}

/**
 * Byte of a signed unit component.
 *
 * @param c Component in `[-1, 1]`
 * @returns `round(255 (c + 1) / 2)`
 */
function encode(c: number): number {
  return Math.round(127.5 * (c + 1));
}

/**
 * sRGB byte of a linear value (IEC 61966-2-1 transfer).
 *
 * @param linear Linear value in `[0, 1]`
 * @returns Encoded byte
 */
function srgb(linear: number): number {
  const c: number = Math.min(1, Math.max(0, linear));
  const e: number =
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(255 * e);
}

/**
 * Non-negative remainder.
 *
 * @param i Integer
 * @param n Positive modulus
 * @returns `i mod n` in `[0, n)`
 */
function wrap(i: number, n: number): number {
  return ((i % n) + n) % n;
}

/**
 * PNG image record of square RGB pixels.
 *
 * @param id Image id
 * @param size Edge in pixels
 * @param pixels RGB bytes
 * @returns Image record
 */
function image(id: string, size: number, pixels: Uint8Array): IAutoMovieImage {
  return {
    id,
    mimeType: "image/png",
    data: encodeAutoMoviePng({
      width: size,
      height: size,
      channels: 3,
      pixels,
    }),
  };
}
