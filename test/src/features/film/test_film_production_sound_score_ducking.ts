import {
  deriveProductionSoundPlan,
  renderProductionSound,
} from "@automovie/engine";
import type {
  IAutoMovieDeriveProductionSoundPlan,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Score ducking uses adopted dialogue placement and affects only the music bus.
 *
 * Scenarios:
 * 1. Two overlapping adopted lines use the stronger attenuation without stacking; compare independent sample expectations across attack, hold and release.
 * 2. A caption without adopted PCM does not duck, an omitted policy preserves the dry mix, and the ambience remains at its input gain.
 * 3. Fractional-rate and film-edge samples preserve absolute ramp anchors, including virtual anchors beyond the safe sample range.
 * 4. Both the planner and the public mixer reject a gain above unity, a fractional or negative ramp, and a raw null policy.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The four scenarios identify the audible time, bus, adoption and admission boundaries.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public production planner and mixer, then reads sample values from stereo output and checks public failure paths.
 * @evidence contracts/development/testing.md#independent-expectations Exact binary input gains and literal sample offsets pin half-ramps, overlap, untouched ambience and recovery without using the implementation's gain or clock functions.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples separate attack, overlap, release, the missing dialogue placement and the omitted policy. Invalid scalars exercise authored planner input and direct plan input independently.
 * @evidence contracts/development/testing.md#execution-ownership The scenario owns short in-memory PCM inputs and invokes no renderer, encoder, device or subprocess.
 */
export function test_film_production_sound_score_ducking(): void {
  const audioCue: IAutoMovieFilmTimeline["tracks"]["audio"][number] = {
    id: "bed",
    asset: "music.wav",
    sourceDurationFrames: 12,
    sourceOffsetFrame: 0,
    startFrame: 0,
    durationFrames: 12,
    gain: 1,
    fadeInFrames: 0,
    fadeOutFrames: 0,
    bus: "music",
  };
  const inputs: IAutoMovieDeriveProductionSoundPlan.IProps = {
    timeline: {
      version: 1,
      builder: "sound-test",
      inputFingerprint: "test",
      sourceDigest: "test",
      id: "test",
      fps: 24,
      totalFrames: 12,
      segments: [],
      omissions: [],
      tracks: {
        audio: [
          audioCue,
          { ...audioCue, id: "room", asset: "room.wav", bus: "ambience" },
        ],
        captions: [
          { id: "a", text: "a", language: "en", startFrame: 2, endFrame: 4 },
          { id: "b", text: "b", language: "en", startFrame: 3, endFrame: 5 },
          { id: "c", text: "c", language: "en", startFrame: 9, endFrame: 10 },
        ],
        effects: [],
      },
    },
    contracts: new Map(),
    compiled: new Map(),
  };
  const policy: NonNullable<IAutoMovieProductionSoundPlan["scoreDucking"]> = {
    gain: 0.25,
    attackFrames: 1,
    releaseFrames: 2,
  };
  const dry: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan(inputs);
  const ducked: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    ...inputs,
    scoreDucking: policy,
  });
  const assets: ReadonlyMap<string, Float32Array> = new Map([
    ["music.wav", new Float32Array(24_000).fill(0.25)],
    ["room.wav", new Float32Array(24_000).fill(0.125)],
  ]);
  const dialogue: ReadonlyMap<string, Float32Array> = new Map([
    ["a", new Float32Array(1)],
    ["b", new Float32Array(1)],
  ]);
  const actual: Float32Array = renderProductionSound({
    plan: ducked,
    assets,
    dialogue,
  }).pcm;
  const dryPcm: Float32Array = renderProductionSound({
    plan: dry,
    assets,
    dialogue,
  }).pcm;
  const expected: ReadonlyArray<readonly [number, number]> = [
    [2_000, 0.375],
    [3_000, 0.28125],
    [4_000, 0.1875],
    [7_000, 0.1875],
    [10_000, 0.1875],
    [12_000, 0.28125],
    [14_000, 0.375],
    [18_000, 0.375],
  ];
  TestValidator.predicate(
    "adopted dialogue attenuates music only, including the strongest overlapping ramp",
    () =>
      ducked.scoreDucking !== policy &&
      expected.every(
        ([sample, value]: readonly [number, number]): boolean =>
          nclose(actual[sample * 2]!, value, 1e-6) &&
          nclose(actual[sample * 2 + 1]!, value, 1e-6) &&
          nclose(dryPcm[sample * 2]!, 0.375, 1e-6),
      ),
  );

  const ntsc: IAutoMovieProductionSoundPlan = deriveProductionSoundPlan({
    ...inputs,
    timeline: {
      ...inputs.timeline,
      fps: 30_000 / 1_001,
      frameRate: { numerator: 30_000, denominator: 1_001 },
    },
    scoreDucking: policy,
  });
  const singleLine: ReadonlyMap<string, Float32Array> = new Map([
    ["a", new Float32Array(1)],
  ]);
  const ntscPcm: Float32Array = renderProductionSound({
    plan: ntsc,
    assets,
    dialogue: singleLine,
  }).pcm;
  TestValidator.predicate(
    "NTSC ramps start and end at the rounded absolute frame boundaries",
    (): boolean =>
      nclose(ntscPcm[1_602 * 2]!, 0.375, 1e-6) &&
      ntscPcm[1_603 * 2]! < 0.375 &&
      ntscPcm[9_609 * 2]! < 0.375 &&
      nclose(ntscPcm[9_610 * 2]!, 0.375, 1e-6),
  );

  const edgePlan: IAutoMovieProductionSoundPlan = {
    ...ducked,
    scoreDucking: { ...policy, attackFrames: 2 },
    dialogue: [
      { ...ducked.dialogue[0]!, startFrame: 1, endFrame: 2 },
      { ...ducked.dialogue[1]!, startFrame: 10, endFrame: 11 },
    ],
  };
  const clipped: Float32Array = renderProductionSound({
    plan: edgePlan,
    assets,
    dialogue,
  }).pcm;
  const longRamp: Float32Array = renderProductionSound({
    plan: {
      ...edgePlan,
      scoreDucking: {
        gain: 0.25,
        attackFrames: Number.MAX_SAFE_INTEGER,
        releaseFrames: Number.MAX_SAFE_INTEGER,
      },
    },
    assets,
    dialogue: singleLine,
  }).pcm;
  TestValidator.predicate(
    "film clipping keeps ramp phase and even long virtual anchors stay admissible",
    (): boolean =>
      nclose(clipped[0]!, 0.28125, 1e-6) &&
      nclose(clipped[23_000 * 2]!, 0.234375, 1e-6) &&
      nclose(longRamp[0]!, 0.1875, 1e-6) &&
      nclose(longRamp[23_999 * 2]!, 0.1875, 1e-6),
  );

  const invalid: Array<
    NonNullable<IAutoMovieProductionSoundPlan["scoreDucking"]>
  > = [
    { ...policy, gain: 1.25 },
    { ...policy, attackFrames: 0.5 },
    { ...policy, releaseFrames: -1 },
    null as unknown as NonNullable<
      IAutoMovieProductionSoundPlan["scoreDucking"]
    >,
  ];
  TestValidator.predicate(
    "malformed score policy is refused before mixing",
    () =>
      invalid.every(
        (
          scoreDucking: NonNullable<
            IAutoMovieProductionSoundPlan["scoreDucking"]
          >,
        ): boolean =>
          throwsError(
            (): IAutoMovieProductionSoundPlan =>
              deriveProductionSoundPlan({ ...inputs, scoreDucking }),
            ["score ducking"],
          ) &&
          throwsError(
            (): IAutoMovieRenderedProductionSound =>
              renderProductionSound({
                plan: { ...dry, scoreDucking },
                assets,
                dialogue,
              }),
            ["score ducking"],
          ),
      ),
  );
}
