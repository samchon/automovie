import type { IHumanFaceIrisGlobeTriangle } from "./IHumanFaceIrisGlobeTriangle";

/**
 * One eye's textured globe on the neutral basis.
 *
 * The globe is the first textured, UV-bearing region whose triangles are fully
 * bound to the eye owner (weight one on all three vertices). `texture` is the
 * source material's texture string, admitted as an embedded PNG by downstream
 * preparation, `triangles` those bound triangles and
 * `positions` the distinct neutral positions of all bound vertices appearing
 * in the selected region, including bound corners of mixed-owner triangles.
 *
 *
 * @evidence contracts/common.md#principled-implementation The first weight-one eye-owned textured UV region supplies neutral bound triangles and unique positions.
 * @evidence contracts/common.md#clear-and-simple-design findHumanFaceIrisGlobe owns source selection; preparation owns PNG decoding and geometry-only disc location.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Owner attachment rather than asset naming defines the selected population; embedded format admission remains downstream.
 * @evidence contracts/common.md#meaningful-documentation Fields identify eye/material, embedded texture, metre neutral positions and complete region triangle correspondence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFaceIrisGlobe is an erased source contract; its concrete producing/consuming operations own algorithms and actual population scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFaceIrisGlobe declares correspondence and ownership only; its concrete owner decides copied state and reuse equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFaceIrisGlobe itself acquires no buffer, handle or task; concrete builders/readers own referenced array and callback lifetimes.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisGlobe {
  /** Eye owner the globe is bound to. */
  eye: string;

  /** ID of the globe region's material. */
  material: string;

  /** Source base colour texture string; preparation admits only embedded PNG data. */
  texture: string;

  /** Region triangles fully bound to the eye owner. */
  triangles: IHumanFaceIrisGlobeTriangle[];

  /** Distinct neutral positions of selected-region bound vertices, including corners of mixed-owner triangles, metres. */
  positions: [number, number, number][];
}
