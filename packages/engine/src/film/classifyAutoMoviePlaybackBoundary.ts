import type {
  IAutoMovieClassifyPlaybackBoundary,
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackSample,
  IAutoMovieSequenceEntry,
} from "@automovie/interface";

import { playbackEntryAt } from "./playbackEntryAt";
import { playbackSampleAt } from "./playbackSampleAt";

/**
 * Classify the edit relation between two output instants of one cut.
 *
 * Both instants resolve through the canonical playback mapping, so trims and
 * playback rates give each endpoint its retimed shot-local second, and an
 * instant on an entry's first output second belongs to that incoming entry.
 * One entry is continuous. A hard cut into the same shot at exactly the source
 * second where the previous entry stopped is a continuous seam. Every other
 * entry change, and any transition overlap at either instant, is a cut. A
 * declared break of that shot in `(before, after]` on its clock turns a
 * continuous relation into a discontinuity.
 *
 * @param props The cut, its layout, two output seconds and the deliberate breaks.
 * @returns The relation, with both shot clocks unless it is unavailable.
 * @evidence contracts/development/common.md#meaningful-documentation States the mapping, boundary ownership, seam rule, transition rule and break interval.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the stateless live-entry search and sample construction that random-access playback uses. A seam compares the outgoing entry's exact retained source end with the incoming trim start, so no tolerance or output spacing decides it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, endpoint resolution, edit relation and declared break are four steps in order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No instant is clamped onto the timeline, no frame step is assumed and a transition is never treated as continuous.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two binary searches over E entries plus a linear pass over B breaks: O(log E + B) time and constant extra space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the caller's prepared layout and the existing entry search and sample builder.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns new plain records and keeps no reference to the sequence or layout.
 */
export function classifyAutoMoviePlaybackBoundary(
  props: IAutoMovieClassifyPlaybackBoundary.IProps,
): IAutoMovieClassifyPlaybackBoundary.IResult {
  const { sequence, timeline, before, after } = props;
  const entries: readonly IAutoMoviePlaybackEntry[] = timeline.entries;
  if (
    entries.length === 0 ||
    !Number.isFinite(before) ||
    !Number.isFinite(after) ||
    before < 0 ||
    after < before ||
    after >= timeline.runtime
  )
    return { boundary: "unavailable" };

  const outgoing: IAutoMoviePlaybackEntry = playbackEntryAt(entries, before);
  const incoming: IAutoMoviePlaybackEntry = playbackEntryAt(entries, after);
  const first: IAutoMoviePlaybackSample = playbackSampleAt(
    sequence,
    entries,
    outgoing,
    before,
  );
  const second: IAutoMoviePlaybackSample = playbackSampleAt(
    sequence,
    entries,
    incoming,
    after,
  );
  const ends: {
    before: IAutoMovieClassifyPlaybackBoundary.IEndpoint;
    after: IAutoMovieClassifyPlaybackBoundary.IEndpoint;
  } = {
    before: { entry: outgoing.entry, shot: first.shot, seconds: first.time },
    after: { entry: incoming.entry, shot: second.shot, seconds: second.time },
  };
  if (
    first.blend !== null ||
    second.blend !== null ||
    !(
      outgoing.entry === incoming.entry ||
      resumesShot(sequence.shots, outgoing, incoming)
    )
  )
    return { boundary: "cut", ...ends };

  const broken: boolean = (props.discontinuities ?? []).some(
    ({ shot, seconds }): boolean =>
      shot === first.shot && first.time < seconds && seconds <= second.time,
  );
  return { boundary: broken ? "discontinuity" : "continuous", ...ends };
}

/**
 * Whether the incoming entry hard-cuts into the same shot at the source second where the outgoing one stopped.
 */
function resumesShot(
  shots: readonly IAutoMovieSequenceEntry[],
  outgoing: IAutoMoviePlaybackEntry,
  incoming: IAutoMoviePlaybackEntry,
): boolean {
  if (incoming.entry !== outgoing.entry + 1 || incoming.shot !== outgoing.shot)
    return false;
  const left: IAutoMovieSequenceEntry = shots[outgoing.entry]!;
  const right: IAutoMovieSequenceEntry = shots[incoming.entry]!;
  if (right.transition !== null || right.trim === null) return false;
  const end: number =
    left.exactSourceEnd ??
    (left.trim === null
      ? outgoing.offset + outgoing.played * (outgoing.playbackRate ?? 1)
      : left.trim.start + left.trim.duration);
  return end === right.trim.start;
}
