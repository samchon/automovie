/**
 * Interaction event categories emitted by the engine while assembling a shot.
 *
 * These are semantic contact points for downstream motion, review, and render
 * systems: a renderer can inspect the same computed hit/fall/attach timing the
 * engine used instead of re-deriving it from raw clips.
 *
 * @evidence requirements/staging/events-and-timing.md#staging-event-observation Exposes `AutoMovieInteractionEventKind` as the portable data boundary for the staging event observation requirement.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-event-boundary-sampling-output Types `AutoMovieInteractionEventKind` for the performance staging event boundary sampling output system contract.
 * @author Samchon
 */
export type AutoMovieInteractionEventKind =
  | "contact"
  | "hit"
  | "grab"
  | "release"
  | "attach"
  | "detach"
  | "fall";
