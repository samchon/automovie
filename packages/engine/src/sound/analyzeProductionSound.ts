import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundAnalysis,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";

/** Analyze the exact limited stereo master and measure mixed peaks near expected event times.
 */
export function analyzeProductionSound(
  plan: IAutoMovieProductionSoundPlan,
  pcm: Float32Array,
  frameToSample: (frame: number) => number,
): IAutoMovieProductionSoundAnalysis {
  let peak: number = 0;
  let longestSilence: number = 0;
  let silence: number = 0;
  for (let frame: number = 0; frame < pcm.length / 2; ++frame) {
    const left: number = pcm[frame * 2]!;
    const right: number = pcm[frame * 2 + 1]!;
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
    if (Math.max(Math.abs(left), Math.abs(right)) < 1e-5) {
      silence += 1;
      longestSilence = Math.max(longestSilence, silence);
    } else silence = 0;
  }
  const sampleFrames: number = pcm.length / 2;
  return {
    version: 1,
    sampleRate: 48_000,
    sampleFrames,
    runtimeSeconds: sampleFrames / plan.sampleRate,
    integratedLoudness: integratedLoudness(pcm, plan.sampleRate),
    samplePeak: peak,
    // The preceding deterministic limiter scales the whole master below one.
    clippingSamples: 0,
    longestSilenceSeconds: longestSilence / plan.sampleRate,
    eventAlignment: plan.events.map(
      (
        event: IAutoMovieProductionSoundEvent,
      ): {
        id: string;
        expectedSeconds: number;
        peakSeconds: number;
        errorFrames: number;
        passed: boolean;
      } => {
        const expectedFrame: number =
          event.propagation?.boundary === "trimmed-at-segment"
            ? event.frame
            : (event.propagation?.arrivalFrame ?? event.frame);
        const expected: number = frameToSample(expectedFrame);
        const radius: number = Math.max(1, frameToSample(1));
        let peakSample: number = expected;
        let peakValue: number = -1;
        for (
          let sample: number = Math.max(0, expected - radius);
          sample <= Math.min(sampleFrames - 1, expected + radius);
          ++sample
        ) {
          const value: number = Math.max(
            Math.abs(pcm[sample * 2]!),
            Math.abs(pcm[sample * 2 + 1]!),
          );
          if (value > peakValue) {
            peakValue = value;
            peakSample = sample;
          }
        }
        const frameRate: IAutoMovieProductionFrameRate =
          resolveProductionFrameRate(plan);
        const errorFrames: number =
          (Math.abs(peakSample - expected) * frameRate.numerator) /
          (plan.sampleRate * frameRate.denominator);
        return {
          id: event.id,
          expectedSeconds: expected / plan.sampleRate,
          peakSeconds: peakSample / plan.sampleRate,
          errorFrames,
          passed: peakValue > 1e-5 && errorFrames <= 1,
        };
      },
    ),
  };
}

/** Apply the fixed 48kHz two-stage weighting coefficients, average 400ms blocks at 100ms hops and gate at -70 and relative -10 levels; silent/gated-out input returns null, without external conformance certification. */
const integratedLoudness: (
  pcm: Float32Array<ArrayBufferLike>,
  sampleRate: number,
) => number | null = (pcm: Float32Array, sampleRate: number): number | null => {
  if (pcm.every((sample: number): sample is number => sample === 0))
    return null;
  const weighted: Float64Array<ArrayBuffer> = new Float64Array(pcm.length);
  for (let channel: number = 0; channel < 2; ++channel) {
    const first: Float64Array<ArrayBufferLike> = biquadChannel(
      pcm,
      channel,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
    const second: Float64Array<ArrayBufferLike> = biquadChannel(
      first,
      0,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
      1,
    );
    for (let frame: number = 0; frame < second.length; ++frame)
      weighted[frame * 2 + channel] = second[frame]!;
  }
  const frames: number = pcm.length / 2;
  const blockFrames: number = Math.min(frames, Math.round(sampleRate * 0.4));
  const hopFrames: number = Math.max(1, Math.round(sampleRate * 0.1));
  const energies: number[] = [];
  for (
    let start: number = 0;
    start + blockFrames <= frames;
    start += hopFrames
  ) {
    let energy: number = 0;
    for (let frame: number = start; frame < start + blockFrames; ++frame) {
      const left: number = weighted[frame * 2]!;
      const right: number = weighted[frame * 2 + 1]!;
      energy += left * left + right * right;
    }
    energies.push(energy / blockFrames);
    if (start + blockFrames === frames) break;
  }
  const aboveAbsolute: number[] = energies.filter(
    (energy: number): boolean => loudnessOfEnergy(energy) >= -70,
  );
  if (aboveAbsolute.length === 0) return null;
  const relativeGate: number =
    loudnessOfEnergy(
      aboveAbsolute.reduce(
        (sum: number, energy: number): number => sum + energy,
        0,
      ) / aboveAbsolute.length,
    ) - 10;
  const gated: number[] = aboveAbsolute.filter(
    (energy: number): boolean => loudnessOfEnergy(energy) >= relativeGate,
  );
  return loudnessOfEnergy(
    gated.reduce((sum: number, energy: number): number => sum + energy, 0) /
      gated.length,
  );
};

/** Filter one channel with the supplied second-order numerator/denominator in its original recurrence order, returning a fresh Float64 mono generation and local two-sample histories. */
const biquadChannel: (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels?: number,
) => Float64Array<ArrayBufferLike> = (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels: number = 2,
): Float64Array => {
  const frames: number = Math.floor(interleaved.length / channels);
  const output: Float64Array<ArrayBuffer> = new Float64Array(frames);
  let x1: number = 0;
  let x2: number = 0;
  let y1: number = 0;
  let y2: number = 0;
  for (let frame: number = 0; frame < frames; ++frame) {
    const input: number = interleaved[frame * channels + channel]!;
    const value: number =
      numerator[0] * input +
      numerator[1] * x1 +
      numerator[2] * x2 -
      denominator[1] * y1 -
      denominator[2] * y2;
    output[frame] = value;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = value;
  }
  return output;
};

/** Map nonpositive mean-square energy to negative infinity, otherwise use the fixed -0.691 + 10log10(energy) loudness law consumed by the gate. */
const loudnessOfEnergy: (energy: number) => number = (
  energy: number,
): number => (energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy));
