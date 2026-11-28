import { AutoMovieEngineSound } from "@automovie/engine";
import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createProductionSoundAssetTestInputs } from "../../internal/audio/createProductionSoundAssetTestInputs";
import { nclose } from "../../internal/predicates";

/**
 * Decoded cue playback keeps asset identity, authored gain, unit-rate trims and
 * exact film-end support on the native 48,000 Hz clock.
 *
 * Scenarios:
 *
 * 1. A two-frame decoded cue at 24 fps reads the identity-bearing native ramp at
 *    offset 1000 with authored gain 0.5.
 * 2. Absent PCM uses an audible distinct stand-in; longer-source trims stay at
 *    unit rate, and a cue ending at film frame 6 remains supported.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the source ramp, required gain and rate, alternate stand-in path, source trim and legal film-tail boundary.
 * @evidence contracts/development/testing.md#behavioral-verification The test renders variants of the same plan with a named decoded asset, absent PCM, a longer alternate source and an offset cue. It reads actual mono-channel values from the resulting stereo PCM.
 * @evidence contracts/development/testing.md#independent-expectations The ramp directly supplies sample 1000 and the offset sample. Both must appear at gain 0.5 within 1e-6 at unit rate. An absent asset produces a distinct audible stand-in, and a cue ending exactly at frame six fits its three-frame span.
 */
export function test_engine_film_production_sound_asset(): void {
  const {
    SAMPLES_PER_FRAME,
    DURATION_FRAMES,
    TOTAL_FRAMES,
    plan,
    ramp,
    at,
  }: {
    FPS: number;
    SAMPLE_RATE: number;
    SAMPLES_PER_FRAME: number;
    START_FRAME: number;
    DURATION_FRAMES: number;
    TOTAL_FRAMES: number;
    plan: (props: {
      sourceDurationFrames?: number;
      sourceOffsetFrame?: number;
      startFrame?: number;
      durationFrames?: number;
      gain?: number;
    }) => IAutoMovieProductionSoundPlan;
    ntscPlan: (props: {
      sourceDurationFrames: number;
      sourceOffsetFrame: number;
      startFrame: number;
    }) => IAutoMovieProductionSoundPlan;
    ramp: (length: number) => Float32Array;
    at: (pcm: Float32Array, offset: number) => number;
    sample: (pcm: Float32Array, index: number) => number;
  } = createProductionSoundAssetTestInputs();

  const length: number = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source: Float32Array<ArrayBufferLike> = ramp(length);

  const longSource: Float32Array<ArrayBufferLike> = ramp(length * 2);

  const gain: number = 0.5;

  const played: Float32Array<ArrayBufferLike> =
    AutoMovieEngineSound.renderProductionSound({
      plan: plan({ gain }),
      assets: new Map([["public/bed.wav", source]]),
    }).pcm;

  const standIn: Float32Array<ArrayBufferLike> =
    AutoMovieEngineSound.renderProductionSound({
      plan: plan({ gain }),
    }).pcm;

  const shorterCue: Float32Array<ArrayBufferLike> =
    AutoMovieEngineSound.renderProductionSound({
      plan: plan({ gain, sourceDurationFrames: DURATION_FRAMES * 2 }),
      assets: new Map([["public/bed.wav", longSource]]),
    }).pcm;

  const offsetCue: Float32Array<ArrayBufferLike> =
    AutoMovieEngineSound.renderProductionSound({
      plan: plan({
        gain,
        sourceDurationFrames: DURATION_FRAMES * 2,
        sourceOffsetFrame: DURATION_FRAMES,
      }),
      assets: new Map([["public/bed.wav", longSource]]),
    }).pcm;

  // Read where the ramp is steep and unambiguous rather than at its ends, so a
  // renderer reading one sample early or late writes a different number here.
  const OFFSET: number = 1_000;

  TestValidator.predicate(
    "an authored cue mixes the asset it names at unit rate",
    nclose(at(played, OFFSET), source[OFFSET]! * gain, 1e-6) &&
      // The stand-in still sounds, and sounds like something else: without both
      // halves this reads as "the mix produced a number" rather than "the mix
      // produced the asset".
      Math.abs(at(standIn, OFFSET)) > 1e-6 &&
      nclose(at(standIn, OFFSET), at(played, OFFSET), 1e-6) === false &&
      // A cue half as long as its asset reads the first half of it, not the
      // whole asset at twice the speed.
      nclose(at(shorterCue, OFFSET), longSource[OFFSET]! * gain, 1e-6) &&
      nclose(
        at(offsetCue, OFFSET),
        longSource[length + OFFSET]! * gain,
        1e-6,
      ) &&
      AutoMovieEngineSound.renderProductionSound({
        plan: plan({ startFrame: TOTAL_FRAMES - DURATION_FRAMES }),
        assets: new Map([["public/bed.wav", source]]),
      }).analysis.samplePeak > 0,
  );
}
