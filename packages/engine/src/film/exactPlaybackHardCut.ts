import type {
  IAutoMoviePlaybackEntry,
  IAutoMovieSequence,
} from "@automovie/interface";

/**
 * Resolve the shared source boundary of a precise adjacent same-shot hard cut.
 *
 * A cut is precise when either entry carries an explicit rate or exact symbolic source end. Returns undefined for a dissolve, a different shot, backwards source time or a source gap. Numeric trims may disagree with their mathematically contiguous successor by one rounding unit; symbolic ends must match exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the prepared adjacent input, exactness trigger, hard-cut and rounding conditions and undefined result.
 * @evidence contracts/development/implementation.md#principled-implementation Compares the incoming source offset to the supplied outgoing source endpoint with zero tolerance for symbolic endpoints or the floating arithmetic allowance for numeric endpoints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns the shared source instant for event ownership and saved before-side anchors.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Requires same-shot hard adjacency and strictly forward source order before allowing a numeric rounding discrepancy.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant-time checks of two prepared entries and their authored records.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Evaluates two existing records once without building a cut.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a number or undefined and retains no records.
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
