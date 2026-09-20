/**
 * Absolute steps one seek may integrate.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Bounds replay work needed to derive one complete solver state.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Makes step admission finite before state transition.
 * @author Samchon
 */
export const SOFT_MAX_STEPS = 100_000;
