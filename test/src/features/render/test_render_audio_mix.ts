import { renderProductionSound } from "@automovie/engine";
import { decodeProductionAudioAsset } from "@automovie/ingest";
import type {
  IAutoMovieProductionSoundCue,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";
import { encodeAutoMovieWavPcm16 } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The film's one mixer places cue trims sample-accurately and sums them, and
 * its master encodes to a PCM16 WAV that decodes back.
 *
 * Scenarios:
 *
 * 1. A cue starting on frame 2 at 24 fps lands on sample 4000; every sample before
 *    it is silent and its trim from source frame 1 reads source sample 2000
 *    first.
 * 2. A second cue on the same trim at half gain sums with the first: every mixed
 *    sample is 1.5 times the first cue's source sample under one master gain.
 * 3. A one-frame fade-in starts the cue at silence and reaches the full trim after
 *    2000 samples; the sample after the cue's last frame is silent.
 * 4. The encoded WAV has the canonical header and decodes through the public
 *    decoder to the stereo mean within one quantization step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios with the input and the placement, sum, fade or round trip each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Runs engine's `renderProductionSound`, render's `encodeAutoMovieWavPcm16` and ingest's decoder on in-memory inputs. A cue placed one sample off, a trim read from the wrong source sample, cues that do not add, or a fade that does not start from silence fails.
 * @evidence contracts/development/testing.md#independent-expectations At 24 fps a frame is 48000 / 24 = 2000 samples, so frame 2 starts at sample 4000 and source frame 1 at sample 2000; gains 1 and 0.5 sum to 1.5. Ratios against one master gain make the expectations independent of the master's loudness normalization. The WAV values follow the round(x × 32767) and 1/32768 scales.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the silent sample before a cue, its first and last samples, a summed overlap, a faded edge and the sample after its end; cue refusals belong to `test_film_production_sound_cue_admission`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_render_audio_mix`; it registers no dynamic cases and starts no process.
 */
export function test_render_audio_mix(): void {
  // A source whose samples name their own index, so a trim is visible.
  const source: Float32Array = Float32Array.from(
    { length: 8000 },
    (_: unknown, index: number): number =>
      0.05 * Math.sin((2 * Math.PI * 440 * index) / 48_000) +
      0.01 * (index / 8000),
  );
  const cue = (
    id: string,
    gain: number,
    fadeInFrames: number,
  ): IAutoMovieProductionSoundCue => ({
    id,
    asset: "tone",
    startFrame: 2,
    durationFrames: 2,
    sourceOffsetFrame: 1,
    sourceDurationFrames: 4,
    gain,
    fadeInFrames,
    fadeOutFrames: 0,
    bus: "effects",
    seed: 1,
  });
  const plan = (
    cues: IAutoMovieProductionSoundCue[],
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: "test_render_audio_mix",
    fps: 24,
    totalFrames: 24,
    sampleRate: 48_000,
    channels: 2,
    events: [],
    cues,
    dialogue: [],
  });
  const mix = (cues: IAutoMovieProductionSoundCue[]): Float32Array =>
    renderProductionSound({
      plan: plan(cues),
      assets: new Map([["tone", source]]),
    }).pcm;

  const summed: Float32Array = mix([cue("a", 1, 0), cue("b", 0.5, 0)]);
  const gain: number = summed[4000 * 2]! / (1.5 * source[2000]!);
  TestValidator.predicate(
    "cue placement, trim and sum",
    summed.slice(0, 4000 * 2).every((x: number): boolean => x === 0) &&
      gain > 0 &&
      [0, 1, 999, 3999].every(
        (k: number): boolean =>
          nclose(
            summed[(4000 + k) * 2]!,
            gain * 1.5 * source[2000 + k]!,
            1e-5,
          ) && summed[(4000 + k) * 2] === summed[(4000 + k) * 2 + 1],
      ) &&
      summed[8000 * 2] === 0,
  );

  const faded: Float32Array = mix([cue("a", 1, 1)]);
  const fadedGain: number = faded[6000 * 2]! / source[4000]!;
  TestValidator.predicate(
    "a one-frame fade-in starts at silence",
    faded[4000 * 2] === 0 &&
      nclose(faded[5000 * 2]!, fadedGain * 0.5 * source[3000]!, 1e-5) &&
      nclose(faded[7999 * 2]!, fadedGain * source[5999]!, 1e-5),
  );

  // WAV round trip.
  const left: Float32Array = new Float32Array([0, 0.5, -1, 1]);
  const right: Float32Array = new Float32Array([0, -0.5, -1, 0.25]);
  const bytes: Uint8Array = encodeAutoMovieWavPcm16(left, right, 48000);
  const view: DataView = new DataView(bytes.buffer);
  const decoded = decodeProductionAudioAsset({
    path: "mix",
    bytes,
    sampleRate: 48000,
  });
  TestValidator.predicate(
    "canonical header and round trip",
    bytes.length === 44 + 16 &&
      new TextDecoder().decode(bytes.subarray(0, 4)) === "RIFF" &&
      view.getUint16(22, true) === 2 &&
      view.getUint32(24, true) === 48000 &&
      view.getInt16(44 + 4 * 2, true) === -32768 &&
      view.getInt16(44 + 4 * 3, true) === 32767 &&
      decoded.sourceChannels === 2 &&
      [...decoded.samples].every(
        (x: number, k: number): boolean =>
          Math.abs(x - (left[k]! + right[k]!) / 2) <= 1 / 32768,
      ),
  );
}
