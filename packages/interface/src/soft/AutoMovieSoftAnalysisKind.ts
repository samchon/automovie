/**
 * The analyses this domain family provides.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `AutoMovieSoftAnalysisKind` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `AutoMovieSoftAnalysisKind` for the soft collider and solver transition system contract.
 */
export type AutoMovieSoftAnalysisKind = "soft-body" | "planting";
