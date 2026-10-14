import type { IAutoMovieProductionSoundPlan } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { renderProductionSound } from "@automovie/engine";
import { nclose } from "../internal/nclose";

/**
 * PCM replay and cue source phase need only a short isolated sound plan.
 * Scenarios:
 * 1. A 120ms plan with one 80ms cue repeats byte-for-byte without changing input.
 * 2. Advancing the cue's source offset by 20ms changes its waveform while
 * preserving film extent and exact silence before the cue starts at 20ms.
 *
 * @evidence contracts/testing.md#behavioral-verification Renders a short isolated cue twice and with a shifted source phase, asserting repeat bytes, unchanged authored input, fixed stereo extent, leading silence and audible cue support.
 * @evidence contracts/testing.md#independent-expectations The 120ms/48kHz/stereo extent and 20ms silent prefix give literal sample-count expectations; replay equality and changed-source inequality are metamorphic expectations, not an independent spectrum or universal cross-host byte oracle.
 * @evidence contracts/testing.md#distinguishing-cases Preserves repeated input, source-offset change, unchanged film duration and positive silent/audible spans; malformed cue frames, missing supplied samples and rational phase boundaries have separate entries.
 * @evidence contracts/testing.md#execution-ownership The runner discovers test_film_production_sound_replay and this entry owns its direct and delegated in-memory CPU assertions; it acquires no renderer, GPU, decoder, native build, installed consumer or completed-result cache. Numeric/byte observations do not prove hardware appearance or universal cross-host identity.
 */
export function test_film_production_sound_replay(): void {
  const plan: IAutoMovieProductionSoundPlan = {
    version: 1,
    inputFingerprint: "sha256:replay",
    fps: 1000,
    totalFrames: 120,
    sampleRate: 48_000,
    channels: 2,
    events: [],
    dialogue: [],
    cues: [
      {
        id: "music",
        asset: "public/music.json",
        bus: "music",
        seed: 7,
        sourceDurationFrames: 100,
        sourceOffsetFrame: 0,
        startFrame: 20,
        durationFrames: 80,
        gain: 0.25,
        fadeInFrames: 0,
        fadeOutFrames: 0,
      },
    ],
  };
  const original: IAutoMovieProductionSoundPlan = structuredClone(plan);
  const first: Float32Array<ArrayBufferLike> = renderProductionSound({
    plan,
  }).pcm;
  const second: Float32Array<ArrayBufferLike> = renderProductionSound({
    plan,
  }).pcm;
  TestValidator.predicate(
    "byte-identical replay",
    Buffer.from(first.buffer).equals(Buffer.from(second.buffer)),
  );
  TestValidator.equals(
    "input metadata is immutable",
    {
      fingerprint: plan.inputFingerprint,
      events: plan.events,
      dialogue: plan.dialogue,
      frameRate: plan.frameRate,
      cues: plan.cues.map(
        (
          cue: IAutoMovieProductionSoundPlan["cues"][number],
        ): { id: string; asset: string; bus: string } => ({
          id: cue.id,
          asset: cue.asset,
          bus: cue.bus,
        }),
      ),
    },
    {
      fingerprint: original.inputFingerprint,
      events: original.events,
      dialogue: original.dialogue,
      frameRate: original.frameRate,
      cues: original.cues.map(
        (
          cue: IAutoMovieProductionSoundPlan["cues"][number],
        ): { id: string; asset: string; bus: string } => ({
          id: cue.id,
          asset: cue.asset,
          bus: cue.bus,
        }),
      ),
    },
  );
  TestValidator.predicate(
    "input numeric operands are immutable",
    plan.version === original.version &&
      plan.channels === original.channels &&
      nclose(plan.fps, original.fps, 0) &&
      plan.totalFrames === original.totalFrames &&
      plan.sampleRate === original.sampleRate &&
      plan.cues.length === original.cues.length &&
      plan.cues.every(
        (
          cue: IAutoMovieProductionSoundPlan["cues"][number],
          index: number,
        ): boolean => {
          const expected:
            | IAutoMovieProductionSoundPlan["cues"][number]
            | undefined = original.cues[index];
          return (
            expected !== undefined &&
            cue.seed === expected.seed &&
            cue.sourceDurationFrames === expected.sourceDurationFrames &&
            cue.sourceOffsetFrame === expected.sourceOffsetFrame &&
            cue.startFrame === expected.startFrame &&
            cue.durationFrames === expected.durationFrames &&
            nclose(cue.gain, expected.gain, 0) &&
            cue.fadeInFrames === expected.fadeInFrames &&
            cue.fadeOutFrames === expected.fadeOutFrames
          );
        },
      ),
  );
  const shifted: Float32Array<ArrayBufferLike> = renderProductionSound({
    plan: { ...plan, cues: [{ ...plan.cues[0], sourceOffsetFrame: 20 }] },
  }).pcm;
  TestValidator.predicate(
    "source clock changes the waveform",
    !Buffer.from(first.buffer).equals(Buffer.from(shifted.buffer)),
  );
  TestValidator.equals("120ms interleaved stereo", first.length, 5760 * 2);
  TestValidator.equals(
    "source shift keeps film duration",
    shifted.length,
    first.length,
  );
  for (const pcm of [first, shifted]) {
    TestValidator.predicate(
      "20ms leading silence",
      pcm.subarray(0, 960 * 2).every((v: number): boolean => nclose(v, 0, 0)),
    );
    TestValidator.predicate(
      "the cue is audible",
      pcm
        .subarray(960 * 2, 4800 * 2)
        .some((v: number): boolean => !nclose(v, 0, 0)),
    );
  }
}
