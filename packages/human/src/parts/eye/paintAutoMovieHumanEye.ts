import { encodeAutoMoviePng } from "@automovie/engine";
import { IAutoMovieImage } from "@automovie/interface";

import { AutoMovieHumanIrisColor } from "../../structures/AutoMovieHumanIrisColor";
import { AUTOMOVIE_HUMAN_EYE } from "./AUTOMOVIE_HUMAN_EYE";
import { AUTOMOVIE_HUMAN_EYE_ATLAS } from "./AUTOMOVIE_HUMAN_EYE_ATLAS";
import { AUTOMOVIE_HUMAN_IRIS_PIGMENTS } from "./AUTOMOVIE_HUMAN_IRIS_PIGMENTS";
import { IAutoMovieHumanIrisPigment } from "./IAutoMovieHumanIrisPigment";

/**
 * Paint the eyeball's images for one iris colour on {@link AUTOMOVIE_HUMAN_EYE_ATLAS}: its colour and its roughness.
 *
 * The iris is drawn from its familiar surface anatomy, no measured pattern having been read: a black pupil; a thin dark pupillary ruff at its margin; the pupillary zone out to the collarette, a wavy ridge about a third of the way to the root; the ciliary zone beyond it, streaked by radial trabeculae with darker crypts between them in the inner half and broken concentric contraction furrows in the outer; and a dark limbal ring at the root. The limbal wall is dark, and the sclera is an off-white that greys into the limbus, with faint conjunctival vessels mostly toward the canthi, where the lids leave it exposed. Every texture feature is value noise on an integer hash, so the images are a pure function of the colour and the same in every run and on every platform; both eyes and every person of one colour share them. Pupil and limbus keep the measured proportion, 4 mm in an 11.73 mm limbus.
 *
 * The roughness image is the glTF metallic-roughness layout, roughness in green and metalness zero in blue: the wet conjunctiva over the sclera is glossy, the iris under the cornea matte, so the eye's highlight belongs to the tear film and the cornea rather than to the stroma. Grade: conventional.
 *
 * @param iris The iris colour
 * @returns Colour image id `human.eye.<iris>` and roughness image id `human.eye.roughness`, as images a model carries
 */
export function paintAutoMovieHumanEye(
  iris: AutoMovieHumanIrisColor,
): paintAutoMovieHumanEye.IOutput {
  const pigment: IAutoMovieHumanIrisPigment = AUTOMOVIE_HUMAN_IRIS_PIGMENTS[iris];
  const atlas: typeof AUTOMOVIE_HUMAN_EYE_ATLAS = AUTOMOVIE_HUMAN_EYE_ATLAS;
  const pupil: number = AUTOMOVIE_HUMAN_EYE.pupil / AUTOMOVIE_HUMAN_EYE.limbus;
  const color: Uint8Array = new Uint8Array(SIZE * SIZE * 3);
  for (let y: number = 0; y < SIZE; ++y)
    for (let x: number = 0; x < SIZE; ++x) {
      const u: number = (x + 0.5) / SIZE - 0.5;
      const v: number = (y + 0.5) / SIZE - 0.5;
      const rho: number = Math.hypot(u, v);
      const turn: number = (Math.atan2(v, u) / (2 * Math.PI) + 1) % 1;
      const rgb: Rgb =
        rho < atlas.iris
          ? paintIris(rho / atlas.iris, turn, pupil, pigment)
          : rho < atlas.limbus
            ? mix(
                scale(pigment.ring, 0.7),
                LIMBUS,
                (rho - atlas.iris) / (atlas.limbus - atlas.iris),
              )
            : paintSclera((rho - atlas.limbus) / (atlas.pole - atlas.limbus), turn);
      const at: number = 3 * (y * SIZE + x);
      for (let c: number = 0; c < 3; ++c)
        color[at + c] = Math.round(255 * clamp(rgb[c]!));
    }
  const roughness: Uint8Array = new Uint8Array(ROUGH_SIZE * ROUGH_SIZE * 3);
  for (let y: number = 0; y < ROUGH_SIZE; ++y)
    for (let x: number = 0; x < ROUGH_SIZE; ++x) {
      const rho: number = Math.hypot(
        (x + 0.5) / ROUGH_SIZE - 0.5,
        (y + 0.5) / ROUGH_SIZE - 0.5,
      );
      const at: number = 3 * (y * ROUGH_SIZE + x);
      roughness[at] = 255;
      roughness[at + 1] = Math.round(
        255 * (rho < atlas.limbus ? ROUGHNESS.iris : ROUGHNESS.sclera),
      );
      roughness[at + 2] = 0;
    }
  return {
    color: {
      id: `human.eye.${iris}`,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: SIZE,
        height: SIZE,
        channels: 3,
        pixels: color,
      }),
    },
    roughness: {
      id: "human.eye.roughness",
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: ROUGH_SIZE,
        height: ROUGH_SIZE,
        channels: 3,
        pixels: roughness,
      }),
    },
  };
}
/** Output type of {@link paintAutoMovieHumanEye}. */
export namespace paintAutoMovieHumanEye {
  /**
   * The eyeball's two images.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Base colour, sRGB. */
    color: IAutoMovieImage;

