/**
 * Colliders one panel may be kept out of.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders Bounds the shared proxy inventory presented to the solver.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Keeps ordered collision projection finite.
 * @author Samchon
 */
export const SOFT_MAX_COLLIDERS = 64;
