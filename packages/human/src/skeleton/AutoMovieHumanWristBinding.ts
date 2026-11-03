import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The wrist region: the radiocarpal hinge between the forearm and the hand.
 *
 * The wrist's centre stands at the hand's section centre at the crease. It
 * flexes and extends through 150 degrees and deviates sideways, and the
 * forearm's twist reaches it by a share, so its ramp carries both.
 */
export namespace AutoMovieHumanWristBinding {
  /** The region of the `Hand` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "wrist",
    bones: /Hand$/,
  };
}