    /** Metallic-roughness, linear: roughness in green, metalness in blue. */
    roughness: IAutoMovieImage;
  }
}

/** An sRGB colour from 0 to 1. */
type Rgb = readonly [number, number, number];

/** Edge of the colour image, pixels: the iris spans 0.4 of it, about 205 pixels. */
const SIZE: number = 512;

/** Edge of the roughness image, pixels; it holds one step at the limbus. */
const ROUGH_SIZE: number = 64;

/** Roughness of the wet conjunctiva and of the stroma. Grade: conventional. */
const ROUGHNESS: Record<"sclera" | "iris", number> = { sclera: 0.22, iris: 0.6 };

/** The sclera's off-white, the grey of the limbal transition and the vessels' red, sRGB. Grade: conventional. */
const SCLERA: Rgb = [0.88, 0.85, 0.81];
const LIMBUS: Rgb = [0.6, 0.6, 0.62];
const VESSEL: Rgb = [0.72, 0.36, 0.34];
const PUPIL: Rgb = [0.02, 0.02, 0.025];

/**
 * One iris texel.
 *
 * @param s Radius from the pupil's centre over the limbus radius, 0 to 1
 * @param turn Azimuth in turns
 * @param pupil Pupil radius over limbus radius
 * @param pigment The category's colours
 * @returns Colour
 */
function paintIris(
  s: number,
  turn: number,
  pupil: number,
  pigment: IAutoMovieHumanIrisPigment,
): Rgb {
  if (s < pupil - 0.01) return PUPIL;
  // t: 0 at the pupillary margin, 1 at the root
  const t: number = Math.max(0, (s - pupil) / (1 - pupil));
  const collarette: number = 0.32 + 0.07 * (noise(turn * 14, 0.5, 14, 3) - 0.5);
  const zone: number = smooth(collarette - 0.04, collarette + 0.12, t);
  let rgb: Rgb = mix(pigment.pupillary, pigment.ciliary, zone);
  // radial trabeculae: noise stretched along the radius, fine over coarse
  const fibre: number =
    0.6 * noise(turn * 160, t * 2.5, 160, 5) +
    0.4 * noise(turn * 70, t * 1.5, 70, 6);
  rgb = mix(rgb, pigment.crest, 0.75 * smooth(0.45, 0.85, fibre));
  rgb = scale(rgb, 0.7 + 0.45 * fibre);
  // collarette ridge with a shadow on its pupillary side
  rgb = mix(rgb, pigment.crest, 0.45 * Math.exp(-(((t - collarette) / 0.03) ** 2)));
  rgb = scale(rgb, 1 - 0.3 * Math.exp(-(((t - collarette + 0.05) / 0.025) ** 2)));
  // crypts between the collarette and mid ciliary zone
  rgb = scale(rgb, 1 - 0.5 * crypt(turn, t));
  // broken contraction furrows in the outer ciliary zone
  for (const ring of [0.7, 0.8, 0.89])
    rgb = scale(
      rgb,
      1 -
        0.25 *
          Math.exp(-(((t - ring) / 0.012) ** 2)) *
          smooth(0.45, 0.65, noise(turn * 6, ring * 9, 6, 7)),
    );
  // pupillary ruff and limbal ring
  rgb = mix(rgb, scale(pigment.ring, 0.6), 1 - smooth(0.0, 0.05, t));
  rgb = mix(rgb, pigment.ring, 0.9 * smooth(0.8, 1, t));
  // the pupil's edge, one texel soft
  return mix(PUPIL, rgb, smooth(pupil - 0.01, pupil + 0.005, s));
}

