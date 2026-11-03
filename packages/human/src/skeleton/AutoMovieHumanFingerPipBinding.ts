import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * A finger's proximal interphalangeal region: the hinge between its proximal
 * and middle phalanges, flexing through 90 degrees. The four fingers share the
 * rule and differ by their own joint centre and girth, 2:1:1 phalanx split
 * (convention, Bridgman 1920).
 */
export namespace AutoMovieHumanFingerPipBinding {
  /** The region of the four fingers' `Intermediate` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "fingerPip",
    bones: /(Index|Middle|Ring|Little)Intermediate$/,
  };
}
