import type {
  IAutoMovieProductionRoomTone,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRandom,
} from "@automovie/interface";

import { productionFrameBoundaryToGridTick } from "../../film/internal/productionFrameBoundaryToGridTick";
import { resolveProductionFrameRate } from "../../film/internal/resolveProductionFrameRate";
import { AutoMovieEngineRandom } from "../../random/index";


import { AUTOMOVIE_ROOM_TONE } from "../constants/AUTOMOVIE_ROOM_TONE";

/*
 * Generate every room-tone bed of a plan and add it, equally to both channels,
 * to an interleaved stereo mix.
 *
 * Source: the bed's seed keys a counter-based Philox stream
 * (`AutoMovieEngineRandom.createRandom`, purpose `room-tone`), read at consecutive indices
 * as uniform noise in (−1, 1). Shape: a fixed bank of fourth-order band-pass
 * filters, each a second-order section run twice, at the base-two octave
 * centres from 31.25 Hz to 16 kHz (`AUTOMOVIE_ROOM_TONE.bandsHz`), each with
 * the one-octave bandwidth Q = 1/(2 sinh(ln 2 / 2)) ≈ 1.414 (Bristow-Johnson's
 * audio EQ cookbook band-pass, 0 dB peak). Band k's gain starts at `(tilt − 10
 * log10 2) × log2(f_k / 1 kHz)` dB, since white noise carries 3.01 dB more
 * energy per octave band each octave up, and is then fitted so the bank's
 * octave-band energies slope by the tilt. The bank's power gain for the noise's
 * variance of 1/3 is the mean of |H(e^jω)|² over a midpoint grid of 8192
 * frequencies, which fixes the scale that brings the bed's RMS to `levelDbfs`
 * without measuring the realization. The filters run
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
 * Parameter pcm: Interleaved stereo mix, changed in place.
 * Parameter plan: The plan whose `roomTone` beds are mixed.
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
      bed.startFrame < 0 ||
      bed.endFrame <= bed.startFrame ||
      bed.endFrame > plan.totalFrames ||
      (previous !== undefined && bed.startFrame < previous.endFrame)
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
    const noise: IAutoMovieRandom = AutoMovieEngineRandom.createRandom(
      AutoMovieEngineRandom.deriveSeed(String(bed.seed), "room-tone"),
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

/*
 * One band: a band-pass section in direct form I run twice in cascade, with its
 * normalized coefficients, its linear gain and both stages' state.
 */
interface IBand {
  /*
   * Linear gain of the band.
   */
  gain: number;

  /*
   * Numerator b0 (b1 is 0 and b2 is −b0).
   */
  b0: number;

  /*
   * Denominator a1.
   */
  a1: number;

  /*
   * Denominator a2.
   */
  a2: number;

  /*
   * Each stage's last two inputs and outputs, `[x1, x2, y1, y2]` of the first
   * stage, then of the second.
   */
  state: number[];
}

/*
 * Build the octave bank for a tilt: cookbook band-pass sections with constant 0
 * dB peak gain and band gains in dB per octave from 1 kHz, then fitted so the
 * bank's own octave-band energies slope by the tilt.
 *
 * Each band runs its section twice, so its skirts fall 12 dB per octave and its
 * octave-band leakage falls 9 dB per octave: one section's 6 dB skirts leak
 * energy falling only 3 dB per octave, which no gain can steepen, and a tilt
 * below about −3 dB per octave flattened to it. The neighbours still leak, so
 * the nominal gains alone miss a steep tilt. The fit corrects that in closed
 * form from the bank's response, never from a realization: each of
 * FIT_PASSES passes integrates the response's energy over each band's
 * octave, `[f / √2, f √2)`, and moves each gain by its octave's departure from
 * the tilt, the mean departure removed because the level is set afterwards.
 */
