import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The deltoid region: the cap of muscle that wraps the glenohumeral joint.
 *
 * The deltoid arises from the clavicle, the acromion and the scapular spine and
 * inserts at mid-humerus, so its skin rides the arm. The arm's cut therefore
 * lies medial of the joint's centre, over the deltoid's origin, and the skin
 * lateral to it belongs to the arm.
 */
export namespace AutoMovieHumanDeltoidBinding {
  /** How far medial of the shoulder's centre the arm's cut lies, in skin depths (convention, Gray 1918: the deltoid's origin spans the lateral clavicle and the acromion). */
  export const DELTOID: number = 0.6;

  /**
   * Where the arm's cut lies over the deltoid.
   *
   * @param at The glenohumeral joint's centre, metres.
   * @param normal The cut's unit normal toward the arm.
   * @param reach The skin depth the cut is sized by, metres.
   * @returns The point on the cut, medial of the joint.
   */
  export function origin(
    at: Math3D.Vector,
    normal: Math3D.Vector,
    reach: number,
  ): Math3D.Vector {
    return Math3D.sub(at, Math3D.times(normal, DELTOID * reach));
  }
}
