import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalJointAxis } from "./IAutoMoviePhysicalJointAxis";

/**
 * A fixed or angularly limited connection between two rigid segments.
 *
 * Parent and child frames describe the same neutral anchor in their respective bone frames. validatePhysicalProfile checks that anchors coincide within 1e-8 metres and that joints form one connected acyclic tree with one parent per nonroot segment. An empty axes list is fixed; translations and all unlisted angular axes are locked. An optional swing-twist limit further bounds the joint's rotation in the clinical chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A fixed or angularly limited connection between two rigid segments, with an optional clinical swing-twist limit.
 * @evidence contracts/development/design.md#principled-representation Parent and child frames describe the same neutral anchor in their respective bone frames; angles are radians in the joint frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface validatePhysicalProfile checks anchors and the tree; the engine's solver enforces the axes and the swing-twist limit; the motions human model fills the swing-twist limit from the rig's clinical ranges.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty axes list is fixed; translations and all unlisted angular axes are locked. The swing-twist limit is one record whose ranges are runtime-validated.
 */
export interface IAutoMoviePhysicalJoint {
  /** Unique profile-local id. */
  id: string;

  /** Parent segment bone. */
  parent: string;

  /** Child segment bone. */
  child: string;

  /** Joint frame in the parent bone's local frame. */
  parentFrame: IAutoMovieRigidTransform;

  /** Same joint frame in the child bone's local frame. */
  childFrame: IAutoMovieRigidTransform;

  /** Distinct free angular axes; all translations and unlisted axes are locked. */
  axes: IAutoMoviePhysicalJointAxis[];

  /** Optional clinical swing-twist limit on the joint frame's relative rotation; absent, only the axes bound it. */
  swingTwist?: IAutoMoviePhysicalJoint.ISwingTwist;
}

/** Companion types of {@link IAutoMoviePhysicalJoint}: the swing-twist limit and its angle ranges. */
export namespace IAutoMoviePhysicalJoint {
  /**
   * A swing-twist limit (Baerlocher and Boulic 2001, "Parametrization and
   * range of motion of the ball-and-socket joint"): the relative rotation
   * splits into a twist about `twistAxis` followed by a swing about an axis
   * perpendicular to it; the twist angle lies within `twist`, and the swing
   * rotation vector's components about `swingAxis` and about
   * `twistAxis x swingAxis` lie within the elliptic cone whose semi-axes, in
   * each quadrant, are the matching ends of `swingU` and `swingV`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the decomposition and the cone.
   * @evidence contracts/development/design.md#principled-representation Unit joint-frame axes and radian ranges; a range minimum is at most zero and its maximum at least zero.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The engine's swing-twist limit reads every member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Asymmetric ranges per swing axis describe the quadrant ellipses directly instead of a separate shape per quadrant.
   */
  export interface ISwingTwist {
    /** Unit twist axis in the joint frame: the child bone's long axis. */
    twistAxis: IAutoMovieVector3;

    /** Unit first swing axis in the joint frame, perpendicular to the twist axis. */
    swingAxis: IAutoMovieVector3;

    /** Twist angle range, radians. */
    twist: IRange;

    /** Swing range about the first swing axis, radians. */
    swingU: IRange;

    /** Swing range about the second swing axis, `twistAxis x swingAxis`, radians. */
    swingV: IRange;
  }

  /**
   * An angle range in radians.
   *
   * @evidence contracts/development/common.md#meaningful-documentation An angle range in radians.
   * @evidence contracts/development/design.md#principled-representation Radians; minimum at most maximum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The swing-twist limit's three ranges.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Order is validated at runtime.
   */
  export interface IRange {
    /** Least angle, radians. */
    minimum: number;

    /** Greatest angle, radians. */
    maximum: number;
  }
}
