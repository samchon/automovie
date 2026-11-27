import type { IAutoMovieMesh } from "../model/IAutoMovieMesh";
import type { IAutoMovieMeshTransform } from "./IAutoMovieMeshTransform";

/**
 * One named rigid member that {@link mergeMeshParts} places and
 * concatenates into an assembly.
 *
 * The merge refuses a blank or repeated `id` and a mesh whose index buffer is
 * malformed, then reports the member's index range under the same `id` as an
 * {@link IAutoMovieMeshGroup}. A placed member goes through
 * `transformMesh`, which refuses a skinned mesh, a non-unit rotation
 * and a scale that collapses an axis; an unplaced member is concatenated as
 * given.
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
