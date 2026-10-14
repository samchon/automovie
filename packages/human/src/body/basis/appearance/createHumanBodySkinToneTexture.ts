import { seededValue } from "@automovie/engine";

import { encodePng } from "../../../common/mesh/encodePng";
import type { IAutoMovieHumanBodySkinTone } from "../../structures/IAutoMovieHumanBodySkinTone";

/**
 * A tileable base-colour map of the skin's tone heterogeneity, as a PNG data URI, with reciprocal pre-encoding mean compensation; final texture quantization and material clipping do not preserve the mean exactly.
 *
 * Each chromophore's field is a periodic sum of `waves` sinusoids at integer frequencies of the tile, drawn log-uniformly inside its band of wavelengths, each at a random direction and phase and an amplitude of one over its frequency, scaled by the sum of nominal wave powers, so the field repeats seamlessly with the tile. At a texel the optical density at each primary is `strength × Σ spread × field × absorbance` over the two chromophores, and the texel's albedo multiplier is `exp(-density)`. The multipliers are divided by their largest value per primary, so the map stays in [0, 1] as a base-colour texture must, and encoded in 8-bit sRGB with opaque alpha. The returned `compensation` is one over the map's mean per primary, which the material's base colour is multiplied by. Every value comes from the table, the strength and `seededValue`, so the same inputs yield the same bytes.
 *
 * Repeated or sampled frequencies can correlate, so nominal power scaling does not establish unit sampled variance. Mean compensation is computed before sRGB quantization and later material-channel clipping; those steps limit exact mean preservation. The caller supplies an admitted table and finite selected strength.
 *
 * @evidence contracts/common.md#principled-implementation Seeded integer-frequency wave fields feed chromophore absorbance and exponential optical density; per-channel maximum normalization and mean compensation connect the PNG to its material multiplier.
 * @evidence contracts/common.md#clear-and-simple-design Field preparation is independent of strength, while one density pass produces three texture channels and a matching compensation tuple.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The periodic procedural model uses declared table parameters, not an individual pigment measurement; nominal wave power, pixel sampling, byte quantization and clipping leave the stated unresolved limits.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies optical-density construction, admitted inputs, deterministic seed, output colour space and the approximation behind variance and mean claims.
 * @evidence contracts/performance.md#efficient-algorithms Two field sums cost O(P squared times W) for side P and wave count W; separable row and column trigonometric tables avoid evaluating sine for every texel, then texture encoding uses linear pixel passes.
 * @evidence contracts/performance.md#reuse-equivalent-work A weak table-identity cache shares strength-independent fields, and a fixed sRGB lookup shares encoding arithmetic; cache correctness requires the table to remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak keys allow unused table fields to be collected; density and RGBA buffers expire after PNG encoding, while the returned string persists with its caller and no task or external handle is acquired.
 */
export function createHumanBodySkinToneTexture(
  table: IAutoMovieHumanBodySkinTone,
  strength: number,
): { texture: string; compensation: [number, number, number] } {
  const size: number = table.pixels;
  const fields: Float64Array[] = unitFields(table);
  const density: Float64Array[] = [
    new Float64Array(size * size),
    new Float64Array(size * size),
    new Float64Array(size * size),
  ];
  [table.melanin, table.haemoglobin].forEach(
    (
      chromophore: IAutoMovieHumanBodySkinTone["melanin"],
      index: number,
    ): void => {
      const field: Float64Array = fields[index];
      for (let c: number = 0; c < 3; c++) {
        const weight: number =
          strength * chromophore.spread * chromophore.absorbance[c];
        const channel: Float64Array = density[c];
        for (let i: number = 0; i < field.length; i++)
          channel[i] += weight * field[i];
      }
    },
  );
  const rgba: Uint8Array = new Uint8Array(size * size * 4);
  const compensation: [number, number, number] = [1, 1, 1];
  for (let c: number = 0; c < 3; c++) {
    const channel: Float64Array = density[c];
    let least: number = Infinity;
    for (let i: number = 0; i < channel.length; i++)
      least = Math.min(least, channel[i]);
    // the multiplier exp(-density) over its largest, exp(-least)
    let sum: number = 0;
    for (let i: number = 0; i < channel.length; i++) {
      const multiplier: number = Math.exp(-(channel[i] - least));
      sum += multiplier;
      rgba[i * 4 + c] = SRGB_BYTE[Math.round(multiplier * SRGB_STEPS)];
    }
    compensation[c] = channel.length / sum;
  }
  for (let i: number = 0; i < size * size; i++) rgba[i * 4 + 3] = 255;
  return {
    texture: encodePng({ width: size, height: size, rgba }),
    compensation,
  };
}

