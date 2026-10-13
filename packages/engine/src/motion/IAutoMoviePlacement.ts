import { IAutoMovieMotion } from "@automovie/interface";

/**
 * A motion clip placed at a start time on an actor's shot timeline.
 * arrangeMotion shifts clip-local keyframes by start and holds the most
 * recently ended clip through gaps; overlap follows that operation's policy.
 *
 * @evidence contracts/common.md#principled-implementation A start offset plus a local-time motion is sufficient to place authored keyframes on the shot clock without rewriting or duplicating the clip's duration.
 * @evidence contracts/common.md#clear-and-simple-design The schedule entry carries only timing and the borrowed motion; arrangeMotion owns ordering, gap holds and combined output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot placement uses explicit seconds, not a clip-name or actor-specific timing convention.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes shot-clock start from clip-local time and points consumers to the arranger's gap and overlap policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A timeline entry performs no scheduling search or keyframe copying itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The entry references an existing clip without promising result reuse across differently timed placements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its containing schedule retains one motion reference per placement; the descriptor acquires no independent task or playback resource.
 *
 * @author Samchon
 */
export interface IAutoMoviePlacement {
  /** Seconds into the shot this clip begins. */
  start: number;

  /** The clip (its own local time starts at 0). */
  motion: IAutoMovieMotion;
}
