import type {
  IAutoMovieMotionTakeAnchor,
  IAutoMoviePlaybackEntry,
  IAutoMoviePreparePlaybackTimeline,
  IAutoMovieSequence,
  IAutoMovieSequenceEntry,
} from "@automovie/interface";

import { exactPlaybackHardCut } from "../exactPlaybackHardCut";
import { playbackEntryAt } from "./playbackEntryAt";
import { playbackSampleAt } from "./playbackSampleAt";

/**
 * Resolve a saved take's source occurrence against an already prepared,
 * admitted cut.
 *
 * Output seconds must be finite and in `[0, runtime]`. `after` is the default.
 * `before` is valid at a hard cut or the sequence end; `after` at sequence end
 * and `before` at sequence start are refused. Outgoing selection skips
 * occurrences whose starts coincide with the boundary because they occupy no
 * output time before it. An overlap requires the explicit incoming or outgoing
 * entry. At a selected outgoing endpoint, use the source's exact trim end if
 * present, otherwise its numeric trim or shot end.
 */
export function resolveMotionTakeAnchor(
  sequence: IAutoMovieSequence,
  prepared: IAutoMoviePreparePlaybackTimeline.IResult,
  selection: {
    outputSeconds: number;
    entry?: number;
    side?: IAutoMovieMotionTakeAnchor["side"];
  },
): IAutoMovieMotionTakeAnchor {
  const seconds: number = selection.outputSeconds;
  const side: IAutoMovieMotionTakeAnchor["side"] = selection.side ?? "after";
  const { entries, runtime } = prepared.timeline;
  if (seconds < 0 || seconds > runtime)
    throw new Error(
      "take-time: outputSeconds must lie within the edited sequence",
    );
  if (side !== "before" && side !== "after")
    throw new Error('take-side: side must be "before" or "after"');

  const live: IAutoMoviePlaybackEntry = playbackEntryAt(entries, seconds);
  const transition: IAutoMovieSequenceEntry["transition"] =
    sequence.shots[live.entry]!.transition;
  const previous: IAutoMoviePlaybackEntry | undefined = entries[live.entry - 1];
  const atEnd: boolean = seconds === runtime;
  const hardCut: boolean =
    previous !== undefined && seconds === live.start && transition === null;
  const overlap: boolean =
    transition !== null && seconds - live.start < transition.duration;
  let chosen: IAutoMoviePlaybackEntry = live;
  if (side === "before") {
    if (seconds === 0 || (!atEnd && !hardCut))
      throw new Error(
        'take-side: "before" requires a hard cut or sequence end',
      );
    chosen = playbackEntryAt(entries, seconds, false);
  } else if (atEnd)
    throw new Error('take-side: use "before" at the sequence end');
  else if (overlap) {
    if (selection.entry === undefined)
      throw new Error(
        `take-overlap: choose source entry ${previous!.entry} or ${live.entry}`,
      );
    if (selection.entry === previous!.entry) chosen = previous!;
  }
  if (selection.entry !== undefined && selection.entry !== chosen.entry)
    throw new Error(
      `take-entry: entry ${selection.entry} does not own this instant`,
    );

  const source: IAutoMovieSequenceEntry = sequence.shots[chosen.entry]!;
  let sourceSeconds: number;
  if (side === "before") {
    const sourceEnd: number =
      source.exactSourceEnd ??
      chosen.offset +
        (source.trim?.duration ??
          prepared.shotById.get(chosen.shot)!.shot.duration);
    sourceSeconds =
      !atEnd && chosen.entry + 1 === live.entry
        ? (exactPlaybackHardCut(sequence, chosen, live, sourceEnd) ?? sourceEnd)
        : sourceEnd;
  } else
    sourceSeconds = playbackSampleAt(sequence, entries, chosen, seconds).time;
  return {
    sequence: sequence.id,
    entry: chosen.entry,
    shot: chosen.shot,
    outputSeconds: seconds,
    sourceSeconds,
    side,
  };
}
