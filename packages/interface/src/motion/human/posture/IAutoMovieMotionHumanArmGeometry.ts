import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieJointPose } from "../../../pose/IAutoMovieJointPose";
import type { IAutoMovieJointRotationFrame } from "../../../pose/IAutoMovieJointRotationFrame";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBone } from "../../../skeleton/IAutoMovieBone";
import type { IAutoMovieJointAxes } from "../../../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointConstraint } from "../../../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";

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
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieJointRotationFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanArmGeometry {
  /**
   * What an arm's coordinates are read with, built once per body and side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation constraint: Each joint's range; the elbow's and the wrist's may be absent.
   * @evidence contracts/development/design.md#principled-representation constraint: Each joint's range; the elbow's and the wrist's may be absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, setup); posture/HumanArmFrame.ts (HumanArmFrame.of, setup); posture/HumanArmFrame.ts (HumanArmFrame.built, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.prepare, return); posture/HumanArmGeometry.ts (HumanArmGeometry.rotation, setup); posture/HumanArmGeometry.ts (HumanArmGeometry.clamped, setup).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieJointConstraint, IAutoMovieJointRotationFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISetup {
    /** The borrowed body, unchanged for this setup's operation. */
    body: IAutoMovieMotionHumanBody;
    /** The arm's upper-arm, forearm and hand identities. */
    bones: {
      /** The upper arm. */
      upper: AutoMovieHumanoidBone;
      /** The forearm. */
      lower: AutoMovieHumanoidBone;
      /** The hand. */
      hand: AutoMovieHumanoidBone;
    };
    /** Effective joint ROM; the upper domain requires swing-twist data. */
    constraint: {
      /** The shoulder's range. */
      upper: IAutoMovieJointConstraint;
      /** The elbow's range, or unconstrained. */
      lower: IAutoMovieJointConstraint | null;
      /** The wrist's range, or unconstrained. */
      hand: IAutoMovieJointConstraint | null;
    };
    /** The shoulder's canonical swing-twist frame. */
    joint: IAutoMovieJointRotationFrame;
    /** Current skeleton-declared axes over the canonical family table. */
    axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
    /** Borrowed bone-local rest transforms, translation in metres. */
    rest: {
      /** The upper arm's rest transform. */
      upper: IAutoMovieBone["rest"];
      /** The forearm's rest transform. */
      lower: IAutoMovieBone["rest"];
      /** The hand's rest transform. */
      hand: IAutoMovieBone["rest"];
    };
    /** Whether each of nine coordinates is free: shoulder chart coordinates 0..2, elbow clinical angles 3..5, then wrist clinical angles 6..8. */
    free: boolean[];

    /**
     * Project an actual clinical-degree joint through this unchanged setup;
     * an unconstrained input returns by identity.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States clinical-degree projection, fixed-setup scope and unconstrained input identity.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable field is a type signature; HumanArmGeometry.prepare supplies the shared engine clamp factory's implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared on this callable field; implementation decomposition belongs to its producer and engine clamp owner.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature performs no computation; actual projection and its unchanged-rig premise are documented on the producer and engine clamp owner.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration contains no algorithm; the producer and shared clamp factory document setup and per-joint costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration retains no state; setup-scoped metadata reuse belongs to the supplied clamp implementation.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no resource; the setup producer documents its actual closure and metadata lifetime.
     */
    clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

    /**
     * Read a bone's admitted unit basis at its first conversion's original
     * diagnostic path; failed admission throws and is not remembered.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States unit-basis output, the first conversion's diagnostic path and failed-admission behavior.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable field is a type signature; HumanArmGeometry.prepare owns the lazy admission implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body is declared on this callable field; its producer owns the per-bone map and normalization delegation.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature performs no computation; basis admission and failed-entry handling are implemented by its producer and normalizeJointAxes.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration contains no algorithm; actual one-time admission and map-hit costs belong to the producer.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration retains no state; the supplied reader owns unchanged-setup basis reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature acquires no resource; the setup producer owns and bounds its basis map until release.
     */
    basis: (bone: AutoMovieHumanoidBone, path: string) => IAutoMovieJointAxes;
  }

  /**
   * What the arm is read against at one instant (HumanArmFrame.of).
   * The frame is memoised by base-object identity, upper-arm bone and alone flag.
   * Mutating the base or body does not invalidate that cache: producers and consumers
   * must keep the borrowed input geometry and returned arrays stable during reuse.
   * surface, owners, segments and corners have equal lengths and correspond by index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. resting: The external parts the hand rests on in this frame (the base's `rests`, by frame part index): their pairs with the hand are its contact, not a collision.
   * @evidence contracts/development/design.md#principled-representation tip: Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. corners: Each surface probe's index among its part's own probes, for the audit's reference depth of it. related: Whether two own-body audit parts are one part or share a joint (`AutoMovieMotionHumanAuditTangleModel.IModel.related`); external frame parts lie beyond this table and have no exclusion. resting: The external parts the hand rests on in this frame (the base's `rests`, by frame part index): their pairs with the hand are its contact, not a collision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanArmDifferential.ts (HumanArmDifferential.step, frame); posture/HumanArmFrame.ts (HumanArmFrame.of, return); posture/HumanArmFrame.ts (HumanArmFrame.built, return); posture/HumanArmFrame.ts (HumanArmFrame.built.near, c); posture/HumanArmGeometry.ts (HumanArmGeometry.placed, at); posture/HumanArmJacobian.ts (HumanArmJacobian.columns, at).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion, IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced, IAutoMovieMotionHumanArmGeometry.IShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** The shoulder parent's unit world rotation and world position, metres. */
    parent: {
      /** Its unit world rotation. */
      rotation: IAutoMovieQuaternion;
      /** Its world position, metres. */
      position: IAutoMovieVector3;
    };

    /** Actual full-FK shoulder position for this same parent/rest frame, when already available; otherwise chain placement computes it. */
    shoulder?: IAutoMovieVector3;
    /** Mapped MiddleDistal bone origin in hand-local metres; zero when that distal bone is absent. This is a bone origin, not a measured physical fingertip. */
    tip: IAutoMovieVector3;
    /** Collider probes in the frame of their owning arm segment, metres. */
    surface: IAutoMovieVector3[];
    /** The segment carrying each corresponding surface probe. */
    owners: ("upper" | "lower" | "hand")[];
    /** Broad-phase spheres about each segment's local surface probes. */
    bounds: Record<
      "upper" | "lower" | "hand",
      {
        /** Mean of this owner's surface probes in owner-local metres; zero vector for an empty subset. */
        centre: IAutoMovieVector3;
        /** Maximum distance of an owner-local surface probe from centre, metres; zero for an empty subset. */
        radius: number;
      }
    >;
    /** Each surface probe's own-body audit part index. */
    segments: number[];
    /** Each surface probe's corner index within that part. */
    corners: number[];
    /** Own-body part pairs that share a joint or are the same part. */
    related: boolean[][];

    /** The external parts the hand rests on in this frame (the base's `rests`, by frame part index): their pairs with the hand are its contact, not a collision. */
    resting: ReadonlySet<number>;
    /** Actual arm colliders in their carrying arm segment's local frame. */
    colliders: {
      /** The segment carrying this collider. */
      owner: "upper" | "lower" | "hand";
      /** Its rig bone. */
      bone: AutoMovieHumanoidBone;
      /** Its own-body audit part. */
      part: number;
      /** Its pose relative to the carrying arm segment. */
      pose: IAutoMovieMotionHumanColliders.IPlaced["pose"];
      /** Its borrowed physical shapes. */
      shapes: IAutoMovieMotionHumanColliders.IPlaced["shapes"];
    }[];
    /** Posed obstruction shapes in the world. */
    shapes: IAutoMovieMotionHumanArmGeometry.IShape[];
    /** World collider corners outside the moving arms, including external bodies. */
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
    /** Own-body audit index, followed by external segments in base order. */
    part: number;
    /** The segment's world pose. */
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"];
    /** The borrowed shape in the segment's frame. */
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];
    /** Its bounding sphere's world centre, metres. */
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
