import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePreparedJointRotationFrame } from "../pose/IAutoMoviePreparedJointRotationFrame";
import type { IAutoMovieJointConstraint } from "../skeleton/IAutoMovieJointConstraint";
import type { IAutoMoviePhysicalJointAxis } from "./IAutoMoviePhysicalJointAxis";

/**
 * A fixed or angularly limited connection between two rigid segments.
 *
 * Parent and child frames describe the same neutral anchor in their respective
 * bone frames. validatePhysicalProfile checks that anchors coincide within 1e-8
 * metres and that joints form one connected acyclic tree with one parent per
 * nonroot segment. An empty axes list is fixed; translations and all unlisted
 * angular axes are locked. An optional swing-twist limit further bounds the
 * joint's rotation in the clinical chart; an anatomical gate (`range`) bounds
 * it in place of the axes.
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

  /**
   * The joint's chart: the three joint-frame axes in the order the relative
   * rotation composes, `q = R_order[0](a) R_order[1](b) R_order[2](c)`, each
   * axis's angle its coordinate (an intrinsic Tait-Bryan chart, the rig's own
   * composition of its clinical axes). A locked axis's angle is held at zero.
   * Absent, each free axis's coordinate is `2 atan(q.axis / w)` independently.
   */
  order?: IAutoMoviePhysicalJointAxis["axis"][];

  /**
   * Optional clinical swing-twist limit on the joint frame's relative rotation;
   * absent, only the axes bound it.
   */
  swingTwist?: IAutoMoviePhysicalJoint.ISwingTwist;

  /**
   * The anatomical range of a ball joint gated by swing and twist (a shoulder,
   * a thumb's base; `IAutoMovieJointConstraint.swingTwist`): the one set the
   * joint admits and is measured against, in place of its axes' box, read on
   * the bone's own swing-twist frame as the range-of-motion gate reads it. Its
   * axes then carry only its motors. Absent, the axes and the chart bound the
   * joint.
   */
  range?: IAutoMoviePhysicalJoint.IGate;
}

/**
 * Companion types of {@link IAutoMoviePhysicalJoint}: the swing-twist limit and
 * its angle ranges.
 */
export namespace IAutoMoviePhysicalJoint {
  /**
   * A ball joint's swing-twist range, as the range-of-motion gate reads it: the
   * bone's rest-relative rotation in its own frame is the joint frame's
   * relative rotation carried by `basis`, `basis q_joint basis^-1`.
   */
  export interface IGate {
    /** The bone's constraint, with its `swingTwist` gate. */
    constraint: IAutoMovieJointConstraint;

    /** The bone's swing-twist frame: its clinical axes and rest frame. */
    frame: IAutoMoviePreparedJointRotationFrame;

    /** The joint frame's rotation into the bone's own frame. */
    basis: IAutoMovieRigidTransform["rotation"];
  }

  /**
   * A swing-twist limit (Baerlocher and Boulic 2001, "Parametrization and range
   * of motion of the ball-and-socket joint"): the relative rotation splits into
   * a twist about `twistAxis` followed by a swing about an axis perpendicular
   * to it; the twist angle lies within `twist`, and the swing rotation vector's
   * components about `swingAxis` and about `twistAxis x swingAxis` lie within
   * the elliptic cone whose semi-axes, in each quadrant, are the matching ends
   * of `swingU` and `swingV`.
   */
  export interface ISwingTwist {
    /** Unit twist axis in the joint frame: the child bone's long axis. */
    twistAxis: IAutoMovieVector3;

    /**
     * Unit first swing axis in the joint frame, perpendicular to the twist
     * axis.
     */
    swingAxis: IAutoMovieVector3;

    /** Twist angle range, radians. */
    twist: IRange;

    /** Swing range about the first swing axis, radians. */
    swingU: IRange;

    /**
     * Swing range about the second swing axis, `twistAxis x swingAxis`,
     * radians.
     */
    swingV: IRange;
  }

  /** An angle range in radians. */
  export interface IRange {
    /** Least angle, radians. */
    minimum: number;

    /** Greatest angle, radians. */
    maximum: number;
  }
}
