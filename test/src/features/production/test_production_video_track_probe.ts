import { namedFacts, throwsError as refused } from "../internal/predicates";
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
 */
export const test_production_video_track_probe = (): void => {
  const video = productionSampleMp4({
    width: 16,
    height: 16,
    fps: 24,
    frameCount: 4,
  });
  const videoProbe = probeProductionMedia({
    kind: "guide-pass",
    mediaType: "video/mp4",
    bytes: video,
  });
  TestValidator.equals(
    "the guide probe derives H.264 geometry and frame timing",
    namedFacts([
      ["videoProbeKindVideo", () => videoProbe.kind === "video"],
      [
        "videoProbeContainerMp4",
        () => videoProbe.kind === "video" && videoProbe.container === "mp4",
      ],
      [
        "videoProbeCodecH264",
        () => videoProbe.kind === "video" && videoProbe.codec === "h264",
      ],
      [
        "videoProbeWidth",
        () => videoProbe.kind === "video" && videoProbe.width === 16,
      ],
      [
        "videoProbeHeight",
        () => videoProbe.kind === "video" && videoProbe.height === 16,
      ],
      [
        "videoProbeFrameCount",
        () => videoProbe.kind === "video" && videoProbe.frameCount === 4,
      ],
      [
        "videoProbeFps",
        () => videoProbe.kind === "video" && videoProbe.fps === 24,
      ],
      [
        "MathAbsVideoProbe",
        () =>
          videoProbe.kind === "video" &&
          Math.abs(videoProbe.runtimeSeconds - 4 / 24) < 1e-9,
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
  const featureBytes = muxProductionFeatureMp4({
    video,
    audio: productionOpusMp4(8_000),
  });
  const feature = probeProductionMedia({
    kind: "feature",
    mediaType: "video/mp4",
    bytes: featureBytes,
  });
  TestValidator.equals(
    "a feature requires and preserves exact-runtime H.264 plus stereo Opus",
    namedFacts([
      ["featureKindFeature", () => feature.kind === "feature"],
      [
        "featureFrameCount",
        () => feature.kind === "feature" && feature.video.frameCount === 4,
      ],
      [
        "featureFps",
        () => feature.kind === "feature" && feature.video.fps === 24,
      ],
      [
        "MathAbsFeature",
        () =>
          feature.kind === "feature" &&
          Math.abs(feature.video.runtimeSeconds - 4 / 24) < 1e-9,
      ],
      [
        "featureAudioOpus",
        () => feature.kind === "feature" && feature.audio.codec === "opus",
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
      () =>
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
        () => probeProductionVideoMp4(video).frameCount === 4,
      ],
      [
        "refusedProbeProductionVideoMp4FeatureBytes",
        () =>
          refused(() => probeProductionVideoMp4(featureBytes), "exactly one"),
      ],
      [
        "refusedProbeProductionVideoMp4ProductionOpusMp4",
        () =>
          refused(
            () => probeProductionVideoMp4(productionOpusMp4(8_000)),
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
      () =>
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
      () =>
        muxProductionFeatureMp4({
          video,
          audio: productionOpusMp4(8_000, 1),
        }),
      "unsupported-audio-profile.channels",
    ),
  );

};
