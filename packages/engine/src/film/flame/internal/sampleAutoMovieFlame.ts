import type {
  IAutoMovieFlameCue,
  IAutoMovieMesh,
  IAutoMovieProfilePoint,
} from "@automovie/interface";

import { revolveAutoMovieProfile } from "../../../geometry/internal/revolveAutoMovieProfile";
import { createAutoMovieGradientNoise3 } from "../../../random/internal/createAutoMovieGradientNoise3";
import { deriveAutoMovieSeed } from "../../../random/internal/deriveAutoMovieSeed";
import { heskestadFlameHeight } from "./heskestadFlameHeight";
import { puffingFrequency } from "./puffingFrequency";

/**
 * The shape of a flame cue at shot-local `seconds`: its surface mesh in the
 * emitter frame (`+Y` up the flame) and its silhouette area.
 *
 * Every value is a closed form of `seconds` and the cue, with no state between
 * samples, so any order of sampling gives the same flame.
 *
 * - `small`: a closed meridian `r0(s) = R · s^0.5 (1 − s)^1.2 / m` over `s = h /
 *   H` in [0, 1], normalized by its maximum `m` so the widest radius is `R`,
 *   displaced by `1 + 0.08 · n(3 s − 2 t, 0)` where `n` is the cue's seeded
 *   gradient noise (Perlin, "Improving noise", ACM TOG 21(3), 2002). The noise
 *   domain falls with time, so features travel up the flame. The tip sways
 *   sideways by `0.1 H` times noise read at 2 Hz, bending each ring in
 *   proportion to `s²`. An isolated candle flame burns steadily in still air
 *   (Kitahata et al., "Oscillation and synchronization in the combustion of
 *   candles", J. Phys. Chem. A 113, 2009), so a small flame does not pulse;
 *   treating lighter, torch and lantern flames the same way is a provisional
 *   choice, as are the 8 %, 10 % and 2 Hz amounts.
 * - `open`: Heskestad's luminous height `L` from the heat release and the
 *   diameter, pulsing as `L (1 + 0.25 sin(2π f t + φ))` at the puffing
 *   frequency `f = 1.5 D^(−1/2)` (Cetegen and Ahmed 1993) with a seeded phase
 *   `φ`, over a meridian `r0(s) = (D/2)(1 − s)^0.8` displaced by 15 % noise
 *   travelling up at `f` cells per second; the 25 % and 15 % depths are
 *   provisional estimates.
 * - `ember`: a flat disc of the cue's radius facing `+Y`, whose glow factor `1 +
 *   0.1 n(2 t)` varies at 2 Hz.
 *
 * The silhouette area is twice the integral of the displaced meridian radius
 * over height, by the trapezoid rule on the same samples the mesh revolves, for
 * a flame, and the disc's area times its glow factor for an ember.
 */
export function sampleAutoMovieFlame(
  cue: Pick<IAutoMovieFlameCue, "id" | "seed" | "size">,
  seconds: number,
): { mesh: IAutoMovieMesh; area: number } {
  const noise: (x: number, y: number, z: number) => number =
    createAutoMovieGradientNoise3(
      deriveAutoMovieSeed(String(cue.seed), "flame"),
    );
  const size: IAutoMovieFlameCue["size"] = cue.size;

  if (size.kind === "ember") {
    const glow: number = 1 + EMBER_GLOW * noise(SMALL_RATE * seconds, 0.5, 0.5);
    return {
      mesh: revolveAutoMovieProfile({
        profile: [
          { x: 0, y: 0 },
          { x: size.radius, y: 0 },
        ],
        segments: SEGMENTS,
      }),
      area: Math.PI * size.radius * size.radius * glow,
    };
  }

  // Height, base radius law, ripple depth and the rate features rise at.
  let height: number;
  let radius: (s: number) => number;
  let ripple: number;
  let rate: number;
  let sway: number;
  if (size.kind === "small") {
    height = size.height;
    const peak: number = Math.pow(1 / 3.4, 0.5) * Math.pow(2.4 / 3.4, 1.2);
    radius = (s: number): number =>
      (size.radius * Math.pow(s, 0.5) * Math.pow(1 - s, 1.2)) / peak;
    ripple = SMALL_RIPPLE;
    rate = SMALL_RATE;
    sway = SMALL_SWAY * height;
  } else {
    const frequency: number = puffingFrequency(size.diameter);
    const phase: number = Math.PI * (1 + noise(0.5, 0.5, 7.5));
    height =
      heskestadFlameHeight(size.heatRelease, size.diameter) *
      (1 + PUFF_DEPTH * Math.sin(2 * Math.PI * frequency * seconds + phase));
    radius = (s: number): number => (size.diameter / 2) * Math.pow(1 - s, 0.8);
    ripple = OPEN_RIPPLE;
    rate = frequency;
    sway = 0;
  }

  // The meridian closes on the axis at the tip; an open fire's base is a disc.
  const profile: IAutoMovieProfilePoint[] = [];
  if (size.kind === "open") profile.push({ x: 0, y: 0 });
  for (let i: number = 0; i <= MERIDIAN; ++i) {
    const s: number = i / MERIDIAN;
    const displaced: number =
      radius(s) *
      (1 + ripple * noise(CELLS_PER_HEIGHT * s - rate * seconds, 0.5, 0.5));
    profile.push({
      x: i === MERIDIAN ? 0 : Math.max(0, displaced),
      y: s * height,
    });
  }

  let area: number = 0;
  for (let i: number = 1; i < profile.length; ++i)
    area +=
      (profile[i - 1]!.x + profile[i]!.x) * (profile[i]!.y - profile[i - 1]!.y);

  // Sway bends each ring sideways in proportion to the square of its height.
  const mesh: IAutoMovieMesh = revolveAutoMovieProfile({
    profile,
    segments: SEGMENTS,
  });
  if (sway > 0) {
    const leanX: number = sway * noise(SMALL_RATE * seconds, 3.5, 0.5);
    const leanZ: number = sway * noise(SMALL_RATE * seconds, 5.5, 0.5);
    for (let v: number = 0; v < mesh.positions.length; v += 3) {
      const s: number = mesh.positions[v + 1]! / height;
      mesh.positions[v] = mesh.positions[v]! + leanX * s * s;
      mesh.positions[v + 2] = mesh.positions[v + 2]! + leanZ * s * s;
    }
  }
  return { mesh, area };
}

/** Meridian samples from the flame's base to its tip. */
const MERIDIAN: number = 16;

/** Angular segments of the revolved flame surface. */
const SEGMENTS: number = 24;

/**
 * Highest rate, cycles per second, at which a small flame's sway and an ember's
 * glow advance their noise: a provisional estimate that keeps them inside the
 * practical light key grid's 7.5 Hz limit.
 */
const SMALL_RATE: number = 2;

/** Provisional estimate: a small flame's radius varies by up to 8 %. */
const SMALL_RIPPLE: number = 0.08;

/** Provisional estimate: a small flame's tip sways by up to 10 % of its height. */
const SMALL_SWAY: number = 0.1;

/** Provisional estimate: an open fire's height swings by 25 % each puff. */
const PUFF_DEPTH: number = 0.25;

/** Provisional estimate: an open fire's radius varies by up to 15 %. */
const OPEN_RIPPLE: number = 0.15;

/** Provisional estimate: an ember's glow varies by up to 10 %. */
const EMBER_GLOW: number = 0.1;

/** Noise lattice cells per flame height, so features are a few per flame. */
const CELLS_PER_HEIGHT: number = 3;
