import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanCrotchBinding } from "./AutoMovieHumanCrotchBinding";
import { AutoMovieHumanGroinBinding } from "./AutoMovieHumanGroinBinding";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The hip region: the ball-and-socket cut between the pelvis and the thigh.
 *
 * The crease runs from the iliac spine to the pubis, high at the front and low
 * behind, so the plane leans from the thigh's direction toward the front and
 * toward the outside. The hip also holds what only the thigh's limb can: its
 * share's fall at the midline ({@link AutoMovieHumanGroinBinding}) and the
 * plane that releases it below the crotch ({@link AutoMovieHumanCrotchBinding}).
 * The gluteal skin is the hip's posterior sectors for now, with no centre of
 * its own.
 */
export namespace AutoMovieHumanHipBinding {
  /** Lean of the hip's plane toward the front: the crease runs high there and low behind (convention). */
  export const HIP_FORWARD: number = 0.35;

  /** Lean of the hip's plane outward: the crease runs from the iliac spine to the pubis (convention). */
  export const HIP_LATERAL: number = 0.7;

  /** The region of the `UpperLeg` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "hip",
    bones: /UpperLeg$/,
    normal: (
      _parent: Math3D.Vector,
      child: Math3D.Vector,
      side: number,
    ): Math3D.Vector =>
      Math3D.unit(
        Math3D.add(
          Math3D.add(child, Math3D.times([1, 0, 0], HIP_FORWARD)),
          Math3D.times([0, 0, 1], side * HIP_LATERAL),
        ),
      ),
    attach: (
      limb: IAutoMovieHumanBindingLimb,
      direction: Math3D.Vector,
      reach: number,
    ): void => {
      limb.midline = AutoMovieHumanGroinBinding.width(limb.from);
      limb.clear = AutoMovieHumanCrotchBinding.start(limb.from, direction, reach);
    },
  };
}
