import { namedFacts, throwsError as refused } from "../internal/predicates";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { createFile } from "mp4box";
import { productionAudioMp4 } from "../internal/productionMedia/productionAudioMp4";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionOpusMp4 } from "../internal/productionMedia/productionOpusMp4";

const boxTypeOffset = (bytes: Uint8Array, type: string): number => {
  const offset = Buffer.from(bytes).indexOf(type);
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
 */
export const test_production_audio_track_probe = (): void => {
  const video = productionSampleMp4({width:16,height:16,fps:24,frameCount:4});
  const audio = productionOpusMp4(48_000);
  const audioProbe = probeProductionMedia({
    kind: "audio-mix",
    mediaType: "audio/mp4",
    bytes: audio,
  });
  TestValidator.equals(
    "the audio probe derives presentation clock, profile, packets and priming",
    namedFacts([
      ["audioProbeKindAudio", () => audioProbe.kind === "audio"],
      [
        "audioProbeContainerMp4",
        () => audioProbe.kind === "audio" && audioProbe.container === "mp4",
      ],
      [
        "audioProbeCodecToLowerCase",
        () =>
          audioProbe.kind === "audio" &&
          audioProbe.codec.toLowerCase().startsWith("opus"),
      ],
      [
        "audioProbeRuntimeSeconds",
        () => audioProbe.kind === "audio" && audioProbe.runtimeSeconds === 1,
      ],
      [
        "audioProbeChannels",
        () => audioProbe.kind === "audio" && audioProbe.channels === 2,
      ],
      [
        "audioProbeSampleRate000",
        () => audioProbe.kind === "audio" && audioProbe.sampleRate === 48_000,
      ],
      [
        "audioProbeSampleCount",
        () => audioProbe.kind === "audio" && audioProbe.sampleCount > 0,
      ],
      [
        "audioProbePrimingSamples",
        () => audioProbe.kind === "audio" && audioProbe.primingSamples === 312,
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
      () =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: productionAudioMp4(),
        }),
      "expected Opus",
    ),
  );
  const zeroAudioClock = Buffer.from(audio);
  const audioMediaHeader = boxTypeOffset(zeroAudioClock, "mdhd");
  zeroAudioClock.writeUInt32BE(0, audioMediaHeader + 16);
  TestValidator.predicate(
    "an audio track requires positive timing metadata",
    refused(
      () =>
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
      () =>
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
      () =>
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
      () =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: video,
        }),
      "video tracks; none are allowed",
    ),
  );
  const tracklessFile = createFile();
  tracklessFile.init({
    brands: ["isom", "iso2", "mp41"],
    timescale: 48_000,
    duration: 48_000,
  });
  const trackless = new Uint8Array(tracklessFile.getBuffer().buffer);
  TestValidator.predicate(
    "an audio mix requires exactly one audio track",
    refused(
      () =>
        probeProductionMedia({
          kind: "audio-mix",
          mediaType: "audio/mp4",
          bytes: trackless,
        }),
      "0 audio tracks",
    ),
  );
};
