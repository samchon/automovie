import type {
  IAutoMoviePlaybackEditorialMarker,
  IAutoMoviePlaybackEntry,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";

import { compareCodeUnits } from "../text/compareCodeUnits";

/**
 * Project authored shot markers through each play of an admitted sequence.
 *
 * A point survives when its time lies in the half-open source trim. The
 * opening point also survives if rounding collapses the numeric source end
 * onto the start of a positive played span.
 * A range survives when it has a positive intersection with the trim, and its
 * retained endpoints are mapped through the same start and rate as playback.
 * A range covering a collapsed span's opening instant plays across the whole
 * span, with both retained source endpoints at the opening instant.
 * Output order is start time, entry index and then id by UTF-16 code units.
 * The prepared layout must come from this same admitted sequence and shot set.
 * A preserved symbolic end defines the source boundary. For numeric trims,
 * the incoming trim start supplies a same-shot hard-cut seam when the two
 * bounds differ by no more than floating-point roundoff. Membership uses
 * exact comparisons and output endpoints stay within the played span.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reconciles a same-shot hard-cut seam at roundoff scale and tests half-open membership exactly. On collapsed source spans, the opening point stays at output start and ranges covering the span extend to output end. Prepared entry starts already account for transitions.
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
    const source: IAutoMovieSequenceEntry = sequence.shots[entry.entry]!;
    const sourceDuration: number = source.trim?.duration ?? shot.duration;
    const trimEnd: number = sourceStart + sourceDuration;

    // A rounded-down zero-width source interval still has an authored
    // duration. Keep that boundary separate from the next cut's source start.
    const next: IAutoMoviePlaybackEntry | undefined =
      timeline.entries[entry.entry + 1];
    const sourceEnd: number =
      source.exactSourceEnd ??
      (source.trim !== null &&
      trimEnd > sourceStart &&
      next !== undefined &&
      next.shot === entry.shot &&
      sequence.shots[next.entry]!.transition === null &&
      next.offset > sourceStart &&
      Math.abs(next.offset - trimEnd) <= Number.EPSILON * trimEnd
        ? next.offset
        : trimEnd);
    const rate: number = entry.playbackRate ?? 1;
    const outputEnd: number = entry.start + entry.played;
    const collapsed: boolean = sourceEnd === sourceStart;
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
            (marker.startSeconds !== sourceStart &&
              marker.startSeconds >= sourceEnd)
          : collapsed
            ? marker.startSeconds > sourceStart ||
              marker.endSeconds <= sourceStart
            : retainedStartSeconds >= retainedEndSeconds
      )
        continue;

      const outputStartSeconds: number = Math.min(
        outputEnd,
        entry.start + (retainedStartSeconds - sourceStart) / rate,
      );
      markers.push({
        id: marker.id,
        label: marker.label,
        startSeconds: marker.startSeconds,
        endSeconds: marker.endSeconds,
        entry: entry.entry,
        shot: entry.shot,
        retainedStartSeconds,
        retainedEndSeconds,
        outputStartSeconds,
        outputEndSeconds: isPoint
          ? outputStartSeconds
          : retainedEndSeconds === sourceEnd
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
