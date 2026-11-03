import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The elbow region: the hinge between the humerus and the forearm.
 *
 * The elbow turns from 0 to 147 degrees about the trochlea, folding the
 * brachialis and biceps in front (the cubital fossa) and stretching the skin
 * over the olecranon behind. The ramp's sectors read the thick, opening side
 * behind and the thin, closing side in front separately.
 */
export namespace AutoMovieHumanElbowBinding {
  /** The region of the `LowerArm` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "elbow",
    bones: /LowerArm$/,
  };
}
