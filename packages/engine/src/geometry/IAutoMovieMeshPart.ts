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
 * @evidence contracts/common.md#principled-implementation Identity, local geometry and an optional rigid placement are all the merge needs: it checks ids for blankness and uniqueness before any geometry work, validates each mesh's triangles, and applies the placement only when one is present, so an unplaced member keeps its buffers bit for bit.
 * @evidence contracts/common.md#clear-and-simple-design Placement is a separate optional record rather than baked into the mesh, so one built member can be listed several times at different poses without rebuilding it, which is the reuse the merge exists for.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A repeated or blank id is refused rather than suffixed or skipped, so a material group can never silently address the wrong member.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, the id rules it enforces and the group that reports the id back, which transform refusals apply, and that an omitted transform leaves the mesh as given.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record with no runtime body; `mergeAutoMovieMeshParts` answers the cost of placing and concatenating members.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied by the caller for one merge; reusing one mesh across several parts is the caller's choice, and the record caches nothing itself.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds the caller's mesh and transform by reference; the merge reads them and emits fresh buffers, so the part retains nothing beyond what its author keeps alive.
 * @author Samchon
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
