/**
 * Constraint relaxation sweeps one step may cost.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Bounds deterministic constraint work per solver state transition.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Applies the declared iteration cap during ordered transition.
 * @author Samchon
 */
export const SOFT_MAX_ITERATIONS = 64;
