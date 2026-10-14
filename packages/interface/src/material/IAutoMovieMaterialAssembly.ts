import { IAutoMovieMaterialLayer } from "./IAutoMovieMaterialLayer";

/**
 * An ordered layer build-up applied to one host element.
 *
 * Substance, visible finish and assembly carry separate facts. The ordered build-up supplies thickness, reveal depth and layer continuity at junctions; a color alone supplies none of those construction dimensions.
 *
 * The stack is measured, not drawn: {@link axis} names the host-local direction the layers advance along, {@link sense} whether they advance with or against that axis, and {@link offset} where the first layer's outer face sits relative to the host's reference plane. That triple is what lets a build-up be stated once and applied to a wall, a floor, and a soffit without rewriting it for each.
 *
 * The engine ships no build-ups. A layered wall, a tiled floor, and a coffered ceiling are all the same record with the production's own layers in it.
 *
 * @evidence contracts/common.md#principled-implementation Ordered layers advance on one host-local axis with a signed offset and sense; `resolveAutoMovieMaterialAssembly` validates the build-up before accumulating thickness into layer placements, preserving the stated order.
 * @evidence contracts/common.md#clear-and-simple-design Assembly orientation and exposed ends live once around the ordered layer list, while each layer owns substance, finish and wrapping; the host owns the dimension the validator compares against the sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No wall or material catalogue is embedded; exposed-face finish and wrapping rules apply to authored stacks, including the single-layer case whose two faces share one layer.
 * @evidence contracts/common.md#meaningful-documentation Gives local-axis, sense and metre-offset semantics, end exposure rules and nonempty layer ordering, including who supplies production-specific build-ups.
 * @author Samchon
 */
export interface IAutoMovieMaterialAssembly {
  /** Stable assembly id. */
  id: string;

  /** Host-local axis the layers stack along. */
  axis: "x" | "y" | "z";

  /** Whether layer order advances along the axis (`positive`) or against it. */
  sense: "positive" | "negative";

  /**
   * Signed metre offset from the host's reference plane to the outer face of the first layer. Zero puts the stack's first face on the reference plane.
   */
  offset: number;

  /**
   * Whether each end of the stack is exposed to view.
   *
   * `first` is the face the first layer presents, `last` the face the final layer presents. An exposed end must be finished and a concealed end must not be, which is how a missing finish and a wasted one are both caught.
   */
  faces: {
    /** Exposure of the face the first layer presents. */
    first: "exposed" | "concealed";

    /** Exposure of the face the last layer presents. */
    last: "exposed" | "concealed";
  };

  /** Ordered layers, the first one at the reference face. Never empty. */
  layers: IAutoMovieMaterialLayer[];
}
