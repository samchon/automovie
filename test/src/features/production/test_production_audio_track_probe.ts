import { namedFacts, nclose, throwsError as refused } from "../internal/predicates";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { createFile } from "mp4box";
import { productionAudioMp4 } from "../internal/productionMedia/productionAudioMp4";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionOpusMp4 } from "../internal/productionMedia/productionOpusMp4";

const boxTypeOffset: (bytes: Uint8Array, type: string) => number = (bytes: Uint8Array, type: string): number => {
  const offset: number = Buffer.from(bytes).indexOf(type);
  if (offset < 0) throw new Error(`MP4 fixture has no ${type} box.`);
  return offset;
};

/**
 * Audio-mix evidence reads real Opus packet/priming and presentation metadata while retaining exact supported track and channel admission.
 *
 * Scenarios:
 *
 * 1. Derive the one-second stereo 48 kHz input, 312 priming samples and packet inventory.
 * 2. Refuse mono AAC, zero clock, wrong media type, video/feature misuse and trackless audio.
 *
 * @evidence contracts/testing.md#behavioral-verification Parses complete resident MP4 bytes through the production dispatcher, asserting Opus audio kind/container, one-second presentation, stereo 48 kHz identity, nonempty packet inventory and 312 priming samples, then requires the original messages for the six authored incompatible inputs.
 * @evidence contracts/testing.md#independent-expectations Authored 48000 presentation samples at 48000 Hz give one second and the fixture's explicit Opus header supplies two channels and 312 pre-skip samples. The fixture shares the trim operation with the product, so this is parser/profile integration rather than an independent encoder or edit-writer oracle; packet count is only required positive.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both numbered scenarios, independently encoded mono AAC, zeroed mdhd timescale, wrong declared media type, audio offered as feature, video offered as audio and a real trackless movie, preventing unconditional admission or refusal.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns all bytes and SDK containers and changes only its copied mdhd field for the zero-clock case. It calls the real parser and profile with no native codec, file access, foreign method replacement or generated test.
 */
export function test_production_audio_track_probe(): void {
  const video: Uint8Array = productionSampleMp4({width:16,height:16,fps:24,frameCount:4});
  const audio: Uint8Array = productionOpusMp4(48_000);
  const audioProbe: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
    kind: "audio-mix",
    mediaType: "audio/mp4",
    bytes: audio,
  });
  TestValidator.equals(
    "the audio probe derives presentation clock, profile, packets and priming",
    namedFacts([
      ["audioProbeKindAudio", (): boolean => audioProbe.kind === "audio"],
      [
        "audioProbeContainerMp4",
        (): boolean => audioProbe.kind === "audio" && audioProbe.container === "mp4",
      ],
      [
        "audioProbeCodecToLowerCase",
        (): boolean =>
          audioProbe.kind === "audio" &&
          audioProbe.codec.toLowerCase().startsWith("opus"),
      ],
      [
        "audioProbeRuntimeSeconds",
        (): boolean => audioProbe.kind === "audio" && nclose(audioProbe.runtimeSeconds, 1, 0),
      ],
      [
        "audioProbeChannels",
        (): boolean => audioProbe.kind === "audio" && audioProbe.channels === 2,
      ],
      [
        "audioProbeSampleRate000",
        (): boolean => audioProbe.kind === "audio" && audioProbe.sampleRate === 48_000,
      ],
      [
        "audioProbeSampleCount",
        (): boolean => audioProbe.kind === "audio" && audioProbe.sampleCount > 0,
      ],
      [
        "audioProbePrimingSamples",
        (): boolean => audioProbe.kind === "audio" && audioProbe.primingSamples === 312,
      ],
    ]),
    {
      audioProbeKindAudio: true,
      audioProbeContainerMp4: true,
      audioProbeCodecToLowerCase: true,
      audioProbeRuntimeSeconds: true,
      audioProbeChannels: true,
      audioProbeSampleRate000: true,
      audioProbeSampleCount: true,
      audioProbePrimingSamples: true,
    },
  );
  TestValidator.predicate(
    "audio-mix rejects a resident mono AAC track",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: productionAudioMp4(),
        }),
      "expected Opus",
    ),
  );
  const zeroAudioClock: Buffer = Buffer.from(audio);
  const audioMediaHeader: number = boxTypeOffset(zeroAudioClock, "mdhd");
  zeroAudioClock.writeUInt32BE(0, audioMediaHeader + 16);
  TestValidator.predicate(
    "an audio track requires positive timing metadata",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: zeroAudioClock,
        }),
      "lacks codec, duration",
    ),
  );
  TestValidator.predicate(
    "an audio mix cannot use a different declared media type",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "video/mp4",
          bytes: audio,
        }),
      "requires audio/mp4",
    ),
  );
  TestValidator.predicate(
    "audio-only MP4 cannot satisfy a feature track",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: audio,
        }),
      "0 video tracks",
    ),
  );
  TestValidator.predicate(
    "video-only MP4 cannot satisfy an audio mix",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: video,
        }),
      "video tracks; none are allowed",
    ),
  );
  const tracklessFile: ReturnType<typeof createFile> = createFile();
  tracklessFile.init({
    brands: ["isom", "iso2", "mp41"],
    timescale: 48_000,
    duration: 48_000,
  });
  const trackless: Uint8Array = new Uint8Array(tracklessFile.getBuffer().buffer);
  TestValidator.predicate(
    "an audio mix requires exactly one audio track",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: trackless,
        }),
      "0 audio tracks",
    ),
  );
}
