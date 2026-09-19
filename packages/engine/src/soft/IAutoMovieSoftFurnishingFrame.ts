import { IAutoMovieSoftAnalysis, IAutoMovieSoftBodyState, IAutoMovieSoftBodySurface } from "@automovie/interface";

/**
 * One frame of a bound furnishing: what was computed, and what was claimed.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Carries the bounded soft result together with its honest computation status.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Exposes one renderer-ready furnishing frame without hiding unsupported outcomes.
 */
export interface IAutoMovieSoftFurnishingFrame {
  /**
   * Identity of the furnishing the frame belongs to.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-anchor-host Preserves which authored furnishing owns the lowered panel.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Keeps the soft result addressable at its interior installation boundary.
   */
  furnishing: string;

  /**
   * What the analysis actually did, including anything it declined to claim.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Reports solved, rest, unsupported, and not-run outcomes explicitly.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Carries the bounded computation status beside the furnishing result.
   */
  analysis: IAutoMovieSoftAnalysis;

  /**
   * The particle state, or `null` when nothing was computed at all.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Carries state only when the selected bounded tier produced one.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Distinguishes a computed furnishing state from a refused derivation.
   */
  state: IAutoMovieSoftBodyState | null;

  /**
   * Drawable geometry derived from that state, or `null` beside it.
   *
   * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-soft-simulation-bound Exposes geometry only for an available rest or solved state.
   * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Keeps the surface outcome consistent with the reported computation status.
   */
  surface: IAutoMovieSoftBodySurface | null;
}
