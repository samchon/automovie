import { sequenceEventTimeline } from "@automovie/engine";
import type {
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackEvent,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { isDeepStrictEqual } from "node:util";

/**
 * Refuse a branch that changes the original editorial view through the Human join.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the boundary whose placement and cues must remain fixed.
 * @evidence contracts/development/implementation.md#principled-implementation Compares the admitted affine placement, visible bounds, prior shots and projected event ownership on the original output clock. A matching snapshot alone cannot admit an edit that changes a prior rate, trim, transition or event.
 * @evidence contracts/development/implementation.md#efficient-algorithms Uses the prepared layouts from anchor resolution to locate the join and compare the visible placements. Projects each full edit with the engine event reader, which builds its own playback layout, then compares only cues through the join. The input layouts and temporary event lists stay local to the check.
 */
export function verifyMotionTakeEditPrefix(
  original: {
    sequence: IAutoMovieSequence;
    prepared: IAutoMoviePreparePlaybackTimeline.IResult;
    shots: readonly IAutoMovieShot[];
  },
  branch: {
    sequence: IAutoMovieSequence;
    prepared: IAutoMoviePreparePlaybackTimeline.IResult;
    shots: readonly IAutoMovieShot[];
  },
  selected: number,
  sourceJoin: number,
): void {
  const selectedEntry: IAutoMoviePlaybackEntry =
    original.prepared.timeline.entries[selected]!;
  const selectedShot: IAutoMovieShot = original.prepared.shotById.get(
    selectedEntry.shot,
  )!.shot;
  const alternateShot: IAutoMovieShot = branch.prepared.shotById.get(
    selectedEntry.shot,
  )!.shot;
  if (
    selectedShot.scene !== alternateShot.scene ||
    selectedShot.camera !== alternateShot.camera ||
    !isDeepStrictEqual(selectedShot.cameraMotion, alternateShot.cameraMotion) ||
    !isDeepStrictEqual(
      selectedShot.objectMotions,
      alternateShot.objectMotions,
    ) ||
    !isDeepStrictEqual(selectedShot.lightMotions, alternateShot.lightMotions)
  )
    throw new Error(
      `take-anchor: branch changes shot staging or camera ${selectedEntry.shot}`,
    );

  let seam: number = original.prepared.timeline.runtime;
  for (const entry of original.prepared.timeline.entries.slice(selected)) {
    if (entry.shot !== selectedEntry.shot) continue;
    const placement: IAutoMovieSequence["shots"][number] =
      original.sequence.shots[entry.entry]!;
    const end: number =
      placement.exactSourceEnd ??
      (placement.trim
        ? placement.trim.start + placement.trim.duration
        : selectedShot.duration);
    if (sourceJoin > end) continue;
    seam =
      entry.start +
      Math.max(0, (sourceJoin - entry.offset) / (entry.playbackRate ?? 1));
    break;
  }
  if (original.sequence.fps !== branch.sequence.fps)
    throw new Error("take-anchor: branch changes the edit frame rate");

  const before: IAutoMoviePlaybackEntry[] =
    original.prepared.timeline.entries.filter(
      (entry): boolean => entry.start <= seam,
    );
  const after: IAutoMoviePlaybackEntry[] =
    branch.prepared.timeline.entries.filter(
      (entry): boolean => entry.start <= seam,
    );
  if (before.length !== after.length)
    throw new Error("take-anchor: branch changes the edit prefix entries");
  for (const [index, entry] of before.entries()) {
    const candidate: IAutoMoviePlaybackEntry = after[index]!;
    if (
      entry.shot !== candidate.shot ||
      entry.start !== candidate.start ||
      entry.offset !== candidate.offset ||
      entry.playbackRate !== candidate.playbackRate ||
      Math.min(entry.start + entry.played, seam) !==
        Math.min(candidate.start + candidate.played, seam) ||
      !isDeepStrictEqual(
        original.sequence.shots[index]?.transition,
        branch.sequence.shots[index]?.transition,
      )
    )
      throw new Error(`take-anchor: branch changes edit prefix entry ${index}`);
    if (
      entry.shot !== selectedEntry.shot &&
      !isDeepStrictEqual(
        original.prepared.shotById.get(entry.shot)?.shot,
        branch.prepared.shotById.get(entry.shot)?.shot,
      )
    )
      throw new Error(`take-anchor: branch changes prior shot ${entry.shot}`);
  }

  /** Project the event plays that the audience has reached at the join. */
  const events = (cut: typeof original): IAutoMoviePlaybackEvent[] =>
    sequenceEventTimeline(cut.sequence, [...cut.shots]).filter(
      (event: IAutoMoviePlaybackEvent): boolean => event.globalTime <= seam,
    );
  if (!isDeepStrictEqual(events(original), events(branch)))
    throw new Error(
      "take-anchor: branch changes event ownership through the edit prefix",
    );
}
