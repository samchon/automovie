import { IAutoMovieFluidDomain } from "@automovie/interface";

/**
 * One declared water body and whatever a solver has proved about it.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Groups the surface, simulation, material, and ownership inputs charged for one water body.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Defines the fluid-cost record consumed by worst-case preflight.
 */
export interface IAutoMovieRenderWaterBody {
  /**
   * Stable water-body id.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Keeps a fluid finding addressable as the same budget subject across runs.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keys water cost and recovery to one stable owner record.
   */
  id: string;

  /**
   * Semantic id of the owning building space, or `null` when unowned.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision Names the source owner a fluid budget finding directs the author to edit.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Attributes water cost to a bounded dominant-owner report without inventing ownership.
   */
  owner: string | null;

  /**
   * Scene node ids that draw the water surface, if any.
   *
   * These are ordinary staged nodes and are already counted as such, so a body
   * drawn by a bound {@link domain}'s own free surface names none here: listing
   * both would bill the same water twice.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Identifies staged surface nodes already charged elsewhere so water geometry is not double-counted.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves exact cost accounting when a body is drawn by ordinary nodes rather than a domain surface.
   */
  nodes: string[];

  /**
   * The shallow-water domain filling this body, or `null` when none exists.
   *
   * When present it is authoritative and {@link cells} and {@link particles} are
   * ignored: the grid states the cell count exactly and the emitters state the
   * particle cap, so a number derived from the record cannot drift from the
   * record the way a hand-copied one does. It also carries the drawn free
   * surface, one vertex per cell, into the geometry metrics.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Provides authoritative grid, emitter, and free-surface bounds for fluid cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prefers the declared domain over stale copied counts during worst-case preflight.
   */
  domain: IAutoMovieFluidDomain | null;

  /**
   * Simulation cell count proved by a solver outside this repository, or `null`
   * when none ran. Ignored when {@link domain} is present.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries an externally proved fluid-cell count only when no authoritative domain exists.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes supplied measurement from not-run fluid accounting.
   */
  cells: number | null;

  /**
   * Live particle count proved by such a solver, or `null` when none ran.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries the bounded live-particle contribution to simulation cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Reports absent particle analysis as not-run rather than zero.
   */
  particles: number | null;

  /**
   * Material id the free surface is drawn with, or `null` for the renderer's
   * own default. Ignored when {@link domain} is `null`, because a body with no
   * domain draws no surface of its own here.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the free surface's material and draw ownership in water cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Charges a material only when the domain actually contributes a drawable surface.
   */
  material: string | null;
}
