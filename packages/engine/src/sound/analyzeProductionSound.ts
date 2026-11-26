import type {
  IAutoMovieLoudnessMeter,
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundAnalysis,
  IAutoMovieProductionSoundEvent,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "../film/internal/resolveProductionFrameRate";
import { createAutoMovieLoudnessMeter } from "./createAutoMovieLoudnessMeter";

/**
 * Analyze the exact limited stereo master and measure mixed peaks near expected
 * event times.
 *
 * Integrated loudness and true peak come from one pass of engine's BS.1770-5
 * meter over the interleaved master; the sample peak, the samples outside [−1,
 * 1] and the longest run of frames under 1e−5 on both channels come from one
 * scan of the same samples.
 */
export function analyzeProductionSound(
  plan: IAutoMovieProductionSoundPlan,
  pcm: Float32Array,
  frameToSample: (frame: number) => number,
): IAutoMovieProductionSoundAnalysis {
  let peak: number = 0;
  let clipping: number = 0;
  let longestSilence: number = 0;
  let silence: number = 0;
  for (let frame: number = 0; frame < pcm.length / 2; ++frame) {
    const left: number = Math.abs(pcm[frame * 2]!);
    const right: number = Math.abs(pcm[frame * 2 + 1]!);
    peak = Math.max(peak, left, right);
    clipping += (left > 1 ? 1 : 0) + (right > 1 ? 1 : 0);
    if (Math.max(left, right) < 1e-5) {
      silence += 1;
      longestSilence = Math.max(longestSilence, silence);
    } else silence = 0;
  }
  const meter: IAutoMovieLoudnessMeter = createAutoMovieLoudnessMeter(2);
  meter.push(pcm);
  const measured: IAutoMovieLoudnessMeter.IMeasurement = meter.measure();
  const sampleFrames: number = pcm.length / 2;
  return {
    version: 2,
    sampleRate: 48_000,
    sampleFrames,
    runtimeSeconds: sampleFrames / plan.sampleRate,
    integratedLoudness: measured.integratedLufs,
    truePeakDbtp: measured.truePeakDbtp,
    samplePeak: peak,
    clippingSamples: clipping,
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
