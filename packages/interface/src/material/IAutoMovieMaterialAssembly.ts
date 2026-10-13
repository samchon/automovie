import { IAutoMovieMaterialLayer } from "./IAutoMovieMaterialLayer";

/**
 * An ordered layer build-up applied to one host element.
 *
 * This is the third of the three material records the requirement separates:
 * the substance, the visible surface, and the assembly. It exists because a
 * single colour cannot say that a wall is 300 mm of structure, cavity,
 * insulation, barrier, and board, and because that build-up — not the colour —
 * is what sets the wall's overall thickness, the depth of a window reveal, and
 * which layers survive a junction with the next wall.
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
   * layer presents. An exposed end must be finished and a concealed end must
   * not be, which is how a missing finish and a wasted one are both caught.
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
