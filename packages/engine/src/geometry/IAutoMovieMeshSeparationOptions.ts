import type { IAutoMovieMeshQueryBudget } from "./IAutoMovieMeshQueryBudget";
import type { IAutoMovieMeshSeparationAttachment } from "./IAutoMovieMeshSeparationAttachment";

/**
 * Per-query inputs of a compiled mesh separation query.
 *
 * `clearance` is the requested separation in the resident mesh's metre frame;
 * zero still requires strict positive separation. `budget` is the caller-owned
 * work count the query spends in place. `attachment` registers a canonical root
 * seat for a three-vertex fan at zero clearance only.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Names the requested clearance, shared work budget and optional root registration a composable separation query consumes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Groups the inputs that qualify complete-feature clearance against the original resident triangles.
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationOptions {
  /**
   * Requested nonnegative separation in metres; zero demands strict positive
   * separation and never accepts touching.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Sets the separation a composable feature must prove against the resident surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Caps the reported lower bound and decides certification for the complete feature.
   */
  clearance: number;

  /**
   * Shared mutable work count, spent before each box, triangle and feature test.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds the query by one caller-owned work count shared across refinement.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the budget the separation qualification decrements and refuses on exhaustion.
   */
  budget: IAutoMovieMeshQueryBudget;

  /**
   * Optional canonical root registration; admitted only at zero clearance for
   * a three-vertex fan.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Lets an attached fan prove bounded contact on its supports while every other face stays strictly separated.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the seat and support ordinals the query validates against original triangle identity.
   */
  attachment?: IAutoMovieMeshSeparationAttachment;
}
