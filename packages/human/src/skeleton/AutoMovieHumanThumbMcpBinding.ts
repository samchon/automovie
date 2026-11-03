import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The thumb's metacarpophalangeal region: the hinge between the thumb's
 * metacarpal and its proximal phalanx, at the thumb's crease.
 *
 * The thumb's skin begins here, as a digit of its own: its chain starts at this
 * crease and its first section is round. The joint flexes through 50 degrees.
 */
export namespace AutoMovieHumanThumbMcpBinding {
  /** The region of the `ThumbProximal` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "thumbMcp",
    bones: /ThumbProximal$/,
  };
}
