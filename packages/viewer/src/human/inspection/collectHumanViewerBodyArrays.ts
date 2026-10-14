import type { ConnectedBodyPart } from "@automovie/human/body/runtime/ConnectedBodyPart";

/**
 * Borrow the retained numerical arrays of each body/person part for resident byte accounting. Missing optional channels stay absent; referenced arrays are not copied or disposed by this collector.
 *
 * @evidence contracts/common.md#principled-implementation Each retained part contributes its actual mesh positions, normals, indices, UVs, colors and optional physical-vertex mapping to the byte accountant.
 * @evidence contracts/common.md#clear-and-simple-design This projection identifies body-runtime arrays while measureHumanViewerResidentBytes owns repeated-reference byte weighting without identity deduplication or a physical-memory measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Accounting uses retained arrays rather than estimating from triangle counts or substituting physical GPU memory claims.
 * @evidence contracts/common.md#meaningful-documentation Documentation defines borrowed-array ownership, optional absence and the resident-accounting purpose.
 * @evidence contracts/performance.md#efficient-algorithms P parts contribute a fixed six array references each in O(P) time and auxiliary references; typed-array elements and buffers are not duplicated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The collector reflects the supplied resident's current retained parts and owns no cross-resident array cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned references remain resident-owned and are consumed for byte counting; this function acquires no buffer or disposal responsibility.
 */
export function collectHumanViewerBodyArrays(
  parts: readonly ConnectedBodyPart[],
): (ArrayLike<number | null> | null | undefined)[] {
  return parts.flatMap(
    (
      part: ConnectedBodyPart,
    ): (ArrayLike<number | null> | null | undefined)[] => {
      const mesh: ConnectedBodyPart["geometry"]["mesh"] = part.geometry.mesh;
      return [
        mesh.positions,
        mesh.normals,
        mesh.indices,
        mesh.uvs,
        mesh.colors,
        mesh.physicalVertices?.vertices,
      ];
    },
  );
}
