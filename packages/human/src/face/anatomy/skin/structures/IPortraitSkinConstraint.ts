/**
 * A part's exact skin attachment, in the host's millimetre coordinate frame.
 * The host spreads its displacement through neighbouring skin within reach.
 *
 * @evidence contracts/common.md#principled-implementation A native shared vertex and millimetre target pin an attachment; blendPortraitSkin propagates displacement by distances along host edges and solves the supported constrained skin system.
 * @evidence contracts/common.md#clear-and-simple-design The attachment owner supplies vertex, target and reach; the shared skin operation owns graph construction and interpolation rather than exposing a separate public sculpting surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vertex identity must belong to the actual host and reach is a finite nonnegative edge-path extent; it does not certify continuous surface geodesics or anatomical deformation limits.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish retained native identity, requested physical XYZ and the original-host distance convention used for surrounding adaptation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This constraint record implements no traversal or solve; blendPortraitSkin owns their mesh-dependent costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type coordinates no requests; the consuming blend owns its shared graph and constraint assembly.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; constraint arrays and generated solver buffers belong to the assembly operation.
 *
 * @author Samchon
 */
export interface IPortraitSkinConstraint {
  /** Existing host vertex identity, retained through assembly and subdivision. */
  vertex: number;

  /** Requested XYZ position of that shared attachment vertex, in millimetres. */
  target: number[];

  /** Finite nonnegative reach along original host edges, in millimetres. */
  reach: number;
}
