import type {
  IAutoMovieProductionRoomTone,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRandom,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
import { createAutoMovieRandom } from "../random/createAutoMovieRandom";
import { deriveAutoMovieSeed } from "../random/deriveAutoMovieSeed";
import { AUTOMOVIE_ROOM_TONE } from "./AUTOMOVIE_ROOM_TONE";

/**
 * Generate every room-tone bed of a plan and add it, equally to both channels,
 * to an interleaved stereo mix.
 *
 * Source: the bed's seed keys a counter-based Philox stream
 * (`createAutoMovieRandom`, purpose `room-tone`), read at consecutive indices
 * as uniform noise in (−1, 1). Shape: a fixed bank of second-order band-pass
 * filters at the base-two octave centres from 31.25 Hz to 16 kHz
 * (`AUTOMOVIE_ROOM_TONE.bandsHz`), each with the one-octave bandwidth Q = 1/(2
 * sinh(ln 2 / 2)) ≈ 1.414 (Bristow-Johnson's audio EQ cookbook band-pass, 0 dB
 * peak). Band k's gain is `(tilt − 10 log10 2) × log2(f_k / 1 kHz)` dB: white
 * noise carries 3.01 dB more energy per octave band each octave up, so this
 * gain leaves octave-band energy sloping by the tilt. The bank's power gain for
 * the noise's variance of 1/3 is the mean of |H(e^jω)|² over a midpoint grid of
 * 8192 frequencies, which fixes the scale that brings the bed's RMS to
 * `levelDbfs` without measuring the realization. The filters run
 * `AUTOMOVIE_ROOM_TONE.warmUpSeconds` of noise before the bed's first sample,
 * so the lowest band has settled when the bed is heard.
 *
 * Edges: two beds where one ends on the frame the other starts meet with an
 * equal-power crossfade (`sin` in, `cos` out) of
 * `AUTOMOVIE_ROOM_TONE.crossfadeSeconds` centred on the shared boundary tick,
 * so each extends half the crossfade past it. Any other edge fades with the
 * same curve inside the bed. Frame boundaries map to sample ticks by the shared
 * nearest-tick rule.
 *
 * It refuses, naming the bed, an interval outside the film or not increasing,
 * beds that overlap, a non-finite level or tilt, a seed that is not a safe
 * integer and a repeated id.
 *
 * @param pcm Interleaved stereo mix, changed in place.
 * @param plan The plan whose `roomTone` beds are mixed.
 */
export function mixProductionRoomTone(
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
): void {
  const beds: IAutoMovieProductionRoomTone[] = [...(plan.roomTone ?? [])].sort(
    (
      a: IAutoMovieProductionRoomTone,
      b: IAutoMovieProductionRoomTone,
    ): number => a.startFrame - b.startFrame,
  );
  const ids: Set<string> = new Set();
  beds.forEach((bed: IAutoMovieProductionRoomTone, index: number): void => {
    const previous: IAutoMovieProductionRoomTone | undefined = beds[index - 1];
    if (
      ids.has(bed.id) ||
      Number.isSafeInteger(bed.startFrame) === false ||
      Number.isSafeInteger(bed.endFrame) === false ||
      bed.startFrame < 0 ||
      bed.endFrame <= bed.startFrame ||
      bed.endFrame > plan.totalFrames ||
      (previous !== undefined && bed.startFrame < previous.endFrame) ||
      Number.isFinite(bed.levelDbfs) === false ||
      Number.isFinite(bed.tiltDbPerOctave) === false ||
      Number.isSafeInteger(bed.seed) === false
    )
      throw new Error(
        `Room tone "${bed.id}" must be a uniquely named, nonoverlapping interval of whole frames inside the ${plan.totalFrames}-frame film with a finite level and tilt and a safe-integer seed, but spans frames ${bed.startFrame} to ${bed.endFrame} at ${bed.levelDbfs} dBFS, ${bed.tiltDbPerOctave} dB per octave and seed ${bed.seed}.`,
      );
    ids.add(bed.id);
  });

  const rate: number = plan.sampleRate;
  const frames: number = pcm.length / 2;
  const tick: (frame: number) => number = (frame: number): number =>
    productionFrameBoundaryToGridTick({
      frame,
      frameRate: resolveProductionFrameRate(plan),
      ticksPerSecond: rate,
      rounding: "nearest",
    });
  const crossfade: number = Math.max(
    1,
    Math.round(AUTOMOVIE_ROOM_TONE.crossfadeSeconds * rate),
  );
  const half: number = Math.floor(crossfade / 2);
  const warmUp: number = Math.round(AUTOMOVIE_ROOM_TONE.warmUpSeconds * rate);

  beds.forEach((bed: IAutoMovieProductionRoomTone, index: number): void => {
    const joinedBefore: boolean = beds[index - 1]?.endFrame === bed.startFrame;
    const joinedAfter: boolean = beds[index + 1]?.startFrame === bed.endFrame;
    const start: number = tick(bed.startFrame);
    const end: number = tick(bed.endFrame);
    const fadeIn: number = joinedBefore ? start - half : start;
    const fadeOut: number = joinedAfter ? end - half : end - crossfade;
    const first: number = Math.max(0, fadeIn);
    const last: number = Math.min(
      frames,
      joinedAfter ? fadeOut + crossfade : end,
    );

    const bank: IBand[] = createBank(bed.tiltDbPerOctave, rate);
    const scale: number =
      10 ** (bed.levelDbfs / 20) / Math.sqrt(bankPower(bank) / 3);
    const noise: IAutoMovieRandom = createAutoMovieRandom(
      deriveAutoMovieSeed(String(bed.seed), "room-tone"),
    );
    for (let at: number = first - warmUp; at < last; ++at) {
      const x: number = 2 * noise.float(at - first + warmUp) - 1;
      let y: number = 0;
      for (const band of bank) y += band.gain * filter(band, x);
      if (at < first) continue;

      // Equal-power fades over the crossfade length at each edge.
      const inside: number = Math.min(
        1,
        Math.max(0, (at - fadeIn + 0.5) / crossfade),
      );
      const outside: number = Math.min(
        1,
        Math.max(0, (at - fadeOut + 0.5) / crossfade),
      );
      const value: number =
        scale *
        y *
        Math.sin((Math.PI / 2) * inside) *
        Math.cos((Math.PI / 2) * outside);
      pcm[at * 2] += value;
      pcm[at * 2 + 1] += value;
    }
  });
}

/**
 * One band-pass section in direct form I with its normalized coefficients, its
 * linear gain and its state.
 */
interface IBand {
  /** Linear gain of the band. */
  gain: number;

  /** Numerator b0 (b1 is 0 and b2 is −b0). */
  b0: number;

  /** Denominator a1. */
  a1: number;

  /** Denominator a2. */
  a2: number;

  /** Last two inputs and outputs. */
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * Build the octave bank for a tilt: cookbook band-pass sections with constant 0
 * dB peak gain and band gains in dB per octave from 1 kHz.
 */
const createBank: (tilt: number, rate: number) => IBand[] = (
  tilt: number,
  rate: number,
): IBand[] =>
  AUTOMOVIE_ROOM_TONE.bandsHz.map((hz: number): IBand => {
    const omega: number = (2 * Math.PI * hz) / rate;
    const alpha: number = Math.sin(omega) / (2 * Q);
    const a0: number = 1 + alpha;
    return {
      gain: 10 ** (((tilt - 10 * Math.log10(2)) * Math.log2(hz / 1000)) / 20),
      b0: alpha / a0,
      a1: (-2 * Math.cos(omega)) / a0,
      a2: (1 - alpha) / a0,
      x1: 0,
      x2: 0,
      y1: 0,
      y2: 0,
    };
  });

/** One-octave bandwidth of each section as its Q: 1 / (2 sinh(ln 2 / 2)). */
const Q: number = 1 / (2 * Math.sinh(Math.LN2 / 2));

/** Run one sample through one section. */
const filter: (band: IBand, x: number) => number = (
  band: IBand,
  x: number,
): number => {
  const y: number =
    band.b0 * x - band.b0 * band.x2 - band.a1 * band.y1 - band.a2 * band.y2;
  band.x2 = band.x1;
  band.x1 = x;
  band.y2 = band.y1;
  band.y1 = y;
  return y;
};

/**
 * The bank's power gain for white input: the mean over ω in (0, π) of |Σ g_k
 * H_k(e^jω)|², on a midpoint grid of 8192 frequencies, which equals the output
 * variance over the input variance.
 */
const bankPower: (bank: readonly IBand[]) => number = (
  bank: readonly IBand[],
): number => {
  const points: number = 8192;
  let sum: number = 0;
  for (let index: number = 0; index < points; ++index) {
    const omega: number = (Math.PI * (index + 0.5)) / points;
    const c1: number = Math.cos(omega);
    const s1: number = Math.sin(omega);
    const c2: number = Math.cos(2 * omega);
    const s2: number = Math.sin(2 * omega);
    let re: number = 0;
    let im: number = 0;
    for (const band of bank) {
      // H(z) = b0 (1 − z^−2) / (1 + a1 z^−1 + a2 z^−2) at z = e^jω.
      const nr: number = band.b0 * (1 - c2);
      const ni: number = band.b0 * s2;
      const dr: number = 1 + band.a1 * c1 + band.a2 * c2;
      const di: number = -(band.a1 * s1 + band.a2 * s2);
      const d: number = dr * dr + di * di;
      re += (band.gain * (nr * dr + ni * di)) / d;
      im += (band.gain * (ni * dr - nr * di)) / d;
    }
    sum += re * re + im * im;
  }
  return sum / points;
};
