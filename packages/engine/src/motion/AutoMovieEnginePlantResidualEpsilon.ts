/**
 * The width of one residual bucket of a chain fit, model metres: two candidates
 * whose effector misses the target by amounts in the same bucket reach it
 * equally, and the one nearer the reference pose wins
 * (`fitSeededChainToTarget`). A tenth of a micrometre, far below every contact
 * and clearance verdict, which read millimetres, and far above the rounding of
 * a body-scale forward kinematics, so two misses closer than it are one miss,
 * the position tie of a fit ranked position first.
 */
export const AutoMovieEnginePlantResidualEpsilon: number = 1e-7;
