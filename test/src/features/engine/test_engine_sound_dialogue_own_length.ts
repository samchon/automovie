import {
  deriveProductionSoundPlan,
  joinAutoMovieDialogueVisemes,
  productionPhonemesToVisemes,
  productionSpeechEndFrame,
  renderProductionSound,
} from "@automovie/engine";
import { AutoMovieIngestAudio } from "@automovie/ingest";
import type {
  IAutoMovieDialogueVisemeTimeline,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundPlan,
  IAutoMovieProductionViseme,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A dialogue line plays at its own length and pitch, and its span drives
 * captions, ducking and visemes.
 *
 * Scenarios:
 *
 * 1. At 24 fps, a 48 000-sample line at 24 kHz converts to n = round(48000 × 48000
 *    / 24000) = 96 000 samples, and its speech span from frame 0 ends on frame
 *    48.
 * 2. Mixed from frame 0, the master's first 96 000 samples equal the converted
 *    line times one gain and the 240-sample edge fade, within Float32 rounding,
 *    and the master is silent after them.
 * 3. A 1.0 s 440 Hz sine adopted at 24 kHz shows 880 ± 2 zero crossings over its
 *    span in the master.
 * 4. On the timeline path, a caption from frame 0 to 36 is refused because it ends
 *    12 frames before the speech, a caption from 0 to 54 is admitted with the
 *    speech span 0 to 48, and a caption without a sample count keeps its
 *    window.
 * 5. With ducking on, music returns to its full gain by the end of the release
 *    that follows frame 48.
 * 6. A phoneme chunk spanning samples 24 000 to 48 000 of the worked line maps to
 *    frames 24 to 48.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the worked line, its span, its placement, pitch, caption, ducking and chunk mappings.
 * @evidence contracts/development/testing.md#behavioral-verification Runs ingest's decoder, engine's span rule, planner, mixer and chunk mapping. A mixer that stretches the line to a caption window changes its length and its zero-crossing count, so it fails.
 * @evidence contracts/development/testing.md#independent-expectations Values follow the worked case: 1 s per 24 frames, 2000 samples per frame, 440 Hz giving 880 crossings per second; ratios against one gain keep them independent of the master's level.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a refused and an admitted caption, a spoken and an unspoken caption, the ducked inside and the restored outside of a release; ducking details belong to `test_film_production_sound_score_ducking`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_sound_dialogue_own_length`; it starts no process.
 */
export function test_engine_sound_dialogue_own_length(): void {
  const decode: (samples: Float32Array) => Float32Array = (
    samples: Float32Array,
  ): Float32Array =>
    AutoMovieIngestAudio.decodeAsset({
      path: "line.wav",
      bytes: createDialogueReceiptFixture({
        line: "line",
        text: "line",
        samples,
        sampleRate: 24_000,
      }).pcm,
      sampleRate: 48_000,
    }).samples;
  const plan: (
    dialogueEnd: number,
    extra?: Partial<IAutoMovieProductionSoundPlan>,
  ) => IAutoMovieProductionSoundPlan = (
    dialogueEnd: number,
    extra: Partial<IAutoMovieProductionSoundPlan> = {},
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: "test_engine_sound_dialogue_own_length",
    fps: 24,
    totalFrames: 72,
    sampleRate: 48_000,
    channels: 2,
    events: [],
    cues: [],
    dialogue: [
      {
        id: "line",
        text: "line",
        language: "en",
        startFrame: 0,
        endFrame: dialogueEnd,
      },
    ],
    ...extra,
  });

  // The worked line: two seconds of a decaying tone at 24 kHz.
  const worked: Float32Array = decode(
    Float32Array.from(
      { length: 48_000 },
      (_: unknown, index: number): number =>
        0.2 *
        Math.sin((2 * Math.PI * 300 * index) / 24_000) *
        (1 - index / 96_000),
    ),
  );
  const end: number = productionSpeechEndFrame(
    { fps: 24, sampleRate: 48_000 },
    0,
    worked.length,
  );
  TestValidator.predicate(
    "the worked line spans 96 000 samples and ends on frame 48",
    worked.length === 96_000 && end === 48,
  );

  const master: Float32Array = renderProductionSound({
    plan: plan(end),
    dialogue: new Map([["line", worked]]),
  }).pcm;
  const gain: number = master[48_000 * 2]! / worked[48_000]!;
  const envelope: (index: number) => number = (index: number): number =>
    Math.min(1, index / 240, (96_000 - index) / 240);
  TestValidator.predicate(
    "the line plays at unit rate from its start tick",
    gain > 0 &&
      worked.every(
        (x: number, index: number): boolean =>
          nclose(master[index * 2]!, x * gain * envelope(index), 1e-6) &&
          master[index * 2] === master[index * 2 + 1],
      ) &&
      master.subarray(96_000 * 2).every((x: number): boolean => x === 0),
  );

  const sine: Float32Array = decode(
    Float32Array.from(
      { length: 24_000 },
      (_: unknown, index: number): number =>
        0.2 * Math.sin((2 * Math.PI * 440 * (index + 0.5)) / 24_000),
    ),
  );
  const pitched: Float32Array = renderProductionSound({
    plan: plan(
      productionSpeechEndFrame({ fps: 24, sampleRate: 48_000 }, 0, sine.length),
    ),
    dialogue: new Map([["line", sine]]),
  }).pcm;
  let crossings: number = 0;
  for (let index: number = 1; index < 48_000; ++index)
    if (
      Math.sign(pitched[index * 2]!) !== Math.sign(pitched[(index - 1) * 2]!) &&
      pitched[index * 2] !== 0
    )
      ++crossings;
  TestValidator.predicate(
    "a 440 Hz line keeps its pitch",
    Math.abs(crossings - 880) <= 2,
  );

  // The timeline path.
  const timeline: (
    captions: IAutoMovieFilmTimeline["tracks"]["captions"],
  ) => IAutoMovieFilmTimeline = (
    captions: IAutoMovieFilmTimeline["tracks"]["captions"],
  ): IAutoMovieFilmTimeline => ({
    version: 1,
    builder: "test",
    inputFingerprint: "test_engine_sound_dialogue_own_length",
    sourceDigest: "test",
    id: "film",
    fps: 24,
    totalFrames: 72,
    segments: [],
    omissions: [],
    tracks: { audio: [], captions, effects: [] },
  });
  const derive: (
    captions: IAutoMovieFilmTimeline["tracks"]["captions"],
  ) => IAutoMovieProductionSoundPlan = (
    captions: IAutoMovieFilmTimeline["tracks"]["captions"],
  ): IAutoMovieProductionSoundPlan =>
    deriveProductionSoundPlan({
      timeline: timeline(captions),
      contracts: new Map(),
      compiled: new Map(),
      speechSamples: new Map([["line", 96_000]]),
    });
  const caption: (
    id: string,
    endFrame: number,
  ) => IAutoMovieFilmTimeline["tracks"]["captions"][number] = (
    id: string,
    endFrame: number,
  ): IAutoMovieFilmTimeline["tracks"]["captions"][number] => ({
    id,
    text: id,
    language: "en",
    startFrame: 0,
    endFrame,
  });
  const admitted: IAutoMovieProductionSoundPlan = derive([
    caption("line", 54),
    caption("title", 30),
  ]);
  TestValidator.predicate(
    "captions end on or after the speech",
    throwsError(
      () => derive([caption("line", 36)]),
      ["frame 36", "frame 48"],
    ) &&
      admitted.dialogue[0]!.endFrame === 48 &&
      admitted.dialogue[1]!.endFrame === 30,
  );

  // Ducking releases after the speech span, not after the caption.
  const music: Float32Array = new Float32Array(144_000).fill(0.05);
  const ducked: Float32Array = renderProductionSound({
    plan: plan(48, {
      scoreDucking: { gain: 0.25, attackFrames: 2, releaseFrames: 6 },
      cues: [
        {
          id: "score",
          asset: "music",
          startFrame: 0,
          durationFrames: 72,
          sourceOffsetFrame: 0,
          sourceDurationFrames: 72,
          gain: 1,
          fadeInFrames: 0,
          fadeOutFrames: 0,
          bus: "music",
          seed: 1,
        },
      ],
    }),
    dialogue: new Map([["line", worked]]),
    assets: new Map([["music", music]]),
  }).pcm;
  const full: number = ducked[70 * 2000 * 2]!;
  TestValidator.predicate(
    "music returns to full gain by the end of the release after frame 48",
    full > 0 &&
      ducked[51 * 2000 * 2]! < full * 0.9 &&
      nclose(ducked[54 * 2000 * 2]!, full, 1e-7) &&
      nclose(ducked[60 * 2000 * 2]!, full, 1e-7),
  );

  const visemes: IAutoMovieProductionViseme[] = productionPhonemesToVisemes({
    chunks: [{ phonemes: "a", startSample: 24_000, endSample: 48_000 }],
  });
  const mouthTimeline: IAutoMovieDialogueVisemeTimeline | null =
    joinAutoMovieDialogueVisemes({
      line: {
        id: "line",
        text: "line",
        language: "en",
        speaker: "ann",
        startFrame: 0,
        endFrame: 48,
      },
      bindings: [{ speaker: "ann", actor: "ann" }],
      visemes,
      sourceSampleRate: 24_000,
      fps: 24,
    }).timeline;
  TestValidator.predicate(
    "a chunk maps to frames at the line's real rate",
    mouthTimeline !== null &&
      mouthTimeline.ranges.length === 1 &&
      mouthTimeline.ranges[0]!.startFrame === 24 &&
      mouthTimeline.ranges[0]!.endFrame === 48,
  );
}
