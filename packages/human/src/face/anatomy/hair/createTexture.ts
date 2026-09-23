import { zlibSync } from "fflate";

import { IPortraitHairShape } from "./IPortraitHairShape";
import { assertPortraitHairFibreCurl } from "./assertPortraitHairFibreCurl";

/**
 * Shared by createPortraitHairTexture, createPortraitHairNormalTexture, which were one file until each public identity took its own.
 *
 * An optional fibre mixture paints greying hair. Greying is a follicle's own
 * switch, so a greying head is an admixture of white and pigmented fibres
 * rather than one faded colour (Tobin & Paus, Exp Gerontol 2001; Jo et al.,
 * Ann Dermatol 2018), and the largest fibre-level survey classified its 3,343
 * hairs as pigmented or white against a black-and-white card (Van Neste, Eur J
 * Dermatol 2004). `grey` is the proportion of fibres left unpigmented and each
 * fibre takes one side of that switch by its own deterministic coordinate. The
 * same survey measured the unpigmented fibre as the thicker one, 67.68 against
 * 57.41 micrometres, which is the width an unpigmented painted fibre takes
 * here. A fibre part-pigmented along its own length is documented (eLife
 * 2021) but has no published population frequency, so none is invented: a
 * fibre here is wholly one or the other. The pigment is given in the same
 * encoded space as the shade, so the caller's base finish is the unpigmented
 * fibre and the painted pigment multiplies it. Omitting the mixture leaves
 * every byte as it was.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Rejects invalid complete curl profiles without clamping or mutating the authored values.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Applies finite inclusive curl-pattern envelopes before either geometry or texture construction.
 * @author Samchon
 */
export function createTexture(
  seed: number,
  fibres: number,
  coverage: number,
  normal: boolean,
  curl?: IPortraitHairShape["fibreCurl"],
  shadeStrength = 1,
  mixture?: { pigment: readonly number[]; grey: number },
): string {
  if (mixture !== undefined) {
    if (
      !Number.isFinite(mixture.grey) ||
      mixture.grey < 0 ||
      mixture.grey > 1 ||
      mixture.pigment.length !== 3 ||
      !mixture.pigment.every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error(
        "A hair fibre mixture needs a grey proportion in [0,1] and a pigment in the unit cube.",
      );
  }
  if (curl !== undefined) assertPortraitHairFibreCurl(curl);
  if (!Number.isFinite(shadeStrength) || shadeStrength < 0 || shadeStrength > 1)
    throw new Error("Hair fibre shade strength must be finite in [0,1].");
  if (
    !Number.isInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    !Number.isInteger(fibres) ||
    fibres < 1 ||
    fibres > 32 ||
    !Number.isFinite(coverage) ||
    coverage < 0.1 ||
    coverage > 1
  )
    throw new Error(
      "Hair texture needs an unsigned seed, 1..32 fibres and coverage in [0.1,1].",
    );
  const width = curl === undefined ? 128 : 512,
    height = curl === undefined ? 256 : 512,
    channels = normal ? 3 : 4,
    stride = 1 + width * channels;
  const bytes = new Uint8Array(stride * height);
  const noise = (i: number) => {
    const value = Math.imul((i + 1) ^ seed, 0x45d9f3b);
    return (value >>> 0) / 0x100000000;
  };
  const curlNoise = (i: number): number => {
    let value = (i + 1) ^ seed;
    value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
    value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
    return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
  };
  // Trigonometry belongs to one fibre at one row, not every raster column.
  const curlRows =
    curl === undefined
      ? undefined
      : Array.from({ length: height }, (_, y) =>
          Array.from({ length: fibres }, (_, f) => {
            const t = y / (height - 1);
            const amplitude =
              curl.amplitude * (0.65 + 0.35 * curlNoise(f + 17));
            const frequency = curl.cycles * (0.8 + 0.4 * curlNoise(f + 11));
            const angle = 2 * Math.PI * (curlNoise(f) + frequency * t);
            return {
              center: (f + 0.5) / fibres + amplitude * Math.sin(angle),
              slope:
                amplitude *
                2 *
                Math.PI *
                frequency *
                Math.cos(angle) *
                curl.aspectRatio,
            };
          }),
        );
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const t = y / (height - 1),
        u = (x + 0.5) / width;
      let alpha = 0,
        shade = 0.65,
        transverse = 0,
        slope = 0,
        unpigmented = false;
      for (let f = 0; f < fibres; f++) {
        const phase = noise(f),
          tip = 0.72 + 0.28 * noise(f + 37);
        // Greying is the follicle's own switch, so a fibre is pigmented or it
        // is not, never a fraction of the way. An unpigmented fibre is also
        // the thicker one: 67.68 against 57.41 micrometres.
        // The proportion has to mean what it says, so the switch reads the
        // mixing hash rather than the single-multiply noise beside it, whose
        // consecutive fibres are too correlated to divide at a threshold.
        const white = mixture !== undefined && curlNoise(f + 53) < mixture.grey;
        const wave = curlRows?.[y][f];
        const center =
          wave === undefined
            ? (f + 0.5 + 0.2 * Math.sin(t * 5 + phase * 6.28)) / fibres
            : wave.center;
        const taper = Math.max(0, Math.min(1, (tip - t) / 0.15));
        const radius =
          (coverage / (fibres * 2)) *
          (0.6 + 0.4 * taper) *
          (white ? 67.68 / 57.41 : 1);
        const edge = Math.max(
          0,
          Math.min(1, (radius - Math.abs(u - center)) * width + 0.5),
        );
        const density = edge * Math.min(1, t * 40) * taper;
        if (density > alpha) {
          alpha = density;
          unpigmented = white;
          shade = 0.55 + 0.4 * phase + 0.05 * Math.sin(t * 18 + f);
          transverse = Math.max(-1, Math.min(1, (u - center) / radius));
          slope = wave === undefined ? 0 : wave.slope;
        }
      }
      const at = y * stride + 1 + x * channels;
      if (normal) {
        const crossScale = Math.hypot(1, slope);
        bytes[at] = Math.round(127.5 * (1 + transverse / crossScale));
        bytes[at + 1] = Math.round(
          127.5 * (1 - (transverse * slope) / crossScale),
        );
        bytes[at + 2] = Math.round(
          127.5 * (1 + Math.sqrt(1 - transverse * transverse)),
        );
      } else {
        if (shadeStrength !== 1) shade = 1 - shadeStrength * (1 - shade);
        for (let channel = 0; channel < 3; channel++)
          bytes[at + channel] = Math.round(
            255 *
              shade *
              (mixture === undefined || unpigmented
                ? 1
                : mixture.pigment[channel]),
          );
        bytes[at + 3] = Math.round(255 * alpha);
      }
    }
  const header = new Uint8Array(13),
    view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8;
  header[9] = normal ? 2 : 6;
  const chunks = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlibSync(bytes, { level: 6 })),
    chunk("IEND", new Uint8Array()),
  ];
  let binary = "";
  for (const part of chunks)
    for (const value of part) binary += String.fromCharCode(value);
  return "data:image/png;base64," + btoa(binary);
}

function chunk(name: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(data.length + 12),
    view = new DataView(bytes.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) bytes[4 + i] = name.charCodeAt(i);
  bytes.set(data, 8);
  let crc = 0xffffffff;
  for (let i = 4; i < bytes.length - 4; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ ((crc & 1) * 0xedb88320);
  }
  view.setUint32(bytes.length - 4, (crc ^ 0xffffffff) >>> 0);
  return bytes;
}
