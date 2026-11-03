import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The ankle region: the talocrural hinge between the shank and the foot, with
 * the subtalar and midfoot joints folded into the foot's bone.
 *
 * The foot leaves its parent sideways, so the cut keeps the shank's plane
 * ({@link AutoMovieHumanHingeBinding.normal}): the foot's own direction would
 * cut the heel off along its length.
 */
export namespace AutoMovieHumanAnkleBinding {
  /** The region of the `Foot` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "ankle",
    bones: /Foot$/,
  };
}
