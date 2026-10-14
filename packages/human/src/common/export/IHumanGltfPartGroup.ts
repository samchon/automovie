import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Ordered source members sharing one material and one exact local TRS frame.
 * Geometry stays in this frame through Float32 packing; the glTF node carries
 * its placement. The group borrows parts and transform without modifying them.
 *
 *
 * @evidence contracts/common.md#principled-implementation Groups ordered source parts with one material and exact local TRS frame so Float32 packing stays local while the node carries placement.
 * @evidence contracts/common.md#clear-and-simple-design The group borrows source parts and transform; grouping and packing owners remain separate from anatomy or material definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null is the identity frame, and component-distinct rotations remain separate under groupHumanGltfParts rather than approximate frame matching.
 * @evidence contracts/common.md#meaningful-documentation Documents original member order, model-metre placement and borrowed ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This group result implements no grouping algorithm; groupHumanGltfParts chooses and builds groups.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Borrowed members are not a cached export or cross-request coordination mechanism.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the group array while source model owns borrowed members/transform; this type opens no resources.
 *
 *
 * @author Samchon
 */
export interface IHumanGltfPartGroup {
  /** Source members in original model order, all using the same material. */
  parts: IAutoMovieModelPart[];

  /** Shared placement in model metres; null retains the identity frame. */
  transform: IAutoMovieTransform | null;
}
