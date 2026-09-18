/**
 * - `solved`: the fixed-step solve ran and the state is its result.
 * - `rest`: the authored rest configuration was requested and returned as such.
 * - `derived`: a deterministic derivation ran; nothing was integrated over time.
 * - `not-run`: nothing was computed at all, because the record did not validate
 *   or the request fell outside what the record declared.
 * - `unsupported`: a declared capability this tier does not provide was asked
 *   for, so no solved state is claimed.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `AutoMovieSoftAnalysisStatus` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `AutoMovieSoftAnalysisStatus` for the soft collider and solver transition system contract.
 */
export type AutoMovieSoftAnalysisStatus =
  | "solved"
  | "rest"
  | "derived"
  | "not-run"
  | "unsupported";
