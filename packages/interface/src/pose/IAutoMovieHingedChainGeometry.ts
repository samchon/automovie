import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieChainBone } from "./IAutoMovieChainBone";

/** A hinged chain toward a target. */
export interface IAutoMovieHingedChainGeometry {
  /** Chain-root bone (the shoulder or the hip) resolved under the rig's rest FK. */
  upper: IAutoMovieChainBone;

  /** Mid bone's rest offset from the chain root, in the root's bone frame. */
  midOffset: IAutoMovieVector3;

  /** Mid bone's rest rotation relative to the chain root. */
  midRest: IAutoMovieQuaternion;

  /** Effector's rest offset from the mid joint, in the mid bone's frame. */
  endOffset: IAutoMovieVector3;

  /** The mid joint's flexion axis in the mid bone's frame; any length. */
  hinge: IAutoMovieVector3;

  /** World target the effector should land on. */
  target: IAutoMovieVector3;

  /**
   * The mid joint's legal rotation about `hinge`, radians, `min <= max` and no
   * wider than a full turn; every hinge angle is legal when absent.
   */
  range?: {
    /** Lower rig rotation about hinge, radians. */
    min: number;
    /**
     * Upper rig rotation about hinge, radians; caller ensures min <= max <= min
     * + 2*pi.
     */
    max: number;
  };
}
