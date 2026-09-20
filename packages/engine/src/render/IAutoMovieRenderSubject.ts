import { IAutoMovieBuiltEnvironment, IAutoMovieCompiledEffect, IAutoMovieCompiledFormation, IAutoMovieCompiledInstanceSet, IAutoMovieModel, IAutoMovieScene } from "@automovie/interface";
import { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Everything one drawn frame is made of, in one record.
 *
 * The semantic mask and the render inventory read the same subject, which is
 * the only reason a colour in the mask and a cost in the report can name the
 * same owner. Two functions that each reached into the compiled artifact their
 * own way would drift the first time one of them learned about a new kind of
 * drawable, and the report's owner ids would stop resolving in the mask without
 * anything going red.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries the complete drawable closure whose geometry, memory, lights, instances, and simulation cost must be measured.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Gives mask derivation and worst-case inventory one shared subject so owners and costs cannot drift.
 * @author Samchon
 */
export interface IAutoMovieRenderSubject {
  /**
   * Staged scene: ordinary nodes, lights, and the render environment.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies ordinary node, light, material, and model bindings to the render inventory.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Includes staged scene costs in the same worst-case preflight as simulated drawables.
   */
  scene: IAutoMovieScene;

  /**
   * Every runtime model cited by a scene node or an instance prototype.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Provides the geometry and material records used to price nodes and instance prototypes.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Closes model dependencies before worst-case geometry accounting begins.
   */
  models: readonly IAutoMovieModel[];

  /**
   * Structured buildings retained by the compiled shot, if any.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Retains building ownership needed to attribute drawable cost to semantic spaces.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps dominant-owner recovery tied to the structured source that can be edited.
   */
  environments?: readonly IAutoMovieBuiltEnvironment[];

  /**
   * Compact general instance runtimes placed by the production world.
   *
   * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Exposes slot, chunk, and prototype bounds without expanding compact instances into nodes.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes worst-case instance expansion an explicit preflight input.
   */
  instanceSets?: readonly IAutoMovieCompiledInstanceSet[];

  /**
   * Compact character formations drawn as camera-selected instanced batches.
   *
   * Heroes already occur as ordinary scene nodes; this list carries the
   * anonymous population that no node expansion is allowed to materialize.
   *
   * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Includes bounded formation instances in render preflight without expanding them into nodes.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries the compiled formation population and LOD closure into worst-case inventory.
   */
  formations?: readonly IAutoMovieCompiledFormation[];

  /**
   * Bounded builder-owned particle effects drawn as instanced billboards.
   *
   * @evidence requirements/rendering/budgets.md#rendering-expansion-bounds Includes the declared particle cap rather than the one frame's sampled population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries effect prototype and instance bounds into worst-case inventory.
   */
  effects?: readonly IAutoMovieCompiledEffect[];

  /**
   * Water bodies the production declares.
   *
   * A body bound to a {@link IAutoMovieRenderWaterBody.domain fluid domain} is
   * measured from that record; one carrying only hand-supplied counts is taken
   * at its word; one carrying neither makes the fluid metrics `unsupported`
   * rather than zero.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes fluid grids, particles, and free-surface geometry in the render cost closure.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes authoritative domain cost, supplied measurements, and unsupported fluid analysis.
   */
  waterBodies?: readonly IAutoMovieRenderWaterBody[];

  /**
   * Cloth panels the production hangs.
   *
   * A soft-body panel is drawn geometry that no scene node holds, so a subject
   * that omitted it would report a triangle count for a room the curtain is
   * missing from. The panel's cost is a property of the domain's lattice alone
   * and needs no solve: the drawn mesh is one vertex per particle and two
   * triangles per lattice quad at every step.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes cloth lattice geometry that is drawable but absent from scene nodes.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes soft-panel cost part of preflight before simulation runs.
   */
  softBodies?: readonly IAutoMovieRenderSoftPanel[];

  /**
   * Planting clusters the production grows.
   *
   * Like a panel, a bed of ferns is drawn geometry no scene node holds; unlike
   * a panel, its per-instance shape is chosen by the renderer, which is why the
   * batching cost is exact here and the geometry cost is only as exact as the
   * {@link IAutoMovieRenderPlanting.branch prototype cost} the caller supplies.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes planting instance batches and their declared prototype geometry in total cost.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates exact batching counts from caller-supplied branch and leaf geometry bounds.
   */
  plantings?: readonly IAutoMovieRenderPlanting[];

  /**
   * Decoded dimensions of texture assets, when the caller knows them.
   *
   * An asset a material binds but this list omits makes `textureBytes`
   * `not-run`: an invented byte count is exactly the kind of number a budget
   * would then approve.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies decoded dimensions for texture-memory accounting instead of treating unknown bytes as zero.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes absent texture facts an explicit not-run gap in preflight.
   */
  textures?: readonly IAutoMovieRenderTextureSource[];
}