/**
 * Darkening of a crypt at an iris point: hashed cells between the collarette and the mid ciliary zone, about two in five holding a soft elliptical pit stretched along the radius.
 *
 * @param turn Azimuth in turns
 * @param t Radius from the pupillary margin to the root, 0 to 1
 * @returns Darkening from 0 to 1
 */
function crypt(turn: number, t: number): number {
  const band: number = smooth(0.2, 0.3, t) * (1 - smooth(0.55, 0.68, t));
  if (band === 0) return 0;
  const cells: number = 40;
  const x: number = turn * cells;
  const y: number = t * 10;
  let out: number = 0;
  for (let dx: number = -1; dx <= 1; ++dx)
    for (let dy: number = -1; dy <= 1; ++dy) {
      const i: number = Math.floor(x) + dx;
      const j: number = Math.floor(y) + dy;
      const w: number = ((i % cells) + cells) % cells;
      if (hash(w, j, 11) > 0.4) continue;
      const cx: number = i + hash(w, j, 12);
      const cy: number = j + hash(w, j, 13);
      const r: number = 0.25 + 0.2 * hash(w, j, 14);
      const d: number = Math.hypot((x - cx) / r, (y - cy) / (1.6 * r));
      out = Math.max(out, 1 - smooth(0.6, 1, d));
    }
  return band * out;
}

/**
 * One sclera texel.
 *
 * @param s Radius from the limbus to the posterior pole, 0 to 1
 * @param turn Azimuth in turns, 0 toward the person's left
 * @returns Colour
 */
function paintSclera(s: number, turn: number): Rgb {
  let rgb: Rgb = mix(LIMBUS, SCLERA, smooth(0, 0.08, s));
  // exposed toward the canthi, where the conjunctival vessels show
  const canthal: number = Math.cos(2 * Math.PI * turn) ** 2;
  rgb = mix(rgb, [0.86, 0.78, 0.75], 0.35 * canthal * smooth(0.1, 0.5, s));
  const warp: number = 0.6 * noise(turn * 12, s * 3, 12, 21);
  const line: number = Math.abs(noise(turn * 22 + warp * 4, s * 1.2, 22, 22) - 0.5);
  const vessel: number =
    (1 - smooth(0.006, 0.02, line)) *
    smooth(0.05, 0.25, s) *
    (0.25 + 0.75 * canthal);
  return mix(rgb, VESSEL, 0.45 * vessel);
}

/**
 * Smoothed value noise on the integer lattice, periodic in x.
 *
 * @param x Coordinate across, wrapping every `period`
 * @param y Coordinate along
 * @param period Lattice period in x
 * @param seed Hash seed of this noise field
 * @returns Value from 0 to 1
 */
function noise(x: number, y: number, period: number, seed: number): number {
  const i: number = Math.floor(x);
  const j: number = Math.floor(y);
  const fx: number = smooth(0, 1, x - i);
  const fy: number = smooth(0, 1, y - j);
  const w = (k: number): number => ((k % period) + period) % period;
  const a: number = hash(w(i), j, seed);
  const b: number = hash(w(i + 1), j, seed);
  const c: number = hash(w(i), j + 1, seed);
  const d: number = hash(w(i + 1), j + 1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * Integer hash of a lattice point to `[0, 1)`, 32-bit multiply and xorshift steps, identical on every platform because `Math.imul` is exact.
 *
 * @param x Lattice column
 * @param y Lattice row
 * @param seed Field seed
 * @returns Value from 0 to 1
 */
function hash(x: number, y: number, seed: number): number {
  let h: number = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1);
  h = Math.imul(h ^ Math.imul(seed, 0x9e3779b1), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/**
 * Hermite step from 0 at `a` to 1 at `b`.
 *
 * @param a Lower edge
 * @param b Upper edge
 * @param x Value
 * @returns Step from 0 to 1
 */
function smooth(a: number, b: number, x: number): number {
  const t: number = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/**
 * Clamp to `[0, 1]`.
 *
 * @param x Value
 * @returns Clamped value
 */
function clamp(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/**
 * Linear blend of two colours.
 *
 * @param a From
 * @param b To
 * @param t Weight of `b`
 * @returns Blend
 */
function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * A colour times a factor.
 *
 * @param a Colour
 * @param k Factor
 * @returns Product
 */
function scale(a: Rgb, k: number): Rgb {
  return [a[0] * k, a[1] * k, a[2] * k];
}
