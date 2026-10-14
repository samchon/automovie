import { IAutoMovieFluidDomain } from "@automovie/interface";

/** One declared water body and whatever a solver has proved about it.
 *
 * @evidence contracts/common.md#principled-implementation A bound fluid domain authoritatively determines grid cells, particle cap and drawn surface; external solver counts apply only without a domain, and wholly unproved facts remain unsupported.
 * @evidence contracts/common.md#clear-and-simple-design One water-body row joins semantic/material ownership and simulation geometry without charging both domain surface and ordinary scene nodes for the same water.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null counts mean no solver proof, not zero; domain-derived quantities override hand counts rather than accepting contradictory estimates.
 * @evidence contracts/common.md#meaningful-documentation Members document domain precedence, node double-count avoidance, semantic ownership and material use only for a domain-drawn surface.
 * @evidence contracts/performance.md#efficient-algorithms Grid-derived counts use dimensions/emitter caps without running the solver; record storage is proportional to named staged nodes rather than grid cells.
 * @evidence contracts/performance.md#reuse-equivalent-work Mask and inventory reuse the same domain/binding row; topology counts survive changing water heights, while altered grid/emitter laws require remeasurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The holder owns the domain record and external facts; no solver state, water mesh or native resource is allocated by this type.
 */
export interface IAutoMovieRenderWaterBody {
  /** Stable water-body id. */
  id: string;

  /** Semantic id of the owning building space, or `null` when unowned. */
  owner: string | null;

  /**
   * Scene node ids that draw the water surface, if any.
   *
   * These are ordinary staged nodes and are already counted as such, so a body
   * drawn by a bound {@link domain}'s own free surface names none here: listing
   * both would bill the same water twice.
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
   */
  domain: IAutoMovieFluidDomain | null;

  /**
   * Simulation cell count proved by a solver outside this repository, or `null`
   * when none ran. Ignored when {@link domain} is present.
   */
  cells: number | null;

  /** Live particle count proved by such a solver, or `null` when none ran. */
  particles: number | null;

  /**
   * Material id the free surface is drawn with, or `null` for the renderer's
   * own default. Ignored when {@link domain} is `null`, because a body with no
   * domain draws no surface of its own here.
   */
  material: string | null;
}
