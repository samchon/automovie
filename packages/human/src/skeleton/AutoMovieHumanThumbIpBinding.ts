import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The thumb's interphalangeal region: the one hinge between the thumb's two
 * phalanges, halfway along the thumb from its crease to its tip (convention).
 * It flexes through 80 degrees.
 */
export namespace AutoMovieHumanThumbIpBinding {
  /** The region of the `ThumbDistal` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "thumbIp",
    bones: /ThumbDistal$/,
  };
}
