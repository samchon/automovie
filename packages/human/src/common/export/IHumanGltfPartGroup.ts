import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Ordered source members sharing one material and one exact local TRS frame.
 * Geometry stays in this frame through Float32 packing; the glTF node carries
 * its placement. The group borrows parts and transform without modifying them.
 *
 * @evidence contracts/common.md#principled-implementation One retained transform places every member's local buffers without baking translation into Float32 positions.
 * @evidence contracts/common.md#clear-and-simple-design Groups only the members that one glTF primitive and node can represent without changing their frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source part identities remain on the original borrowed declarations.
 * @evidence contracts/common.md#meaningful-documentation States ordering, frame placement and borrowed ownership.
 * @author Samchon
 */
export interface IHumanGltfPartGroup {
  /** Source members in original model order, all using the same material. */
  parts: IAutoMovieModelPart[];

  /** Shared placement in model metres; null retains the identity frame. */
  transform: IAutoMovieTransform | null;
}
