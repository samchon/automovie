import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/**
 * One cloth panel drawn from a soft-body domain.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Groups the lattice, material, and owner charged for one simulated cloth drawable.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Defines a solver-independent cloth cost input for render preflight.
 */
export interface IAutoMovieRenderSoftPanel {
  /**
   * The domain whose lattice is drawn as one panel.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Provides exact particle and lattice dimensions for cloth geometry cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Lets preflight bound the drawn panel before advancing its simulation.
   */
  domain: IAutoMovieSoftBodyDomain;

  /**
   * Semantic id of the owning building space, or `null` when unowned.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Names the editable space responsible for a cloth contribution.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Attributes panel cost to the bounded dominant-owner report.
   */
  owner: string | null;

  /**
   * Material id the panel is drawn with, or `null` for the default.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the panel's material binding in draw-call and material totals.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prices the declared binding while preserving the renderer-default case.
   */
  material: string | null;
}
