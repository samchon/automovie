import { IAutoMovieSequence, IAutoMovieSequenceEntry, IAutoMovieShot } from "@automovie/interface";

import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

/**
 * Build a playback layout and the shot index its frame and event consumers share.
 *
 * The sequence must have passed cutSequence: trims and overlaps already fit
 * their source spans. This preparation still refuses empty cuts, duplicate
 * supplied shot ids, missing referenced shots and a first-entry transition.
 * Extra supplied shots are indexed but do not add playback entries.
 *
 * @returns The output-clock timeline and its unambiguous supplied-shot index.
 *
 * @evidence contracts/common.md#principled-implementation A running cursor adds each played span and subtracts the incoming transition overlap; accepted trims and overlaps therefore preserve the cutSequence runtime. Indexing ids first makes every entry lookup unambiguous and preserves the first duplicate's position in its refusal.
 * @evidence contracts/common.md#clear-and-simple-design Owns layout and its required shot index together because sequenceTimeline needs the layout and sequenceEventTimeline needs both; public timeline records retain their existing fields without keeping an otherwise unused index.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every supplied shot is indexed and every sequence entry is laid out in authored order; extra shots cannot affect timing and duplicate ids are refused rather than resolved by insertion order.
 * @evidence contracts/common.md#meaningful-documentation States the accepted-cut precondition, remaining structural refusals, extra-shot behavior and the two returned products; entry start and runtime remain seconds on the output clock.
 * @evidence contracts/performance.md#efficient-algorithms Indexes S supplied shots and lays out E entries in O(S+E) time and space; the index is required for constant-time references and duplicate admission, and the event consumer uses this same completed index instead of building it twice.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the one supplied-shot index with the layout and event placement within the call; both consume the same sequence and shot objects synchronously, with no cross-call cache or invalidation policy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns S index entries and E placement records until return, transferring them to its caller; sequenceTimeline releases the index immediately while sequenceEventTimeline releases it after producing events. No state or handles survive independently of the caller's results.
 */
export function preparePlaybackTimeline(
  sequence: IAutoMovieSequence,
  shots: readonly IAutoMovieShot[],
): {
  timeline: IAutoMoviePlaybackTimeline;
  shotById: ReadonlyMap<string, { shot: IAutoMovieShot; index: number }>;
} {
  if (sequence.shots.length === 0)
    throw new Error(`sequence "${sequence.id}" must contain at least one shot`);
  const shotById: Map<string, { shot: IAutoMovieShot; index: number }> = new Map();
  shots.forEach((shot: IAutoMovieShot, index: number): void => {
    const existing: { shot: IAutoMovieShot; index: number } | undefined = shotById.get(shot.id);
    if (existing !== undefined)
      throw new Error(`shot id "${shot.id}" is duplicated at shots[${index}].id; first declared at shots[${existing.index}].id`);
    shotById.set(shot.id, { shot, index });
  });
  const entries: IAutoMoviePlaybackEntry[] = [];
  let cursor: number = 0;
  sequence.shots.forEach((entry: IAutoMovieSequenceEntry, index: number): void => {
    if (index === 0 && entry.transition !== null)
      throw new Error("sequence.shots[0].transition has nothing to transition from");
    const found: { shot: IAutoMovieShot; index: number } | undefined = shotById.get(entry.shot);
    if (found === undefined)
      throw new Error(`sequence shot "${entry.shot}" at sequence.shots[${index}].shot was not provided`);
    const played: number = entry.trim?.duration ?? found.shot.duration;
    const start: number = cursor - (entry.transition?.duration ?? 0);
    entries.push({ entry: index, shot: entry.shot, start, played, offset: entry.trim?.start ?? 0 });
    cursor = start + played;
  });
  return { timeline: { entries, runtime: cursor }, shotById };
}
