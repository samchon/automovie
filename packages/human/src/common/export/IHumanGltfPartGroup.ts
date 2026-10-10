import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Ordered source members sharing one material and one exact local TRS frame.
 * Geometry stays in this frame through Float32 packing; the glTF node carries
 * its placement. The group borrows parts and transform without modifying them.
 *
 * @author Samchon
 */
export interface IHumanGltfPartGroup {
  /** Source members in original model order, all using the same material. */
  parts: IAutoMovieModelPart[];

  /** Shared placement in model metres; null retains the identity frame. */
  transform: IAutoMovieTransform | null;
}
