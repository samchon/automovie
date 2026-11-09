import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";

/**
 * One named rigid member that {@link mergeAutoMovieMeshParts} places and
 * concatenates into an assembly.
 *
 * The merge refuses a blank or repeated `id` and a mesh whose index buffer is
 * malformed, then reports the member's index range under the same `id` as an
 * {@link IAutoMovieMeshGroup}. A placed member goes through
 * `transformAutoMovieMesh`, which refuses a skinned mesh, a non-unit rotation
 * and a scale that collapses an axis; an unplaced member is concatenated as
 * given.
 *
 * @evidence contracts/development/design.md#principled-representation Identity, local geometry and an optional rigid placement are all the merge needs: it checks ids for blankness and uniqueness before any geometry work, validates each mesh's triangles, and applies the placement only when one is present, so an unplaced member keeps its buffers bit for bit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Placement is a separate optional record rather than baked into the mesh, so one built member can be listed several times at different poses without rebuilding it, which is the reuse the merge exists for.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A repeated or blank id is refused rather than suffixed or skipped, so a material group can never silently address the wrong member.
 * @evidence contracts/development/common.md#meaningful-documentation States the consumer, the id rules it enforces and the group that reports the id back, which transform refusals apply, and that an omitted transform leaves the mesh as given.
 */
export interface IAutoMovieMeshPart {
  /**
   * Member identity, non-blank and unique inside one assembly; the merged
   * mesh's material group for this member carries the same value.
   */
  id: string;

  /**
   * The member's unskinned geometry in its own local metre frame. It is read,
   * never mutated.
   */
  mesh: IAutoMovieMesh;

  /**
   * Placement into the assembly frame. Omitted means the mesh is concatenated
   * in its own frame without copying through a transform.
   */
  transform?: IAutoMovieMeshTransform;
}
