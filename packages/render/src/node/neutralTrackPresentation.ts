import type { Entry, Track } from "mp4box";

import { AUTOMOVIE_MP4_UNITY_MATRIX } from "./AUTOMOVIE_MP4_UNITY_MATRIX";
import { equalRational } from "./equalRational";

/**
 * Whether `track` presents its media untransformed, starting at the media
 * time `presentationStart`.
 *
 * The track must carry the ISO unity display matrix, and its movie duration
 * over the movie timescale must equal its media duration over the media
 * timescale exactly. Its edit list must be either empty, with
 * `presentationStart` 0, or one edit that starts at `presentationStart` in
 * media ticks, plays at rate 1, and lasts the media duration on the movie
 * clock. Those are the only presentations a lossless splice may join; anything
 * else would change reviewed pixels or reviewed timing. A clock term that is
 * not a safe integer, or a timescale that is not positive, answers false.
 *
 * @evidence contracts/common.md#principled-implementation ISO/IEC 14496-12 presents a track through its matrix and edit list, so a unity matrix and at most one rate-1 edit spanning the whole media from the first presented sample leave the media timeline unchanged; durations on different clocks are compared by exact cross-multiplication through `equalRational`, which also refuses unsafe terms and non-positive timescales.
 * @evidence contracts/common.md#clear-and-simple-design The clip parser and the feature-uses-clips proof ask the same question of a clip and of a delivered feature, and the matrix is read from `AUTOMOVIE_MP4_UNITY_MATRIX`, which the delivery profile also reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance is applied to any duration or edit field, and an empty edit, a second edit or a non-unit rate answers false rather than being interpreted.
 * @evidence contracts/common.md#meaningful-documentation The doc states every condition, the unit of `presentationStart`, why only these presentations are admissible, and which invalid clocks answer false.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The check reads nine matrix terms and at most one edit, so no algorithm or data structure is chosen.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call judges one track once, cheaper than any cached verdict.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains no reference to the track and opens nothing.
 */
export const neutralTrackPresentation = (
  track: Track,
  presentationStart: number,
): boolean => {
  if (
    Array.from(track.matrix).some(
      (value: number, index: number): boolean =>
        value !== AUTOMOVIE_MP4_UNITY_MATRIX[index],
    ) ||
    equalRational(
      track.movie_duration,
      track.movie_timescale,
      track.duration,
      track.timescale,
    ) === false
  )
    return false;
  const edits: Entry[] = track.edits ?? [];
  const edit: Entry | undefined = edits[0];
  if (edit === undefined) return presentationStart === 0;
  return (
    edits.length === 1 &&
    edit.media_time === presentationStart &&
    edit.media_rate_integer === 1 &&
    edit.media_rate_fraction === 0 &&
    equalRational(
      edit.segment_duration,
      track.movie_timescale,
      track.duration,
      track.timescale,
    )
  );
};