const createBank: (tilt: number, rate: number) => IBand[] = (
  tilt: number,
  rate: number,
): IBand[] => {
  const bank: IBand[] = AUTOMOVIE_ROOM_TONE.bandsHz.map((hz: number): IBand => {
    const omega: number = (2 * Math.PI * hz) / rate;
    const alpha: number = Math.sin(omega) / (2 * Q);
    const a0: number = 1 + alpha;
    return {
      gain: 10 ** (((tilt - 10 * Math.log10(2)) * Math.log2(hz / 1000)) / 20),
      b0: alpha / a0,
      a1: (-2 * Math.cos(omega)) / a0,
      a2: (1 - alpha) / a0,
      state: [0, 0, 0, 0, 0, 0, 0, 0],
    };
  });
  for (let pass: number = 0; pass < FIT_PASSES; ++pass) {
    const energies: number[] = octaveEnergies(bank, rate);
    const departures: number[] = AUTOMOVIE_ROOM_TONE.bandsHz.map(
      (hz: number, index: number): number =>
        10 * Math.log10(energies[index]!) - tilt * Math.log2(hz / 1000),
    );
    const mean: number =
      departures.reduce(
        (sum: number, value: number): number => sum + value,
        0,
      ) / departures.length;
    bank.forEach((band: IBand, index: number): void => {
      band.gain *= 10 ** (-(departures[index]! - mean) / 20);
    });
  }
  return bank;
};

/*
 * Passes of the octave-energy fit: each pass corrects most of the leakage that
 * remains, and eight leave the bank's octave slopes within hundredths of a dB
 * of the tilt over the tilts a room tone takes.
 */
const FIT_PASSES: number = 8;

/*
 * The bank's response energy over each band's octave, `[f / √2, f √2)`, on the
 * same midpoint grid bankPower uses, in the bank's order.
 */
const octaveEnergies: (bank: readonly IBand[], rate: number) => number[] = (
  bank: readonly IBand[],
  rate: number,
): number[] => {
  const energies: number[] = bank.map((): number => 0);
  const points: number = 8192;
  for (let index: number = 0; index < points; ++index) {
    const omega: number = (Math.PI * (index + 0.5)) / points;
    const hz: number = (omega * rate) / (2 * Math.PI);
    const band: number = AUTOMOVIE_ROOM_TONE.bandsHz.findIndex(
      (centre: number): boolean =>
        hz >= centre / Math.SQRT2 && hz < centre * Math.SQRT2,
    );
    if (band < 0) continue;
    const [re, im]: [number, number] = response(bank, omega);
    energies[band]! += re * re + im * im;
  }
  return energies;
};

/*
 * The bank's summed response at one angular frequency, as `[re, im]`.
 */
const response: (bank: readonly IBand[], omega: number) => [number, number] = (
  bank: readonly IBand[],
  omega: number,
): [number, number] => {
  const c1: number = Math.cos(omega);
  const s1: number = Math.sin(omega);
  const c2: number = Math.cos(2 * omega);
  const s2: number = Math.sin(2 * omega);
  let re: number = 0;
  let im: number = 0;
  for (const band of bank) {
    // H(z) = b0 (1 − z^−2) / (1 + a1 z^−1 + a2 z^−2) at z = e^jω, squared
    // for the two stages.
    const nr: number = band.b0 * (1 - c2);
    const ni: number = band.b0 * s2;
    const dr: number = 1 + band.a1 * c1 + band.a2 * c2;
    const di: number = -(band.a1 * s1 + band.a2 * s2);
    const d: number = dr * dr + di * di;
    const hr: number = (nr * dr + ni * di) / d;
    const hi: number = (ni * dr - nr * di) / d;
    re += band.gain * (hr * hr - hi * hi);
    im += band.gain * 2 * hr * hi;
  }
  return [re, im];
};

/*
 * One-octave bandwidth of each section as its Q: 1 / (2 sinh(ln 2 / 2)).
 */
const Q: number = 1 / (2 * Math.sinh(Math.LN2 / 2));

/*
 * Run one sample through a band's two stages.
 */
const filter: (band: IBand, x: number) => number = (
  band: IBand,
  x: number,
): number => {
  const s: number[] = band.state;
  let input: number = x;
  for (let at: number = 0; at < 8; at += 4) {
    const y: number =
      band.b0 * input -
      band.b0 * s[at + 1]! -
      band.a1 * s[at + 2]! -
      band.a2 * s[at + 3]!;
    s[at + 1] = s[at]!;
    s[at] = input;
    s[at + 3] = s[at + 2]!;
    s[at + 2] = y;
    input = y;
  }
  return input;
};

/*
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
    const [re, im]: [number, number] = response(
      bank,
      (Math.PI * (index + 0.5)) / points,
    );
    sum += re * re + im * im;
  }
  return sum / points;
};
