import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { renderProductionSound } from "../../../../packages/engine/src/sound/renderProductionSound";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  nclose,
} from "../internal/predicates";
import { createProductionSoundAssetTestInputs } from "../internal/audio/createProductionSoundAssetTestInputs";

/**
 * Decoded cue playback keeps asset identity, authored gain, unit-rate trims and exact film-end support on the native 48,000 Hz clock.
 *
 * Scenarios:
 * 1. A two-frame decoded cue at 24 fps reads the identity-bearing native ramp at offset 1000 with authored gain 0.5.
 * 2. Absent PCM uses an audible distinct stand-in; longer-source trims stay at unit rate, and a cue ending at film frame 6 remains supported.
 *
 * @evidence contracts/testing.md#behavioral-verification Mixes supplied mono asset ramps and an absent-asset stand-in, asserting exact unit-rate trim reads, authored gain and film-end admission.
 * @evidence contracts/testing.md#independent-expectations The authored ramp sample and gain determine each expected PCM value with nclose; the absent-asset comparison proves a distinct audible fallback but does not independently specify its complete procedural spectrum.
 * @evidence contracts/testing.md#distinguishing-cases Keeps ordinary playback, absent asset, longer complete source, offset ending at source extent and a cue ending at film extent; malformed spans and supplied PCM belong to the cue-admission and ingress entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_asset and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_asset(): void {
  const { SAMPLES_PER_FRAME, DURATION_FRAMES, TOTAL_FRAMES, plan, ramp, at }: { FPS: number; SAMPLE_RATE: number; SAMPLES_PER_FRAME: number; START_FRAME: number; DURATION_FRAMES: number; TOTAL_FRAMES: number; plan: (props: { sourceDurationFrames?: number; sourceOffsetFrame?: number; startFrame?: number; durationFrames?: number; gain?: number; }) => IAutoMovieProductionSoundPlan; ntscPlan: (props: { sourceDurationFrames: number; sourceOffsetFrame: number; startFrame: number; }) => IAutoMovieProductionSoundPlan; ramp: (length: number) => Float32Array; at: (pcm: Float32Array, offset: number) => number; sample: (pcm: Float32Array, index: number) => number; } = createProductionSoundAssetTestInputs();

  const length: number = DURATION_FRAMES * SAMPLES_PER_FRAME;

  const source: Float32Array<ArrayBufferLike> = ramp(length);

  const longSource: Float32Array<ArrayBufferLike> = ramp(length * 2);

  const gain: number = 0.5;

  const played: Float32Array<ArrayBufferLike> = renderProductionSound({
      plan: plan({ gain }),
      assets: new Map([["public/bed.wav", source]]),
    }).pcm;

  const standIn: Float32Array<ArrayBufferLike> = renderProductionSound({ plan: plan({ gain }) }).pcm;

  const shorterCue: Float32Array<ArrayBufferLike> = renderProductionSound({
      plan: plan({ gain, sourceDurationFrames: DURATION_FRAMES * 2 }),
      assets: new Map([["public/bed.wav", longSource]]),
    }).pcm;

  const offsetCue: Float32Array<ArrayBufferLike> = renderProductionSound({
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
        renderProductionSound({
              plan: plan({ startFrame: TOTAL_FRAMES - DURATION_FRAMES }),
              assets: new Map([["public/bed.wav", source]]),
            }).analysis.samplePeak > 0,
    );
}
