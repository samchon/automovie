import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import type { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The girdle region: the clavicle's cut from the chest (the sternoclavicular
 * joint). The scapula is folded into this bone and is a separate region once
 * the rig carries it.
 *
 * The clavicle has no line to continue, so its plane is square to itself. It
 * has no flesh of its own either: its capsule starts as a line at the
 * sternoclavicular joint and swells to the arm's girth at the shoulder, so the
 * girdle's skin is the shoulder's.
 */
export namespace AutoMovieHumanGirdleBinding {
  /** The region of the clavicle's `Shoulder` joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "girdle",
    bones: /Shoulder$/,
    radii: (
      input: IAutoMovieHumanBindingRegion.IRadiiInput,
    ): IAutoMovieHumanBindingRegion.IRadii => ({
      radius: input.girth,
      near: AutoMovieHumanLimbCapsule.MINIMUM_RADIUS * input.scale,
      far: input.girth,
    }),
    normal: (_parent: Math3D.Vector, child: Math3D.Vector): Math3D.Vector => child,
  };
}
