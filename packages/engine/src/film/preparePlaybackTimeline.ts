import {
  type IAutoMoviePlaybackEntry,
  type IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
  IAutoMovieShot,
} from "@automovie/interface";

/**
 * Build a playback layout and the shot index shared by frame, event and
 * editorial marker consumers.
 *
 * The sequence must have passed cutSequence: source trims, playback rates and
 * output overlaps already fit their respective clocks. This preparation still
 * refuses empty cuts, duplicate supplied shot ids, missing referenced shots, a
 * first-entry transition and nondefault rates that cannot produce a
 * representable output interval. Extra supplied shots are indexed but do not
 * add playback entries.
 *
 * @returns The output-clock timeline and its unambiguous supplied-shot index.
 */
export function preparePlaybackTimeline(
  sequence: IAutoMovieSequence,
  shots: readonly IAutoMovieShot[],
): IAutoMoviePreparePlaybackTimeline.IResult {
  if (sequence.shots.length === 0)
    throw new Error(`sequence "${sequence.id}" must contain at least one shot`);
  const shotById: Map<string, { shot: IAutoMovieShot; index: number }> =
    new Map();
  shots.forEach((shot: IAutoMovieShot, index: number): void => {
    const existing: { shot: IAutoMovieShot; index: number } | undefined =
      shotById.get(shot.id);
    if (existing !== undefined)
      throw new Error(
        `shot id "${shot.id}" is duplicated at shots[${index}].id; first declared at shots[${existing.index}].id`,
      );
    shotById.set(shot.id, { shot, index });
  });
  const entries: IAutoMoviePlaybackEntry[] = [];
  let cursor: number = 0;
  sequence.shots.forEach(
    (entry: IAutoMovieSequenceEntry, index: number): void => {
      if (index === 0 && entry.transition !== null)
        throw new Error(
          "sequence.shots[0].transition has nothing to transition from",
        );
      const found: { shot: IAutoMovieShot; index: number } | undefined =
        shotById.get(entry.shot);
      if (found === undefined)
        throw new Error(
          `sequence shot "${entry.shot}" at sequence.shots[${index}].shot was not provided`,
        );
      const rate: number =
        entry.playbackRate === undefined ? 1 : entry.playbackRate;
      const played: number =
        (entry.trim?.duration ?? found.shot.duration) / rate;
      const start: number = cursor - (entry.transition?.duration ?? 0);
      const end: number = start + played;
      if (
        rate !== 1 &&
        (!(rate > 0) ||
          !(played > 0) ||
          !(end > start))
      )
        throw new Error(
          `sequence.shots[${index}].playbackRate must be positive and produce a representable output span`,
        );
      entries.push({
        entry: index,
        shot: entry.shot,
        start,
        played,
        offset: entry.trim?.start ?? 0,
        ...(rate === 1 ? {} : { playbackRate: rate }),
      });
      cursor = end;
    },
  );
  return { timeline: { entries, runtime: cursor }, shotById };
}
