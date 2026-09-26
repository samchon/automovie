import { seededValue } from "@automovie/engine";

import { encodePortraitPng } from "../../face/mesh/encodePortraitPng";
import type { IAutoMovieHumanBodySkinTone } from "../structures/IAutoMovieHumanBodySkinTone";

/**
 * A tileable base-colour map of the skin's tone heterogeneity, as a PNG data
 * URI, with the factor that keeps the skin's mean colour where the site
 * albedo put it.
 *
 * Each chromophore's field is a periodic sum of `waves` sinusoids at integer
 * frequencies of the tile, drawn log-uniformly inside its band of
 * wavelengths, each at a random direction and phase and an amplitude of one
 * over its frequency, normalized to unit standard deviation, so the field
 * repeats seamlessly with the tile. At a texel the optical density at each
 * primary is `strength × Σ spread × field × absorbance` over the two
 * chromophores, and the texel's albedo multiplier is `exp(-density)`. The
 * multipliers are divided by their largest value per primary, so the map
 * stays in [0, 1] as a base-colour texture must, and encoded in 8-bit sRGB
 * with opaque alpha. The returned `compensation` is one over the map's mean
 * per primary, which the material's base colour is multiplied by. Every
 * value comes from the table, the strength and `seededValue`, so the same
 * inputs yield the same bytes.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Gives the body's skin the uneven tone of real skin, from its two chromophores' absorbance.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Implements the tone map: the chromophore fields, the optical density, the multiplier, its normalization and encoding.
 */
export function createHumanBodySkinToneTexture(
  table: IAutoMovieHumanBodySkinTone,
  strength: number,
): { texture: string; compensation: [number, number, number] } {
  const size = table.pixels;
  const fields = unitFields(table);
  const density = [
    new Float64Array(size * size),
    new Float64Array(size * size),
    new Float64Array(size * size),
  ];
  [table.melanin, table.haemoglobin].forEach((chromophore, index) => {
    const field = fields[index];
    for (let c = 0; c < 3; c++) {
      const weight = strength * chromophore.spread * chromophore.absorbance[c];
      const channel = density[c];
      for (let i = 0; i < field.length; i++) channel[i] += weight * field[i];
    }
  });
  const rgba = new Uint8Array(size * size * 4);
  const compensation: [number, number, number] = [1, 1, 1];
  for (let c = 0; c < 3; c++) {
    const channel = density[c];
    let least = Infinity;
    for (let i = 0; i < channel.length; i++)
      least = Math.min(least, channel[i]);
    // the multiplier exp(-density) over its largest, exp(-least)
    let sum = 0;
    for (let i = 0; i < channel.length; i++) {
      const multiplier = Math.exp(-(channel[i] - least));
      sum += multiplier;
      rgba[i * 4 + c] = SRGB_BYTE[Math.round(multiplier * SRGB_STEPS)];
    }
    compensation[c] = channel.length / sum;
  }
  for (let i = 0; i < size * size; i++) rgba[i * 4 + 3] = 255;
  return {
    texture: encodePortraitPng({ width: size, height: size, rgba }),
    compensation,
  };
}

/**
 * Each chromophore's field at unit standard deviation, which no strength
 * changes, computed once per table.
 */
const FIELDS = new WeakMap<IAutoMovieHumanBodySkinTone, Float64Array[]>();
function unitFields(table: IAutoMovieHumanBodySkinTone): Float64Array[] {
  const cached = FIELDS.get(table);
  if (cached !== undefined) return cached;
  const size = table.pixels;
  const fields = [table.melanin, table.haemoglobin].map(
    (chromophore, index) => {
      const field = new Float64Array(size * size);
      const [shortest, longest] = chromophore.wavelengths;
      const low = table.tileMillimetres / longest;
      const high = table.tileMillimetres / shortest;
      let power = 0;
      for (let k = 0; k < chromophore.waves; k++) {
        const frequency =
          low * Math.pow(high / low, seededValue(table.seed, index, k, 1));
        const angle = seededValue(table.seed, index, k, 2) * 2 * Math.PI;
        const fx = Math.round(frequency * Math.cos(angle));
        const fy = Math.round(frequency * Math.sin(angle));
        if (fx === 0 && fy === 0) continue;
        const amplitude = 1 / Math.hypot(fx, fy);
        const phase = seededValue(table.seed, index, k, 3) * 2 * Math.PI;
        power += (amplitude * amplitude) / 2;
        // sin(A + B) from per-column and per-row tables: no sine per texel
        const sx = new Float64Array(size);
        const cx = new Float64Array(size);
        const sy = new Float64Array(size);
        const cy = new Float64Array(size);
        for (let t = 0; t < size; t++) {
          sx[t] = amplitude * Math.sin((2 * Math.PI * fx * t) / size);
          cx[t] = amplitude * Math.cos((2 * Math.PI * fx * t) / size);
          sy[t] = Math.sin((2 * Math.PI * fy * t) / size + phase);
          cy[t] = Math.cos((2 * Math.PI * fy * t) / size + phase);
        }
        for (let y = 0; y < size; y++) {
          const row = y * size;
          const c = cy[y];
          const s = sy[y];
          for (let x = 0; x < size; x++)
            field[row + x] += sx[x] * c + cx[x] * s;
        }
      }
      const scale = power > 0 ? 1 / Math.sqrt(power) : 0;
      for (let i = 0; i < field.length; i++) field[i] *= scale;
      return field;
    },
  );
  FIELDS.set(table, fields);
  return fields;
}

/** 8-bit sRGB of a linear value in [0, 1], in steps of 1/4096. */
const SRGB_STEPS = 4096;
const SRGB_BYTE = Uint8Array.from({ length: SRGB_STEPS + 1 }, (_, i) => {
  const value = i / SRGB_STEPS;
  const encoded =
    value <= 0.0031308
      ? 12.92 * value
      : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
});
