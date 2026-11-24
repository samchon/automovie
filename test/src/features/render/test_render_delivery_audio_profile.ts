import type { IAutoMovieProductionAudioProbe } from "@automovie/interface";
import {
  AUTOMOVIE_PRODUCTION_AAC_PROFILE,
  assertProductionAacProfile,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * The delivered soundtrack must be the AAC profile the delivery encoder writes:
 * AAC-LC at 48 kHz in two channels.
 *
 * Scenarios:
 *
 * 1. The profile constant holds `mp4a`, object type 2, 48,000 Hz and two channels,
 *    the encoder's `-c:a aac -ar 48000 -ac 2`.
 * 2. A 48 kHz stereo AAC-LC track passes.
 * 3. The same track at 44.1 kHz is refused at `sampleRate`, with the expected and
 *    observed rates.
 * 4. A mono track, an HE-AAC object type, an Opus sample entry, a 44.1 kHz media
 *    clock and a track with no samples are each refused at their own field.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the exported asserter on probe records; an asserter that skipped a field, compared the wrong one or accepted any AAC variant fails a case.
 * @evidence contracts/development/testing.md#independent-expectations The profile is the encoder's documented argument vector (`planAutoMovieVideoEncoding`) and ISO/IEC 14496-3's object type 2 for AAC-LC; the refusal names are the asserter's documented message form.
 * @evidence contracts/development/testing.md#distinguishing-cases One conforming track against one changed field per refusal, including the 44.1 kHz rate the issue names. Reading the facts from a file is owned by test_cli_delivery_video_probe.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit on in-memory records; it reads no file.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_render_delivery_audio_profile(): void {
  const track: IAutoMovieProductionAudioProbe = {
    kind: "audio",
    container: "mp4",
    codec: "mp4a.40.2",
    runtimeSeconds: 2,
    channels: 2,
    sampleRate: 48_000,
    sampleCount: 95,
    primingSamples: 1024,
    timebase: {
      movieTimescale: 24,
      mediaTimescale: 48_000,
      movieDuration: 48,
      mediaDuration: 97_024,
      edits: [
        {
          segmentDuration: 48,
          mediaTime: 1024,
          mediaRateInteger: 1,
          mediaRateFraction: 0,
        },
      ],
    },
    sampleEntry: {
      codec: "mp4a",
      audioObjectType: 2,
      sampleRate: 48_000,
      channelCount: 2,
    },
  };

  // 1. The constant.
  TestValidator.equals("profile", AUTOMOVIE_PRODUCTION_AAC_PROFILE, {
    codec: "mp4a",
    audioObjectType: 2,
    sampleRate: 48_000,
    channelCount: 2,
  });

  // 2. A conforming track.
  assertProductionAacProfile(track);

  // 3. 44.1 kHz.
  TestValidator.predicate(
    "44.1 kHz is refused",
    throwsError(
      (): void =>
        assertProductionAacProfile({
          ...track,
          sampleRate: 44_100,
          sampleEntry: { ...track.sampleEntry, sampleRate: 44_100 },
          timebase: { ...track.timebase, mediaTimescale: 44_100 },
        }),
      "unsupported-audio-profile.sampleRate: expected 48000, observed 44100.",
    ),
  );

  // 4. One field each.
  const cases: [string, IAutoMovieProductionAudioProbe][] = [
    [
      "channelCount",
      { ...track, sampleEntry: { ...track.sampleEntry, channelCount: 1 } },
    ],
    [
      "audioObjectType",
      { ...track, sampleEntry: { ...track.sampleEntry, audioObjectType: 5 } },
    ],
    [
      "codec",
      { ...track, sampleEntry: { ...track.sampleEntry, codec: "Opus" } },
    ],
    [
      "timebase.mediaTimescale",
      { ...track, timebase: { ...track.timebase, mediaTimescale: 44_100 } },
    ],
    ["sampleCount", { ...track, sampleCount: 0 }],
  ];
  for (const [field, actual] of cases)
    TestValidator.predicate(
      `${field} is refused`,
      throwsError(
        (): void => assertProductionAacProfile(actual),
        `unsupported-audio-profile.${field}:`,
      ),
    );
}
