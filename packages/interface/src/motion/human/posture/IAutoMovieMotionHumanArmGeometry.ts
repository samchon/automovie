import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBone } from "../../../skeleton/IAutoMovieBone";
import type { IAutoMovieJointAxes } from "../../../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointConstraint } from "../../../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieSwingTwistRange } from "../../../pose/IAutoMovieSwingTwistRange";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An arm's joint-space coordinates and what they place: the shoulder's
 * swing-twist chart (`swingTwistRange.chart`, continuous and one to one over
 * the range, scaled so a unit is near a degree of swing), the elbow's and
 * the wrist's clinical angles; the arm's forward kinematics from its
 * shoulder in a posed frame (`HumanArmFrame`) and its probes; the shapes
 * in its way and the probes' distances to them are `HumanArmShapes`'.
 *
 * @evidence contracts/development/common.md#meaningful-documentation constraint: Each joint's range; the elbow's and the wrist's may be absent. tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it.
 * @evidence contracts/development/design.md#principled-representation constraint: Each joint's range; the elbow's and the wrist's may be absent. tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, setup); posture/HumanArmFrame.ts (HumanArmFrame.of, setup); posture/HumanArmFrame.ts (HumanArmFrame.built, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.prepare, return); posture/HumanArmGeometry.ts (HumanArmGeometry.rotation, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.clamped, setup).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieSwingTwistRange.IJoint identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanArmGeometry {
  /**
   * What an arm's coordinates are read with, built once per body and side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation constraint: Each joint's range; the elbow's and the wrist's may be absent.
   * @evidence contracts/development/design.md#principled-representation constraint: Each joint's range; the elbow's and the wrist's may be absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, setup); posture/HumanArmFrame.ts (HumanArmFrame.of, setup); posture/HumanArmFrame.ts (HumanArmFrame.built, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.prepare, return); posture/HumanArmGeometry.ts (HumanArmGeometry.rotation, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.clamped, setup).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieSwingTwistRange.IJoint identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISetup {
    /** The body. */
    body: IAutoMovieMotionHumanBody;
    /** The arm's three bones. */
    bones: {
      /** The upper arm. */
      upper: AutoMovieHumanoidBone;
      /** The forearm. */
      lower: AutoMovieHumanoidBone;
      /** The hand. */
      hand: AutoMovieHumanoidBone;
    };
    /** Each joint's range; the elbow's and the wrist's may be absent. */
    constraint: {
      /** The shoulder's, with its swing-twist record. */
      upper: IAutoMovieJointConstraint;
      /** The elbow's. */
      lower: IAutoMovieJointConstraint | null;
      /** The wrist's. */
      hand: IAutoMovieJointConstraint | null;
    };
    /** The shoulder's swing-twist frame. */
    joint: IAutoMovieSwingTwistRange.IJoint;
    /** The skeleton's joint axes. */
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
    /** Each bone's rest transform from its parent. */
    rest: {
      /** The upper arm's. */
      upper: IAutoMovieBone["rest"];
      /** The forearm's. */
      lower: IAutoMovieBone["rest"];
      /** The hand's. */
      hand: IAutoMovieBone["rest"];
    };
    /** Whether each of nine coordinates is free: shoulder chart coordinates 0..2, elbow clinical angles 3..5, then wrist clinical angles 6..8. */
    free: boolean[];
  }

  /**
   * What the arm is read against at one instant (HumanArmFrame.of).
   * The frame is memoised by base-object identity, upper-arm bone and alone flag.
   * Mutating the base or body does not invalidate that cache: producers and consumers
   * must keep the borrowed input geometry and returned arrays stable during reuse.
   * surface, owners, segments and corners have equal lengths and correspond by index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion.
   * @evidence contracts/development/design.md#principled-representation tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, frame); posture/HumanArmFrame.ts (HumanArmFrame.of, return); posture/HumanArmFrame.ts (HumanArmFrame.built, return); posture/HumanArmFrame.ts (HumanArmFrame.built.near, c); posture/HumanArmGeometry.ts (HumanArmGeometry.placed, at); posture/HumanArmJacobian.ts (HumanArmJacobian.columns, at).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced, IAutoMovieMotionHumanArmGeometry.IShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** The shoulder's parent's world rotation and position. */
    parent: {
      /** Its world rotation. */
      rotation: IAutoMovieQuaternion;
      /** Its world position. */
      position: IAutoMovieVector3;
    };
    /** Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. */
    tip: IAutoMovieVector3;
    /** The arm's collider probes (the tangle audit's corners), each in the frame of the arm's segment it rides on (`owners`). */
    surface: IAutoMovieVector3[];
    /** The segment of the arm each surface probe rides on. */
    owners: ("upper" | "lower" | "hand")[];
    /** A sphere about each segment's surface probes, in that segment's frame: the broad phase that spares the probes of a segment far from a shape. */
    bounds: Record<
      "upper" | "lower" | "hand",
      {
        /** Mean of this owner's surface probes in owner-local metres; zero vector for an empty subset. */
        centre: IAutoMovieVector3;
        /** Maximum distance of an owner-local surface probe from centre, metres; zero for an empty subset. */
        radius: number;
      }
    >;
    /** The tangle audit's part each surface probe belongs to, by the order the colliders are placed. */
    segments: number[];
    /** Each surface probe's index among its part's own probes, for the audit's reference depth of it. */
    corners: number[];
    /** Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. */
    related: boolean[][];
    /** The arm's own collider segments, each in the frame of the arm's segment it rides on: what another moving arm keeps clear of. */
    colliders: {
      /** The arm's segment it rides on. */
      owner: "upper" | "lower" | "hand";
      /** Its bone. */
      bone: AutoMovieHumanoidBone;
      /** The tangle audit's part it is. */
      part: number;
      /** Its pose in the riding segment's frame. */
      pose: IAutoMovieMotionHumanColliders.IPlaced["pose"];
      /** Its shapes. */
      shapes: IAutoMovieMotionHumanColliders.IPlaced["shapes"];
    }[];
    /** The shapes in the arm's way. */
    shapes: IAutoMovieMotionHumanArmGeometry.IShape[];
    /** The collider probes in the arm's way (the tangle audit's corners), in the world, the solved arms left out: each one's point, frame part, index among that part's probes, and bone. Includes external bodies, whose frame parts follow the body's audit parts and have no own-body reference depth. The audit reads a pair both ways, so these are read inside the arm's own colliders as the arm's are inside the shapes. */
    body: {
      /** Obstacle probe position in world metres. */
      point: IAutoMovieVector3;
      /** Zero-based collider-part index in the combined own-body then external-body audit table. */
      part: number;
      /** Zero-based probe index within that collider part. */
      corner: number;
      /** Bone carrying the obstacle collider probe. */
      bone: AutoMovieHumanoidBone;
    }[];
  }

  /**
   * A shape in an arm's way, placed, with its bounding sphere.
   *
   * @evidence contracts/development/common.md#meaningful-documentation radius: Its bounding sphere's radius, metres.
   * @evidence contracts/development/design.md#principled-representation radius: Its bounding sphere's radius, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmShapes.ts (HumanArmShapes.colliders, return); posture/HumanArmShapes.ts (HumanArmShapes.bounded, return); posture/HumanArmShapes.ts (HumanArmShapes.near, shape); posture/HumanArmShapes.ts (HumanArmShapes.relative, now); posture/HumanArmShapes.ts (HumanArmShapes.relative, next); posture/HumanArmTrajectoryOverlap.ts (HumanArmTrajectoryOverlap.crossing.near, shape).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IShape {
    /** The bone the shape's segment rides on. */
    bone: AutoMovieHumanoidBone;
    /** The frame's collider part: the body's audit indices first, then the external placed segments in their order in the base. */
    part: number;
    /** The segment's world pose. */
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"];
    /** The shape in the segment's frame. */
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];
    /** Its bounding sphere's world centre. */
    centre: IAutoMovieVector3;
    /** Its bounding sphere's radius, metres. */
    radius: number;
  }

  /**
   * The arm placed: its probes and its segments' world frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation probes: Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then optional collider probes with radius 0. With surface=false there are exactly eight probes. shoulder: The shoulder's world point. elbow: The elbow's world point.
   * @evidence contracts/development/design.md#principled-representation probes: Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then optional collider probes with radius 0. With surface=false there are exactly eight probes. shoulder: The shoulder's world point. elbow: The elbow's world point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower.next.placed, return); compose/AutoMovieMotionHumanArmFollow.ts (AutoMovieMotionHumanArmFollow.follower.next.contact, p); posture/HumanArmGeometry.ts (HumanArmGeometry.placed, return); posture/HumanArmJacobian.ts (HumanArmJacobian.columns, placed); posture/HumanArmRefine.ts (certified.inside, return); posture/HumanArmRefine.ts (certified.ends, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlaced {
    /** Each probe's world point and radius: eight axis spheres (two on the upper arm, four on the forearm to the wrist, two on the hand), then optional collider probes with radius 0. With surface=false there are exactly eight probes. */
    probes: readonly (readonly [IAutoMovieVector3, number])[];
    /** The shoulder's world point. */
    shoulder: IAutoMovieVector3;
    /** The elbow's world point. */
    elbow: IAutoMovieVector3;
    /** The upper arm's world rotation. */
    upper: IAutoMovieQuaternion;
    /** The forearm's world rotation. */
    lower: IAutoMovieQuaternion;
    /** The wrist's world point. */
    wrist: IAutoMovieVector3;
    /** The hand's world rotation. */
    hand: IAutoMovieQuaternion;
  }
}
