import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanDeltoidBinding } from "./AutoMovieHumanDeltoidBinding";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The glenohumeral region: the cut between the clavicle and the humerus.
 *
 * The shoulder turns further than any hinge, so its least half is wider
 * ({@link SHOULDER_CUT}). The plane lies where the deltoid begins
 * ({@link AutoMovieHumanDeltoidBinding}); the arm's band against the trunk is
 * the axilla's ({@link AutoMovieHumanAxillaBinding}).
 */
export namespace AutoMovieHumanShoulderBinding {
  /** Least half of the shoulder's cut, in skin depths: it turns further than any hinge (convention). */
  export const SHOULDER_CUT: number = 2;

  /** The region of the `UpperArm` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "shoulder",
    bones: /UpperArm$/,
    plane: (
      at: Math3D.Vector,
      normal: Math3D.Vector,
      reach: number,
    ): IAutoMovieHumanBindingPlane => ({
      at: AutoMovieHumanDeltoidBinding.origin(at, normal, reach),
      normal,
      half: SHOULDER_CUT * reach,
      step: AutoMovieHumanSkinStep.slide,
    }),
  };
}
