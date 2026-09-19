import { AutoMovieSoftAnalysisKind } from "./AutoMovieSoftAnalysisKind";
import { AutoMovieSoftAnalysisStatus } from "./AutoMovieSoftAnalysisStatus";

/**
 * What a domain's analysis actually did, and what it declined to claim.
 *
 * An unsupported or unexecuted analysis is reported here, never dressed as a
 * success: a panel drawn in its rest shape because the solver could not honour
 * what it was asked for is a _reported_ rest shape, not a simulation that
 * happened to look still.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `IAutoMovieSoftAnalysis` as the portable data boundary for the effects soft solver state requirement.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `IAutoMovieSoftAnalysis` for the soft collider and solver transition system contract.
 */
export interface IAutoMovieSoftAnalysis {
  /**
   * Identity of the analysed domain.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `domain` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `domain` for the soft collider and solver transition system contract.
   */
  domain: string;

  /**
   * Which analysis was asked for.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `kind` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `kind` for the soft collider and solver transition system contract.
   */
  kind: AutoMovieSoftAnalysisKind;

  /**
   * What the analysis was able to produce.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `status` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `status` for the soft collider and solver transition system contract.
   */
  status: AutoMovieSoftAnalysisStatus;

  /**
   * Why, in one sentence, when the status is not a plain success.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `reason` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `reason` for the soft collider and solver transition system contract.
   */
  reason: string | null;

  /**
   * Capabilities the record asked for that this tier does not provide.
   *
   * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Exposes `unsupported` as the portable data boundary for the effects soft solver state requirement.
   * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Types `unsupported` for the soft collider and solver transition system contract.
   */
  unsupported: string[];
}
