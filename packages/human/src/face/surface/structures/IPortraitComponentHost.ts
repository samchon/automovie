/**
 * The substrate a replaceable anatomical component fits. Landmark identities belong to the subject's socket binding, never to the generic host assembler.
 *
 * @evidence contracts/common.md#principled-implementation Shared source XYZ and original oriented triangle ordinals provide the unchanged substrate for all component plans; an explicit dimensionless view direction supplies depth fitting.
 * @evidence contracts/common.md#clear-and-simple-design The host contains only geometry and view direction; per-component landmark/socket identity belongs to its constructor and bindings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source coordinates are not universally clinical measurements, and a view direction alone establishes neither measured gaze nor reconstructed globe anatomy.
 * @evidence contracts/common.md#meaningful-documentation Members specify construction millimetres, Y-up/Z-anterior frame, removable face ordinals and dimensionless depth direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Geometry and view-direction arrays perform no fitting or triangle processing at the type level.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This host layout implements no source-result cache or component request coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host type allocates no position arrays or observer task; the source producer owns actual geometry.
 * @author Samchon
 */
export interface IPortraitComponentHost {
  /**
   * Original source control positions, including any non-skin gaze markers, in construction millimetres with +Y up and +Z anterior.
   */
  positions: number[][];

  /** Original oriented skin triangles; their ordinals identify removable faces. */
  indices: number[];

  /** Source observation-depth direction for eye fitting; dimensionless, with no clinical gaze guarantee. */
  viewRay: number[];
}
