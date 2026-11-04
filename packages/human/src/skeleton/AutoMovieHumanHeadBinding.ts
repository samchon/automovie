import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The head region: the head against the neck.
 *
 * The head is a ball from the chin to the crown. A capsule from the skull's
 * base would reach down the neck and leave the chin to it. The ball and the
 * neck's capsule compete for the skin between them on the quintic step, over
 * the neck's own depth at its middle, so the face above the neck stays the
 * head's whole and only the skin down the neck passes to the neck. The head
 * has no cut of its own: its skin is the share the contest leaves it.
 */
export namespace AutoMovieHumanHeadBinding {
  /** The region of the `head` joint: no cut. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "head",
    bones: /^head$/,
    plane: (): null => null,
  };

  /**
   * Make a limb the head's ball and set it against the neck.
   *
   * @param head The head limb; its capsule and rivals are replaced.
   * @param neck The neck limb.
   * @param chin The jaw's end at the chin, metres.
   * @param crown The head's crown, metres.
   * @param skin Skin samples, metres, three numbers each.
   */
  export function ball(
    head: IAutoMovieHumanBindingLimb,
    neck: IAutoMovieHumanBindingLimb,
    chin: Math3D.Vector,
    crown: Math3D.Vector,
    skin: Float64Array,
  ): void {
    head.from = Math3D.times(Math3D.add(chin, crown), 0.5);
    head.to = head.from;
    head.near = Math.hypot(...Math3D.sub(crown, chin)) / 2;
    head.far = head.near;
    head.rivals = [neck];
    head.own = [head];

    // The contest's half is the neck's skin depth at the middle of its
    // segment, where the neck is thinnest.
    head.contest = AutoMovieHumanLimbCapsule.depth(
      Math3D.times(Math3D.add(neck.from, neck.to), 0.5),
      skin,
    );
  }
}
