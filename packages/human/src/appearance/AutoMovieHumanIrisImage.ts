import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanIrisColor } from "../typings/AutoMovieHumanIrisColor";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import { AutoMovieHumanEyeball } from "./AutoMovieHumanEyeball";

/**
 * Procedural iris image: the anterior iris surface as seen through the
 * cornea, as an sRGB PNG the model carries.
 *
 * The image is a square whose inscribed circle is the limbus, matching the
 * iris UVs of {@link AutoMovieHumanEyeball}. Each pixel evaluates a polar
 * field in limbus units: pupil, pupillary ruff, pupillary zone, wavy
 * collarette, ciliary zone with radial stromal fibres, crypts and
 * concentric contraction furrows, and the darker limbal ring. These are
 * the anatomical surface features of the iris (pupillary and ciliary
 * zones split by the collarette; crypts of Fuchs; contraction furrows),
 * placed by conventional radii; their sizes and contrasts are artistic
 * conventions, not measurements.
 *
 * Colour: each closed {@link AutoMovieHumanIrisColor} choice names three
 * sRGB colours (stroma of the ciliary zone, lighter fibres, pupillary-zone
 * pigment). Blending happens in linear light and the result is stored as
 * sRGB bytes for an `srgb` binding. The choice is a category, so its
 * colours are a convention per category, not a pigment model.
 *
 * Determinism: fixed integer seeds per field, independent of person and
 * side; the two eyes rotate the one image differently instead of storing
 * two. Cost: 512 x 512 RGB, 768 KiB raw, a stored-block PNG of the same
 * size plus base64's third.
 */
export namespace AutoMovieHumanIrisImage {
  /** Edge length in pixels: about 44 pixels per millimetre of iris. */
  export const size: number = 512;

  /**
   * Generate the iris image of one colour choice.
   *
   * @param color Iris colour category
   * @returns Image with id `human.eye.iris.<color>`
   */
  export function generate(color: AutoMovieHumanIrisColor): IAutoMovieImage {
    const palette: IPalette = PALETTES[color];
    const stroma: number[] = linear(palette.stroma);
    const fibre: number[] = linear(palette.fibre);
    const inner: number[] = linear(palette.inner);
    const pupil: number =
      AutoMovieHumanEyeball.dimensions.pupilRadius /
      AutoMovieHumanEyeball.dimensions.limbusRadius;

    const pixels: Uint8Array = new Uint8Array(size * size * 3);
    for (let row: number = 0; row < size; ++row)
      for (let col: number = 0; col < size; ++col) {
        // Pixel centre in limbus units; u runs along +z and v along -y in
        // the eye frame, as the iris UVs map them.
        const z: number = ((col + 0.5) / size) * 2 - 1;
        const y: number = 1 - ((row + 0.5) / size) * 2;
        const rgb: number[] = shade(
          Math.hypot(y, z),
          Math.atan2(y, z) / (2 * Math.PI),
          pupil,
          stroma,
          fibre,
          inner,
        );
        for (let a: number = 0; a < 3; ++a)
          pixels[(row * size + col) * 3 + a] = Math.round(
            255 * linearToSrgb(Math.min(1, Math.max(0, rgb[a]!))),
          );
      }

    return {
      id: `human.eye.iris.${color}`,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: size,
        height: size,
        channels: 3,
        pixels,
      }),
    };
  }
}

/** Three sRGB 8-bit colours of one iris category. */
interface IPalette {
  /** Ciliary-zone stroma between fibres. */
  stroma: [number, number, number];

  /** Light radial fibres (trabeculae) over the stroma. */
  fibre: [number, number, number];

  /** Pupillary-zone pigment inside the collarette. */
  inner: [number, number, number];
}

/**
 * Category colours, sRGB. Light irises (blue, grey) have little anterior
 * melanin, so light-scattering stroma shows pale fibres over a dark
 * backdrop; brown irises are pigment-dense with low fibre contrast; hazel
 * keeps brown pigment inside the collarette over a green-grey periphery,
 * as the category's own definition states. Values are artistic.
 */
const PALETTES: Record<AutoMovieHumanIrisColor, IPalette> = {
  [AutoMovieHumanIrisColor.Blue]: {
    stroma: [62, 96, 138],
    fibre: [150, 182, 210],
    inner: [92, 106, 118],
  },
  [AutoMovieHumanIrisColor.Gray]: {
    stroma: [96, 104, 110],
    fibre: [172, 178, 182],
    inner: [104, 104, 100],
  },
  [AutoMovieHumanIrisColor.Green]: {
    stroma: [74, 102, 68],
    fibre: [146, 164, 108],
    inner: [124, 102, 54],
  },
  [AutoMovieHumanIrisColor.Hazel]: {
    stroma: [92, 100, 66],
    fibre: [158, 150, 98],
    inner: [118, 74, 36],
  },
  [AutoMovieHumanIrisColor.LightBrown]: {
    stroma: [116, 78, 42],
    fibre: [170, 126, 76],
    inner: [104, 64, 32],
  },
  [AutoMovieHumanIrisColor.Brown]: {
    stroma: [78, 48, 26],
    fibre: [122, 82, 48],
    inner: [66, 38, 20],
  },
  [AutoMovieHumanIrisColor.DarkBrown]: {
    stroma: [40, 25, 16],
    fibre: [66, 43, 27],
    inner: [32, 20, 13],
  },
};

