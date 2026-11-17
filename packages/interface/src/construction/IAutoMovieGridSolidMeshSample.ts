import type { AutoMovieVector2Tuple } from "../geometry/AutoMovieVector2Tuple";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * One locally evaluated, not yet published sampling point.
 *
 * @evidence contracts/development/design.md#principled-representation A provisional sample pairs a copied world-mm point with its native face-chart coordinates; neither coordinate tuple is a published mesh index.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Grid and face mesh preparation share this sample before committing positions to the final mesh.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tuples enforce dimension only; source evaluation admits finite points before the grid publishes them.
 * @evidence contracts/development/common.md#meaningful-documentation States copied point ownership, world units and unpublished status.
 */
export interface IAutoMovieGridSolidMeshSample {
  /** Copied world point. */
  point: AutoMovieVector3Tuple;

  /** Its owner-local chart. */
  chart: Readonly<AutoMovieVector2Tuple>;
}
