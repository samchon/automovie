/**
 * Where an interaction event came from. The value is intentionally about the
 * producer, not the visual result, so clients can decide how much trust or
 * extra solving they need downstream.
 *
 * @evidence requirements/staging/events-and-timing.md#staging-event-observation Exposes `AutoMovieInteractionEventSource` as the portable data boundary for the staging event observation requirement.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-event-boundary-sampling-output Types `AutoMovieInteractionEventSource` for the performance staging event boundary sampling output system contract.
 */
export type AutoMovieInteractionEventSource =
  | "collisionSolver"
  | "scriptedCue"
  | "sampledProximity"
  | "impactOutput";
