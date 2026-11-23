import type {
  IAutoMoviePlaybackEntry,
  IAutoMovieSequence,
} from "@automovie/interface";

/**
 * Resolve the shared source boundary of a precise adjacent same-shot hard cut.
 *
 * A cut is precise when either entry carries an explicit rate or exact symbolic
 * source end. Returns undefined for a dissolve, a different shot, backwards
 * source time or a source gap. Numeric trims may disagree with their
 * mathematically contiguous successor by one rounding unit; symbolic ends must
 * match exactly.
 */
export function exactPlaybackHardCut(
  sequence: IAutoMovieSequence,
  outgoing: IAutoMoviePlaybackEntry,
  incoming: IAutoMoviePlaybackEntry,
  sourceEnd: number,
): number | undefined {
  const exactEnd: number | undefined =
    sequence.shots[outgoing.entry]!.exactSourceEnd;
  if (
    outgoing.shot !== incoming.shot ||
    sequence.shots[incoming.entry]!.transition !== null ||
    incoming.offset <= outgoing.offset ||
    (outgoing.playbackRate === undefined &&
      incoming.playbackRate === undefined &&
      exactEnd === undefined &&
      sequence.shots[incoming.entry]!.exactSourceEnd === undefined)
  )
    return undefined;
  const allowance: number =
    exactEnd === undefined ? Number.EPSILON * sourceEnd : 0;
  return Math.abs(sourceEnd - incoming.offset) <= allowance
    ? incoming.offset
    : undefined;
}
