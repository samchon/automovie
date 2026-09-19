import { IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";
import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";
import { IAutoMoviePlaybackTimeline } from "./IAutoMoviePlaybackTimeline";

const indexShots = (
  shots: readonly IAutoMovieShot[],
): Map<string, { shot: IAutoMovieShot; index: number }> => {
  const byId = new Map<string, { shot: IAutoMovieShot; index: number }>();
  shots.forEach((shot, index) => {
    const existing = byId.get(shot.id);
    if (existing !== undefined)
      throw new Error(
        `shot id "${shot.id}" is duplicated at shots[${index}].id; first declared at shots[${existing.index}].id`,
      );
    byId.set(shot.id, { shot, index });
  });
  return byId;
};

/**
 * Lay the cut onto the output clock, the playback mirror of `cutSequence`'s
 * runtime arithmetic: each entry plays its trimmed span, and a transition pulls
 * its entry forward to overlap the previous tail by the transition's duration.
 * Precondition: the sequence already passed `cutSequence` (every entry
 * references a shot, every trim fits), so this resolver is total.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time Places every trimmed sequence entry on the output clock and subtracts declared transition overlaps from the accumulated runtime.
 * @evidence requirements/editorial/clips-source-ranges-and-handles.md#editorial-source-film-range Retains each selected source offset and played duration separately from the entry's derived output start.
 * @evidence requirements/editorial/clips-source-ranges-and-handles.md#editorial-clip-boundary-result Exposes the resolved source offset, played span, output start, and transition overlap for every picture entry.
 * @evidence requirements/editorial/scope-and-identity.md#editorial-authored-cut Preserves the declared sequence order, trim choice, and incoming transition on each picture entry without reordering or pacing optimization.
 * @evidence requirements/editorial/scope-and-identity.md#editorial-duration-closure Computes picture-only closure by summing each played trim or full-shot duration and subtracting declared picture-transition overlap.
 * @evidence requirements/editorial/scope-and-identity.md#editorial-missing-refusal Refuses an empty sequence or an entry whose referenced shot is absent from the supplied source set.
 * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-composition-refusal Refuses only the sequential picture defects it can prove: an empty sequence, duplicate supplied shot ids, a missing shot reference, or an incoming transition with no predecessor.
 * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-transition-refusal Rejects a transition on the first picture entry because no outgoing source exists for that overlap.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline Resolves declared trims and transition offsets into ordered output-clock picture placements.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-clip-boundaries Materializes the supported picture-lane source and film boundaries as explicit playback entry fields.
 * @evidence specifications/editorial-render-and-delivery/editorial-version-conform-and-validation.md#spec-editorial-film-identity Resolves the authored picture order and transition graph into a finite picture runtime while refusing absent required picture sources.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition Validates the small sequential-picture subset at this boundary before emitting ordered playback entries.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap Requires an outgoing picture before positioning an incoming overlap on the output clock.
 */
export const sequenceTimeline = (
  sequence: IAutoMovieSequence,
  shots: IAutoMovieShot[],
): IAutoMoviePlaybackTimeline => {
  if (sequence.shots.length === 0)
    throw new Error(`sequence "${sequence.id}" must contain at least one shot`);

  const byId = indexShots(shots);
  const entries: IAutoMoviePlaybackEntry[] = [];
  let cursor = 0;
  sequence.shots.forEach((entry, i) => {
    if (i === 0 && entry.transition !== null)
      throw new Error(
        "sequence.shots[0].transition has nothing to transition from",
      );

    const found = byId.get(entry.shot);
    if (found === undefined)
      throw new Error(
        `sequence shot "${entry.shot}" at sequence.shots[${i}].shot was not provided`,
      );
    const shot = found.shot;
    const played = entry.trim?.duration ?? shot.duration;
    const start = cursor - (entry.transition?.duration ?? 0);
    entries.push({
      entry: i,
      shot: entry.shot,
      start,
      played,
      offset: entry.trim?.start ?? 0,
    });
    cursor = start + played;
  });
  return { entries, runtime: cursor };
};
