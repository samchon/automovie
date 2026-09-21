/**
 * Particles one panel may hold, so a lattice cannot silently cost a gigabyte.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-discretization-identity Bounds the particle topology carried by one stable domain identity.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Makes the bounded particle lattice part of the solver-domain contract.
 * @author Samchon
 */
export const SOFT_MAX_PARTICLES = 16_384;