/**
 * Each chromophore's field scaled by nominal wave power, which no strength changes, computed once per table.
 */
const FIELDS: WeakMap<IAutoMovieHumanBodySkinTone, Float64Array[]> =
  new WeakMap<IAutoMovieHumanBodySkinTone, Float64Array[]>();
function unitFields(table: IAutoMovieHumanBodySkinTone): Float64Array[] {
  const cached: Float64Array[] | undefined = FIELDS.get(table);
  if (cached !== undefined) return cached;
  const size: number = table.pixels;
  const fields: Float64Array[] = [table.melanin, table.haemoglobin].map(
    (
      chromophore: IAutoMovieHumanBodySkinTone["melanin"],
      index: number,
    ): Float64Array => {
      const field: Float64Array = new Float64Array(size * size);
      const [shortest, longest]: [number, number] = chromophore.wavelengths;
      const low: number = table.tileMillimetres / longest;
      const high: number = table.tileMillimetres / shortest;
      let power: number = 0;
      for (let k: number = 0; k < chromophore.waves; k++) {
        const frequency: number =
          low * Math.pow(high / low, seededValue(table.seed, index, k, 1));
        const angle: number =
          seededValue(table.seed, index, k, 2) * 2 * Math.PI;
        const fx: number = Math.round(frequency * Math.cos(angle));
        const fy: number = Math.round(frequency * Math.sin(angle));
        if (fx === 0 && fy === 0) continue;
        const amplitude: number = 1 / Math.hypot(fx, fy);
        const phase: number =
          seededValue(table.seed, index, k, 3) * 2 * Math.PI;
        power += (amplitude * amplitude) / 2;
        // sin(A + B) from per-column and per-row tables: no sine per texel
        const sx: Float64Array = new Float64Array(size);
        const cx: Float64Array = new Float64Array(size);
        const sy: Float64Array = new Float64Array(size);
        const cy: Float64Array = new Float64Array(size);
        for (let t: number = 0; t < size; t++) {
          sx[t] = amplitude * Math.sin((2 * Math.PI * fx * t) / size);
          cx[t] = amplitude * Math.cos((2 * Math.PI * fx * t) / size);
          sy[t] = Math.sin((2 * Math.PI * fy * t) / size + phase);
          cy[t] = Math.cos((2 * Math.PI * fy * t) / size + phase);
        }
        for (let y: number = 0; y < size; y++) {
          const row: number = y * size;
          const c: number = cy[y];
          const s: number = sy[y];
          for (let x: number = 0; x < size; x++)
            field[row + x] += sx[x] * c + cx[x] * s;
        }
      }
      const scale: number = power > 0 ? 1 / Math.sqrt(power) : 0;
      for (let i: number = 0; i < field.length; i++) field[i] *= scale;
      return field;
    },
  );
  FIELDS.set(table, fields);
  return fields;
}

/** 8-bit sRGB of a linear value in [0, 1], in steps of 1/4096. */
const SRGB_STEPS: number = 4096;
const SRGB_BYTE: Uint8Array = Uint8Array.from(
  { length: SRGB_STEPS + 1 },
  (_: unknown, i: number): number => {
    const value: number = i / SRGB_STEPS;
    const encoded: number =
      value <= 0.0031308
        ? 12.92 * value
        : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
    return Math.round(encoded * 255);
  },
);
