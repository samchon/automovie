import { namedFacts, nclose, throwsError as refused } from "../internal/predicates";
import { probeProductionMedia } from "@automovie/production";
import {
  muxProductionFeatureMp4,
  probeProductionVideoMp4,
} from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionOpusMp4 } from "../internal/productionMedia/productionOpusMp4";

/**
 * Native MP4 parsing reads authored sample clocks and exact feature track composition, independently of video encoder startup. It establishes container transport, not decoded AVC pixels.
 *
 * Scenarios:
 *
 * 1. Read the four-frame 24 Hz video and mux exactly 8000 audio samples.
 * 2. Refuse wrong track populations, a one-sample runtime difference and mono final audio.
 *
 * @evidence contracts/testing.md#behavioral-verification Probes a four-frame guide, muxes/probes a matching H.264+Opus feature and requires wrong track populations, a one-audio-sample mismatch and mono audio to refuse at their own messages. Checked projections identify container/codec/raster/frame timing and Opus association rather than decoded picture or sound quality.
 * @evidence contracts/testing.md#independent-expectations Authored four frames at 24 Hz give 4/24 seconds, matching 8000 samples at 48000 Hz; 7999 differs by one sample and mono violates the stereo delivery profile. Literal 16-square raster, four frames and H.264/Opus identities supply expectations independently of probe output; fps keeps zero-tolerance nclose and runtime the existing 1e-9 numerical bound.
 * @evidence contracts/testing.md#distinguishing-cases Retains valid video-only intermediate and matching final feature, final-video missing audio, intermediate extra-audio and audio-only inputs, one-sample duration mismatch and one-channel audio. Malformed box storage, color/presentation profile and cue semantics belong to adjacent media tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_video_track_probe owns all portable synchronous container/mux cases through resident authored samples. MP4Box writing and probing launch no codec/renderer process, read/write no filesystem path and establish no decoded AVC pixels or audible Opus acceptance.
 */
export function test_production_video_track_probe(): void {
  const video: Uint8Array = productionSampleMp4({
    width: 16,
    height: 16,
    fps: 24,
    frameCount: 4,
  });
  const videoProbe: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
    kind: "guide-pass",
    mediaType: "video/mp4",
    bytes: video,
  });
  TestValidator.equals(
    "the guide probe derives H.264 geometry and frame timing",
    namedFacts([
      ["videoProbeKindVideo", (): boolean => videoProbe.kind === "video"],
      [
        "videoProbeContainerMp4",
        (): boolean => videoProbe.kind === "video" && videoProbe.container === "mp4",
      ],
      [
        "videoProbeCodecH264",
        (): boolean => videoProbe.kind === "video" && videoProbe.codec === "h264",
      ],
      [
        "videoProbeWidth",
        (): boolean => videoProbe.kind === "video" && videoProbe.width === 16,
      ],
      [
        "videoProbeHeight",
        (): boolean => videoProbe.kind === "video" && videoProbe.height === 16,
      ],
      [
        "videoProbeFrameCount",
        (): boolean => videoProbe.kind === "video" && videoProbe.frameCount === 4,
      ],
      [
        "videoProbeFps",
        (): boolean => videoProbe.kind === "video" && nclose(videoProbe.fps, 24, 0),
      ],
      [
        "MathAbsVideoProbe",
        (): boolean =>
          videoProbe.kind === "video" &&
          nclose(videoProbe.runtimeSeconds, 4 / 24, 1e-9),
      ],
    ]),
    {
      videoProbeKindVideo: true,
      videoProbeContainerMp4: true,
      videoProbeCodecH264: true,
      videoProbeWidth: true,
      videoProbeHeight: true,
      videoProbeFrameCount: true,
      videoProbeFps: true,
      MathAbsVideoProbe: true,
    },
  );
  const featureBytes: Uint8Array = muxProductionFeatureMp4({
    video,
    audio: productionOpusMp4(8_000),
  });
  const feature: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
    kind: "feature",
    mediaType: "video/mp4",
    bytes: featureBytes,
  });
  TestValidator.equals(
    "a feature requires and preserves exact-runtime H.264 plus stereo Opus",
    namedFacts([
      ["featureKindFeature", (): boolean => feature.kind === "feature"],
      [
        "featureFrameCount",
        (): boolean => feature.kind === "feature" && feature.video.frameCount === 4,
      ],
      [
        "featureFps",
        (): boolean => feature.kind === "feature" && nclose(feature.video.fps, 24, 0),
      ],
      [
        "MathAbsFeature",
        (): boolean =>
          feature.kind === "feature" &&
          nclose(feature.video.runtimeSeconds, 4 / 24, 1e-9),
      ],
      [
        "featureAudioOpus",
        (): boolean => feature.kind === "feature" && feature.audio.codec === "opus",
      ],
    ]),
    {
      featureKindFeature: true,
      featureFrameCount: true,
      featureFps: true,
      MathAbsFeature: true,
      featureAudioOpus: true,
    },
  );
  TestValidator.predicate(
    "video-only MP4 cannot satisfy the final feature contract",
    refused(
      (): ReturnType<typeof probeProductionMedia> =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: video,
        }),
      "exactly 2",
    ),
  );
  TestValidator.equals(
    "the intermediate production-video probe accepts only H.264-only MP4",
    namedFacts([
      [
        "probeProductionVideoMp4VideoFrameCount",
        (): boolean => probeProductionVideoMp4(video).frameCount === 4,
      ],
      [
        "refusedProbeProductionVideoMp4FeatureBytes",
        (): boolean =>
          refused((): ReturnType<typeof probeProductionVideoMp4> => probeProductionVideoMp4(featureBytes), "exactly one"),
      ],
      [
        "refusedProbeProductionVideoMp4ProductionOpusMp4",
        (): boolean =>
          refused(
            (): ReturnType<typeof probeProductionVideoMp4> => probeProductionVideoMp4(productionOpusMp4(8_000)),
            "0 video tracks",
          ),
      ],
    ]),
    {
      probeProductionVideoMp4VideoFrameCount: true,
      refusedProbeProductionVideoMp4FeatureBytes: true,
      refusedProbeProductionVideoMp4ProductionOpusMp4: true,
    },
  );
  TestValidator.predicate(
    "feature mux refuses unequal track clocks",
    refused(
      (): Uint8Array =>
        muxProductionFeatureMp4({
          video,
          audio: productionOpusMp4(7_999),
        }),
      "exactly equal",
    ),
  );
  TestValidator.predicate(
    "feature mux refuses a non-48-kHz-stereo final audio track",
    refused(
      (): Uint8Array =>
        muxProductionFeatureMp4({
          video,
          audio: productionOpusMp4(8_000, 1),
        }),
      "unsupported-audio-profile.channels",
    ),
  );

}
