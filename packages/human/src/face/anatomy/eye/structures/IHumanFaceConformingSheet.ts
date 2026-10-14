import type { IHumanFaceConformingSheetVertex } from "./IHumanFaceConformingSheetVertex";

/**
 * A material sheet triangulated along actual source-host edges. The shell and
 * mapping reader consume this same incidence, including every boundary cut.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual host-edge overlay incidence retains each shared cut and one directed closed boundary.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceConformingSheet produces the same source sheet consumed by tissue shells and mapping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coarse grid reconstruction replaces conformed triangle parents or boundary cuts.
 * @evidence contracts/common.md#meaningful-documentation Fields identify shared vertices, output triangles, per-face host ordinals and ordered boundary edges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceConformingSheet is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceConformingSheet declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceConformingSheet itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceConformingSheet {
  /** Shared overlay vertices, each with its actual material attachment. */
  vertices: IHumanFaceConformingSheetVertex[];

  /** Triangle triples preserving each original grid triangle's orientation. */
  indices: number[];

  /** Actual host triangle ordinal for every emitted triangle. */
  sourceTriangles: number[];

  /** One ordered closed boundary, with direction matching sheet incidence. */
  boundaryEdges: [number, number][];
}
