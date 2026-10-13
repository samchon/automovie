import type { Sample, Track } from "mp4box";

import { parseMp4 } from "./parseMp4";
import { sameSampleDescription } from "./sameSampleDescription";
import { sameSampleFlags } from "./sameSampleFlags";
import { sampleDescription } from "./sampleDescription";

/**
 * Prove that a feature's first video track carries exactly the samples of a
 * rendition video's first video track.
 *
 * Both tracks must agree on media and movie timescale and duration, display
 * matrix, edit list, coded raster and track display size, and must hold the
 * same non-zero number of samples whose first decoder configurations match.
 * Each sample pair must agree on duration,
 * decode and presentation time, dependency and redundancy flags, decoder
 * configuration, and payload bytes. Other tracks, such as the feature's
 * audio, are ignored.
 *
 * Throws `Rendition delivery proof requires one feature video track.` when
 * either file has no video track, `Feature video track does not match the
 * selected rendition track.` for a track-level difference, and `Feature video
 * sample <i> differs from the selected rendition.` for the first differing
 * sample.
 *
 * No production module calls this function at present; only tests reach it.
 *
 * @evidence contracts/common.md#principled-implementation Equality is decided on the parser's sample tables and the exact payload byte ranges, so two containers that store the same coded pictures at the same times pass even when their box layout differs, and nothing is decoded.
 * @evidence contracts/common.md#clear-and-simple-design Flag and decoder-configuration equality reuse `sameSampleFlags` and `sameSampleDescription`, and the two small track and timing comparisons are local because no other module compares whole tracks. The gap is that no production consumer remains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tick, flag or byte tolerance is applied, and neither input is treated specially by name or size.
 * @evidence contracts/common.md#meaningful-documentation The doc lists every track-level and per-sample equality, which tracks are compared and which ignored, and each refusal message.
 * @evidence contracts/performance.md#efficient-algorithms For S samples both files are parsed once and each sample pair costs one native byte comparison and constant field checks; decoder configurations are serialized only when either sample's description object changes, normally once, so time is linear in the compared bytes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A proof compares two caller-held byte arrays once and offers no result another call could share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Both parsed files and their sample tables are released on return, and the function opens no handle or task.
 */
export const assertProductionFeatureUsesRenditionVideo = (props: {
  /** Feature MP4 whose first video track is checked. */
  feature: Uint8Array;

  /** Rendition MP4 whose first video track is the expectation. */
  renditionVideo: Uint8Array;
}): void => {
  const actual: ReturnType<typeof parseMp4> = parseMp4(props.feature);
  const expected: ReturnType<typeof parseMp4> = parseMp4(props.renditionVideo);
  const actualTrack: Track | undefined = actual.movie.videoTracks[0];
  const expectedTrack: Track | undefined = expected.movie.videoTracks[0];
  if (actualTrack === undefined || expectedTrack === undefined)
    throw new Error(
      "Rendition delivery proof requires one feature video track.",
    );
  const actualSamples: Sample[] = actual.file.getTrackSamplesInfo(
    actualTrack.id,
  );
  const expectedSamples: Sample[] = expected.file.getTrackSamplesInfo(
    expectedTrack.id,
  );
  if (
    actualTrack.timescale !== expectedTrack.timescale ||
    actualTrack.duration !== expectedTrack.duration ||
    actualTrack.movie_timescale !== expectedTrack.movie_timescale ||
    actualTrack.movie_duration !== expectedTrack.movie_duration ||
    sameTrackPresentation(actualTrack, expectedTrack) === false ||
    actualTrack.video?.width !== expectedTrack.video?.width ||
    actualTrack.video?.height !== expectedTrack.video?.height ||
    actualTrack.track_width !== expectedTrack.track_width ||
    actualTrack.track_height !== expectedTrack.track_height ||
    actualSamples.length !== expectedSamples.length ||
    actualSamples.length === 0 ||
    sameSampleDescription(
      sampleDescription(actualSamples[0]!),
      sampleDescription(expectedSamples[0]!),
    ) === false
  )
    throw new Error(
      "Feature video track does not match the selected rendition track.",
    );
  let checkedLeft: unknown = actualSamples[0]!.description;
  let checkedRight: unknown = expectedSamples[0]!.description;
  for (let index: number = 0; index < actualSamples.length; ++index) {
    const left: Sample = actualSamples[index]!;
    const right: Sample = expectedSamples[index]!;
    if (
      sameSampleTiming(left, right) === false ||
      ((left.description !== checkedLeft ||
        right.description !== checkedRight) &&
        sameSampleDescription(
          sampleDescription(left),
          sampleDescription(right),
        ) === false) ||
      Buffer.compare(
        props.feature.subarray(left.offset, left.offset + left.size),
        props.renditionVideo.subarray(right.offset, right.offset + right.size),
      ) !== 0
    )
      throw new Error(
        `Feature video sample ${index} differs from the selected rendition.`,
      );
    checkedLeft = left.description;
    checkedRight = right.description;
  }
};

/** Whether two tracks share the display matrix and the edit list. */
const sameTrackPresentation = (left: Track, right: Track): boolean => {
  const rightMatrix: number[] = Array.from(right.matrix);
  return (
    Array.from(left.matrix).every(
      (value: number, index: number): boolean => value === rightMatrix[index],
    ) && JSON.stringify(left.edits ?? []) === JSON.stringify(right.edits ?? [])
  );
};

/** Whether two samples share duration, both clock times and every flag. */
const sameSampleTiming = (left: Sample, right: Sample): boolean =>
  left.duration === right.duration &&
  left.cts === right.cts &&
  left.dts === right.dts &&
  sameSampleFlags(left, right);
