import { throwsError as refused } from "../internal/predicates";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { productionSampleMp4 } from "../internal/productionMedia/productionSampleMp4";
import { productionInterframeH264Mp4 } from "../internal/productionMedia/productionInterframeH264Mp4";
import { productionMpeg4Part2Mp4 } from "../internal/productionMedia/productionMpeg4Part2Mp4";

const boxTypeOffset = (bytes: Uint8Array, type: string): number => {
  const offset = Buffer.from(bytes).indexOf(type);
  if (offset < 0) throw new Error(`MP4 fixture has no ${type} box.`);
  return offset;
};

/**
 * Delivered video must parse as a complete native ISO container with sample tables backed by resident media-data bytes. Sample payload transport does not assert decoder quality.
 *
 * Scenarios:
 *
 * 1. Admit a correctly declared guide and refuse wrong media type, absent or malformed movie/container metadata.
 * 2. Refuse escaped storage, zero clock/duration, missing sync samples and absent media-data backing.
 * 3. Reject a real adjacent MPEG-4 Part 2 input at the AVC boundary.
 */
export const test_production_video_container_probe = (): void => {
  const video = productionSampleMp4({width:16,height:16,fps:24,frameCount:4});
  TestValidator.predicate(
    "guide passes use the same decoded video contract",
    probeProductionMedia({
      kind: "guide-pass",
      mediaType: "video/mp4",
      bytes: video,
    }).kind === "video",
  );
  TestValidator.predicate(
    "encoded video cannot use a different declared media type",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "application/octet-stream",
          bytes: video,
        }),
      "require video/mp4",
    ),
  );
  TestValidator.predicate(
    "an MP4 claim cannot be shorter than a container header",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: video.subarray(0, 12),
        }),
      "too short",
    ),
  );
  const ftypSize = Buffer.from(video).readUInt32BE(0);
  TestValidator.predicate(
    "an ISO brand without movie metadata is not a video",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: video.subarray(0, ftypSize),
        }),
      "movie metadata",
    ),
  );
  const parserReportedContainer = Buffer.from(video);
  parserReportedContainer[ftypSize + 4] = 0;
  TestValidator.predicate(
    "an invalid inner box type is surfaced through the parser error callback",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: parserReportedContainer,
        }),
      "MP4 parser rejected output",
    ),
  );
  const unsupportedItemLocation = Buffer.alloc(12);
  unsupportedItemLocation.writeUInt32BE(12, 0);
  unsupportedItemLocation.write("iloc", 4, 4, "ascii");
  unsupportedItemLocation[8] = 3;
  TestValidator.predicate(
    "a malformed full box surfaced as a synchronous parser exception is normalized",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: Buffer.concat([
            video.subarray(0, ftypSize),
            unsupportedItemLocation,
          ]),
        }),
      "MP4 parser rejected output: RangeError",
    ),
  );
  TestValidator.predicate(
    "movie metadata without an ISO base-media brand is refused",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: video.subarray(ftypSize),
        }),
      "compatible brand",
    ),
  );
  TestValidator.predicate(
    "random bytes cannot masquerade as an MP4 container",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: new Uint8Array(32),
        }),
      "MP4",
    ),
  );
  const malformedContainer = Buffer.from(video);
  const moovType = boxTypeOffset(malformedContainer, "moov");
  malformedContainer.writeUInt32BE(0x7fffffff, moovType - 4);
  TestValidator.predicate(
    "a structurally malformed box cannot escape parser errors",
    refused(
      () =>
        probeProductionMedia({
          kind: "feature",
          mediaType: "video/mp4",
          bytes: malformedContainer,
        }),
      "MP4",
    ),
  );
  // The normalized fixture is fragmented: its movie-level sample tables are
  // empty and every sample offset comes from the fragment run, so the escape
  // is staged on the run's data offset rather than on an empty `stco`.
  const escapedSamples = Buffer.from(video);
  const trackRunBox = escapedSamples.indexOf("trun");
  if (trackRunBox < 0)
    throw new Error("H.264 fixture has no trun sample-offset table to mutate.");
  if ((escapedSamples.readUInt32BE(trackRunBox + 4) & 0x1) === 0)
    throw new Error("H.264 fixture trun carries no data offset to mutate.");
  escapedSamples.writeInt32BE(0x7fffffff, trackRunBox + 12);
  TestValidator.predicate(
    "a sample table cannot point outside resident container bytes",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: escapedSamples,
        }),
      "resident bytes",
    ),
  );
  const zeroVideoClock = Buffer.from(video);
  const videoMediaHeader = boxTypeOffset(zeroVideoClock, "mdhd");
  zeroVideoClock.writeUInt32BE(0, videoMediaHeader + 16);
  TestValidator.predicate(
    "a video track requires a positive media clock",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: zeroVideoClock,
        }),
      "positive dimensions",
    ),
  );
  // Fragmented samples carry their durations in the track run, so the zero
  // duration is staged on the run's first sample rather than on the empty
  // movie-level time-to-sample table.
  const zeroSampleDuration = Buffer.from(video);
  const trackRun = boxTypeOffset(zeroSampleDuration, "trun");
  if ((zeroSampleDuration.readUInt32BE(trackRun + 4) & 0x100) === 0)
    throw new Error("H.264 fixture trun carries no per-sample durations.");
  zeroSampleDuration.writeUInt32BE(0, trackRun + 16);
  TestValidator.predicate(
    "video frames require a positive constant sample duration",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: zeroSampleDuration,
        }),
      "constant deterministic frame duration",
    ),
  );
  // Fragmented samples carry their sync flag per sample in each track run
  // (bit 16 set means "not a sync sample"), so every run's sample flags are
  // rewritten rather than an empty movie-level sync table.
  const noSyncSample = Buffer.from(productionInterframeH264Mp4());
  let trackRunCursor = noSyncSample.indexOf("trun");
  if (trackRunCursor < 0)
    throw new Error("H.264 fixture has no trun sample table to mutate.");
  while (trackRunCursor >= 0) {
    const flags = noSyncSample.readUInt32BE(trackRunCursor + 4) & 0xffffff;
    if ((flags & 0x400) === 0)
      throw new Error("H.264 fixture trun carries no per-sample flags.");
    const sampleCount = noSyncSample.readUInt32BE(trackRunCursor + 8);
    const entryStart =
      trackRunCursor +
      12 +
      ((flags & 0x1) !== 0 ? 4 : 0) +
      ((flags & 0x4) !== 0 ? 4 : 0);
    const entrySize =
      ((flags & 0x100) !== 0 ? 4 : 0) +
      ((flags & 0x200) !== 0 ? 4 : 0) +
      4 +
      ((flags & 0x800) !== 0 ? 4 : 0);
    const flagOffset =
      ((flags & 0x100) !== 0 ? 4 : 0) + ((flags & 0x200) !== 0 ? 4 : 0);
    for (let index = 0; index < sampleCount; ++index)
      noSyncSample.writeUInt32BE(
        0x01010000,
        entryStart + index * entrySize + flagOffset,
      );
    trackRunCursor = noSyncSample.indexOf("trun", trackRunCursor + 4);
  }
  TestValidator.predicate(
    "a deterministic video requires at least one sync sample",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: noSyncSample,
        }),
      "no independently decodable sync sample",
    ),
  );
  const unbackedSamples = Buffer.from(video);
  unbackedSamples.write(
    "free",
    boxTypeOffset(unbackedSamples, "mdat"),
    4,
    "ascii",
  );
  TestValidator.predicate(
    "sample tables require parsed media-data boxes",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: unbackedSamples,
        }),
      "media-data boxes",
    ),
  );
  TestValidator.predicate(
    "a non-AVC sample entry is refused even inside MP4",
    refused(
      () =>
        probeProductionMedia({
          kind: "guide-pass",
          mediaType: "video/mp4",
          bytes: productionMpeg4Part2Mp4(),
        }),
      "not an H.264",
    ),
  );


};
