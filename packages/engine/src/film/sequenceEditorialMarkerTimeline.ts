import type {
  IAutoMoviePlaybackEditorialMarker,
  IAutoMoviePlaybackEntry,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Project authored shot markers through each play of an admitted sequence.
 *
 * A point survives exactly when its time lies in the half-open source trim.
 * A range survives when it has a positive intersection with the trim, and its
 * retained endpoints are mapped through the same start and rate as playback.
 * Output order is start time, entry index and then id by UTF-16 code units.
 * The prepared layout must come from this same admitted sequence and shot set.
 * At a hard cut between adjacent source spans of the same shot, the incoming
 * trim start supplies the shared seam when the explicitly trimmed outgoing
 * end differs by no more than floating-point roundoff. Membership then uses
 * exact comparisons and output endpoints stay within the played span.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reconciles a same-shot hard-cut seam at roundoff scale, tests exact half-open point membership and positive range intersection, then maps retained endpoints using entry offset, start and rate. Prepared entry starts already account for transitions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses preparePlaybackTimeline for placement and source lookup and owns only marker retention, projection and ordering.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Trim-edge touches do not become point markers. Replays keep distinct indices. Sorting uses code units and original endpoints remain unchanged.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the matching preparation premise, hard-cut seam convention, half-open rule, clipping and ordering.
 * @evidence contracts/development/implementation.md#efficient-algorithms After preparation, projection compares one next entry per play, visits each marker once per play, and sorts the retained plays by output placement.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the prepared playback clock and its shot index without a second layout or lookup table.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fresh marker placements escape. The layout and shot index remain caller-owned.
 */
export function sequenceEditorialMarkerTimeline(
  sequence: IAutoMovieSequence,
  { timeline, shotById }: IAutoMoviePreparePlaybackTimeline.IResult,
): IAutoMoviePlaybackEditorialMarker[] {
  const markers: IAutoMoviePlaybackEditorialMarker[] = [];

  for (const entry of timeline.entries) {
    const shot: IAutoMovieShot = shotById.get(entry.shot)!.shot;
    const sourceStart: number = entry.offset;
    const trim = sequence.shots[entry.entry]!.trim;
    const sourceDuration: number = trim?.duration ?? shot.duration;
    const trimEnd: number = sourceStart + sourceDuration;

    // Use one seam value only for adjacent same-shot hard cuts. Keeping
    // membership exact on either side preserves distinct nearby marker times.
    const next: IAutoMoviePlaybackEntry | undefined =
      timeline.entries[entry.entry + 1];
    const sourceEnd: number =
      trim !== null &&
      next !== undefined &&
      next.shot === entry.shot &&
      sequence.shots[next.entry]!.transition === null &&
      next.offset > sourceStart &&
      Math.abs(next.offset - trimEnd) <= Number.EPSILON * trimEnd
        ? next.offset
        : trimEnd;
    const rate: number = entry.playbackRate ?? 1;
    const outputEnd: number = entry.start + entry.played;
    for (const marker of shot.editorialMarkers ?? []) {
      const isPoint: boolean = marker.startSeconds === marker.endSeconds;
      const retainedStartSeconds: number = Math.max(
        marker.startSeconds,
        sourceStart,
      );
      const retainedEndSeconds: number = Math.min(marker.endSeconds, sourceEnd);
      if (
        isPoint
          ? marker.startSeconds < sourceStart ||
            marker.startSeconds >= sourceEnd
          : retainedStartSeconds >= retainedEndSeconds
      )
        continue;

      markers.push({
        id: marker.id,
        label: marker.label,
        startSeconds: marker.startSeconds,
        endSeconds: marker.endSeconds,
        entry: entry.entry,
        shot: entry.shot,
        retainedStartSeconds,
        retainedEndSeconds,
        outputStartSeconds: Math.min(
          outputEnd,
          entry.start + (retainedStartSeconds - sourceStart) / rate,
        ),
        outputEndSeconds:
          retainedEndSeconds === sourceEnd
            ? outputEnd
            : Math.min(
                outputEnd,
                entry.start + (retainedEndSeconds - sourceStart) / rate,
              ),
      });
    }
  }

  return markers.sort(
    (
      a: IAutoMoviePlaybackEditorialMarker,
      b: IAutoMoviePlaybackEditorialMarker,
    ): number =>
      a.outputStartSeconds - b.outputStartSeconds ||
      a.entry - b.entry ||
      compareCodeUnits(a.id, b.id),
  );
}
