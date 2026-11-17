import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieChainBone } from "./IAutoMovieChainBone";

/** Rest-chain geometry and swivel parameterization shared by hingedArmSwivel and hingedArmArticulation. Hinge angles are radians; swivel arguments are degrees. */
export namespace IAutoMovieHingedArmSwivel {
  /**
   * A hinged chain toward a target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives each rest offset's bone frame, world target and radian hinge interval.
   * @evidence contracts/development/design.md#principled-representation branches rejects its small-segment, target-at-root, small-hinge and invariant-span cases with null; callers supply finite geometry, unit rest frames and valid ranges.
   * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel and hingedArmArticulation use this same prepared rest-chain geometry for span branches and swivel posing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The contract reuses IAutoMovieChainBone and keeps clinical ROM scoring out of geometric branch construction.
   */
  export interface IChain {
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

    /** The mid joint's legal rotation about `hinge`, radians, `min <= max` and no wider than a full turn; every hinge angle is legal when absent. */
    range?: {
      /** Lower rig rotation about hinge, radians. */
      min: number;
      /** Upper rig rotation about hinge, radians; caller ensures min <= max <= min + 2*pi. */
      max: number;
    };
  }

  /**
   * One bend branch after the hinge's range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the allowed hinge angle and unsigned radial shortfall.
   * @evidence contracts/development/design.md#principled-representation theta is radians and shortfall nonnegative metres between attained span and requested radius; legal reachable branches report zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel.branches returns these stops for hinge-limit and geometric-shell selection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero shortfall concerns radial geometry only and does not certify all joints' ROM or effector orientation.
   */
  export interface IStop {
    /** The hinge angle, radians, inside the range when one is given. */
    theta: number;

    /** Metres between the chain's span at `theta` and the target distance; `0` for a branch that reaches the distance inside the range. */
    shortfall: number;
  }

  /**
   * The chain posed at a hinge angle, for any swivel: the mid joint turned by
   * the hinge angle, the root aimed so the chain's root-to-effector line
   * points at the target (`aimRotation`), then turned about that line by the
   * swivel in degrees. The returned closure retains the precomputed aim and
   * hinge quaternion. Each evaluation makes a new upper rotation but shares
   * its lower quaternion with other evaluations, so treat both as read-only.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes degree swivel input, bone-local output and shared lower quaternion ownership.
   * @evidence contracts/development/design.md#principled-representation For a fixed radian hinge branch, any degree swivel preserves effector radius; unit quaternions express root and mid articulations in their respective rest frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface hingedArmSwivel.pose returns this closure, retaining its precomputed aim and lower rotation for repeated candidate scoring.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader makes a fresh upper quaternion but shares lower, so it promises no deep copy of each sample.
   */
  export type IPoseResult = (swivel: number) => {
    /** Root articulation in its bone-local rest frame; unit quaternion. */
    upper: IAutoMovieQuaternion;
    /** Mid articulation about its bone-local hinge; unit quaternion shared across this closure's samples. */
    lower: IAutoMovieQuaternion;
  };
}
