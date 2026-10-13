/**
 * Slack, in radians, on the full turn a revolute panel may travel.
 *
 * `validateBuiltEnvironment` and the swept-envelope solver
 * `builtOpeningSweepEnvelope` both read this constant: the cap is what bounds
 * the solver's critical-angle walk, so a range the validator waved through but
 * the solver could not enumerate would be a hang rather than a disagreement.
 */
export const AUTOMOVIE_FULL_TURN_EPSILON: number = 1e-6;
