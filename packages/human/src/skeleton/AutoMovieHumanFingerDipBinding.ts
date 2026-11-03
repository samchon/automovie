import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * A finger's distal interphalangeal region: the hinge between its middle and
 * distal phalanges, flexing through 65 degrees to the fingertip. The four
 * fingers share the rule and differ by their own joint centre and girth.
 */
export namespace AutoMovieHumanFingerDipBinding {
  /** The region of the four fingers' `Distal` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "fingerDip",
    bones: /(Index|Middle|Ring|Little)Distal$/,
  };
}