/**
 * Linear colour of the iris field at one point.
 *
 * @param r Radius in limbus units: 0 at the pupil centre, 1 at the limbus
 * @param a Angle in turns, in `(-0.5, 0.5]`
 * @param pupil Pupil radius in limbus units
 * @param stroma Linear ciliary stroma colour
 * @param fibre Linear fibre colour
 * @param inner Linear pupillary-zone colour
 * @returns Linear RGB, unclamped
 */
function shade(
  r: number,
  a: number,
  pupil: number,
  stroma: number[],
  fibre: number[],
  inner: number[],
): number[] {
  const N: typeof AutoMovieHumanAppearanceNoise = AutoMovieHumanAppearanceNoise;

  // Radial iris coordinate: 0 at the pupillary margin, 1 at the limbus.
  const t: number = (r - pupil) / (1 - pupil);

  // Collarette near a third of the way out, wavy with 14 lobes around.
  const collarette: number = 0.33 + 0.1 * (N.periodic1(11, a * 14, 14) - 0.5);

  // Radial fibres: two angular frequencies, gently warped by low-frequency
  // noise so they wander a little off the spokes, and broken along their
  // length by a second field so they read as separate trabeculae.
  const warp: number = N.fractal2(12, a * 16, t * 2.5, 16, 2) - 0.5;
  const fine: number =
    0.55 * N.periodic1(13, a * 110 + warp * 1.5, 110) +
    0.45 * N.periodic1(14, a * 260 + warp * 2.5, 260);
  const broken: number = 0.7 + 0.6 * N.value2(16, a * 70, t * 7, 70);

  // Crypts: dark lacunae just outside the collarette, elongated radially.
  const crypt: number = crypts(a, t, collarette);

  // Contraction furrows: faint concentric arcs in the outer ciliary zone,
  // present on part of the circle only.
  let furrow: number = 0;
  for (const [k, at] of [0.68, 0.8, 0.9].entries()) {
    const wobble: number = 0.02 * (N.periodic1(20 + k, a * 9, 9) - 0.5);
    const arc: number = N.smoothstep(0.45, 0.75, N.periodic1(30 + k, a * 6, 6));
    furrow += arc * Math.exp(-(((t - at - wobble) / 0.016) ** 2));
  }

  // Zone colour: pupillary pigment inside the collarette, stroma outside.
  const outer: number = N.smoothstep(collarette - 0.03, collarette + 0.03, t);
  const ridge: number = Math.exp(-(((t - collarette) / 0.02) ** 2));
  const fibreWeight: number = 0.12 + 0.5 * fine ** 2 * broken + 0.3 * ridge;

  // Limbal ring, the pupillary ruff and the pupil itself.
  const limbal: number = N.smoothstep(0.8, 1.0, t);
  const ruff: number = 1 - N.smoothstep(0.0, 0.05, t);
  const hole: number = 1 - N.smoothstep(pupil - 0.012, pupil + 0.004, r);

  const out: number[] = [0, 0, 0];
  for (let c: number = 0; c < 3; ++c) {
    const zone: number = inner[c]! + (stroma[c]! - inner[c]!) * outer;
    let v: number = zone * 0.75 + (fibre[c]! - zone * 0.75) * fibreWeight;
    v *= 1 - 0.45 * crypt;
    v *= 1 - 0.25 * Math.min(1, furrow);
    v += (stroma[c]! * 0.22 - v) * 0.85 * limbal;
    v += (inner[c]! * 0.22 - v) * ruff;
    v += (0.004 - v) * hole;
    out[c] = v;
  }
  return out;
}

/**
 * Crypt (lacuna) darkness at one point of the ciliary zone.
 *
 * The circle is split into 26 angular cells; a hash decides whether a cell
 * holds a crypt (65 percent do) and places its centre and size inside the
 * cell. A crypt is a soft ellipse about 0.12 to 0.28 of the iris width long
 * radially and under half a cell wide, starting just outside the collarette.
 * Only the point's own and two neighbouring cells can reach it, because a
 * crypt's half-width stays below one cell.
 *
 * @param a Angle in turns
 * @param t Radial iris coordinate, 0 at the pupillary margin, 1 at the limbus
 * @param collarette Local collarette position in the same coordinate
 * @returns Darkness in `[0, 1]`
 */
function crypts(a: number, t: number, collarette: number): number {
  const N: typeof AutoMovieHumanAppearanceNoise = AutoMovieHumanAppearanceNoise;
  const cells: number = 26;
  const home: number = Math.floor(a * cells);
  let out: number = 0;
  for (let c: number = home - 1; c <= home + 1; ++c) {
    const id: number = ((c % cells) + cells) % cells;
    if (N.hash(40, id) >= 0.65) continue;

    // Centre and half-sizes of this cell's crypt.
    const centreA: number = (c + 0.2 + 0.6 * N.hash(41, id)) / cells;
    const centreT: number = collarette + 0.08 + 0.22 * N.hash(42, id);
    const length: number = 0.06 + 0.08 * N.hash(43, id);
    const width: number = (0.12 + 0.12 * N.hash(44, id)) / cells;

    const da: number = a - centreA;
    const d: number = ((t - centreT) / length) ** 2 + (da / width) ** 2;
    out = Math.max(out, 1 - N.smoothstep(0.5, 1, d));
  }
  return out;
}

/**
 * Linear components of an 8-bit sRGB colour.
 *
 * @param srgb Encoded components in `[0, 255]`
 * @returns Linear components in `[0, 1]`
 */
function linear(srgb: [number, number, number]): number[] {
  return srgb.map((c: number): number => {
    const v: number = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
}

/**
 * sRGB transfer function (IEC 61966-2-1).
 *
 * @param c Linear component in `[0, 1]`
 * @returns Encoded component in `[0, 1]`
 */
function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}
