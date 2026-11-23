import type { IAutoMovieMaterialLayer } from "./IAutoMovieMaterialLayer";

/**
 * An ordered layer build-up applied to one host element.
 *
 * Substance, visible finish and assembly carry separate facts. The ordered
 * build-up supplies thickness, reveal depth and layer continuity at junctions;
 * a color alone supplies none of those construction dimensions.
 *
 * The stack is measured, not drawn: {@link axis} names the host-local direction
 * the layers advance along, {@link sense} whether they advance with or against
 * that axis, and {@link offset} where the first layer's outer face sits relative
 * to the host's reference plane. That triple is what lets a build-up be stated
 * once and applied to a wall, a floor, and a soffit without rewriting it for
 * each.
 *
 * The engine ships no build-ups. A layered wall, a tiled floor, and a coffered
 * ceiling are all the same record with the production's own layers in it.
 */
export interface IAutoMovieMaterialAssembly {
  /** Stable assembly id. */
  id: string;

  /** Host-local axis the layers stack along. */
  axis: "x" | "y" | "z";

  /** Whether layer order advances along the axis (`positive`) or against it. */
  sense: "positive" | "negative";

  /**
   * Signed metre offset from the host's reference plane to the outer face of
   * the first layer. Zero puts the stack's first face on the reference plane.
   */
  offset: number;

  /**
   * Whether each end of the stack is exposed to view.
   *
   * `first` is the face the first layer presents, `last` the face the final
   * layer presents. Each terminal layer must be marked as a finish if any face
   * it presents is exposed, and must not be marked if all are concealed. In a
   * single-layer stack, the same finish flag answers for both faces, including
   * one exposed and one concealed face.
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
