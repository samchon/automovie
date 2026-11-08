import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";

/**
 * What `mergeAutoMovieMeshParts` returns: one merged rigid mesh plus the index
 * range each member occupies, so a finish, a budget or a quantity take-off can
 * still address a member after the buffers were concatenated.
 *
 * @evidence contracts/development/design.md#principled-representation Groups are contiguous index ranges because `mergeAutoMovieMeshes` concatenates member index buffers in declaration order, so each member's triangles occupy one run of the merged buffer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the merged mesh and its ranges, since a consumer needs the single draw buffer plus a per-member address and nothing else from the merge.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The groups describe the merged buffer exactly; no member is dropped, reordered or padded to make ranges align.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, that the mesh is rigid and merged, and that groups are declaration-ordered per member ranges.
 */
export interface IAutoMovieMeshAssembly {
  /** The merged rigid mesh, members placed by their transforms and concatenated in declaration order. */
  mesh: IAutoMovieMesh;

  /** One index range per contributing member, in declaration order, covering the whole index buffer without gaps. */
  groups: IAutoMovieMeshGroup[];
}
