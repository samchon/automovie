import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieMeshGroup } from "./IAutoMovieMeshGroup";

/**
 * What `mergeAutoMovieMeshParts` returns: one merged rigid mesh plus the index
 * range each member occupies, so a finish, a budget or a quantity take-off can
 * still address a member after the buffers were concatenated.
 *
 * @evidence contracts/common.md#principled-implementation Groups are contiguous index ranges because `mergeAutoMovieMeshes` concatenates member index buffers in declaration order, so each member's triangles occupy one run of the merged buffer.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the merged mesh and its ranges, since a consumer needs the single draw buffer plus a per-member address and nothing else from the merge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The groups describe the merged buffer exactly; no member is dropped, reordered or padded to make ranges align.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that the mesh is rigid and merged, and that groups are declaration-ordered per member ranges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the merge cost is answered on `mergeAutoMovieMeshParts`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each merge returns a fresh assembly and caches none.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the merged buffers and one group per member, bounded by the member count and their summed vertices and indices.
 * @author Samchon
 */
export interface IAutoMovieMeshAssembly {
  /** The merged rigid mesh, members placed by their transforms and concatenated in declaration order. */
  mesh: IAutoMovieMesh;

  /** One index range per contributing member, in declaration order, covering the whole index buffer without gaps. */
  groups: IAutoMovieMeshGroup[];
}
