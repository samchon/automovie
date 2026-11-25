import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieJointPose } from "../../../pose/IAutoMovieJointPose";
import type { IAutoMoviePreparedJointRotationFrame } from "../../../pose/IAutoMoviePreparedJointRotationFrame";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieBone } from "../../../skeleton/IAutoMovieBone";
import type { IAutoMovieJointAxes } from "../../../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieJointConstraint } from "../../../skeleton/IAutoMovieJointConstraint";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanColliders } from "./IAutoMovieMotionHumanColliders";

/**
 * An arm's joint-space coordinates and what they place: the shoulder's
 * swing-twist chart (`swingTwistRange.chart`, continuous and one to one over
 * the range, scaled so a unit is near a degree of swing), the elbow's and the
 * wrist's clinical angles; the arm's forward kinematics from its shoulder in a
 * posed frame (`HumanArmFrame`) and its probes; the shapes in its way and the
 * probes' distances to them are `HumanArmShapes`'.
 */
export namespace IAutoMovieMotionHumanArmGeometry {
  /** What an arm's coordinates are read with, built once per body and side. */
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
    joint: IAutoMoviePreparedJointRotationFrame;
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
    /**
     * Whether each of nine coordinates is free: shoulder chart coordinates
     * 0..2, elbow clinical angles 3..5, then wrist clinical angles 6..8.
     */
    free: boolean[];

    /**
     * Project an actual clinical-degree joint through this unchanged setup; an
     * unconstrained input returns by identity.
     */
    clamp: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

    /**
     * Read a bone's admitted unit basis at its first conversion's original
     * diagnostic path; failed admission throws and is not remembered.
     */
    basis: (bone: AutoMovieHumanoidBone, path: string) => IAutoMovieJointAxes;
  }

  /**
   * The arm's posed geometry and obstacles prepared for one instant
   * (`HumanArmFrame`). The trajectory retains this frame for its solve.
   * `surface`, `owners`, `segments` and `corners` describe the same probes
   * in matching index order.
   */
  export interface IFrame {
    /** The shoulder parent's unit world rotation and world position, metres. */
    parent: {
      /** Its unit world rotation. */
      rotation: IAutoMovieQuaternion;
      /** Its world position, metres. */
      position: IAutoMovieVector3;
    };

    /**
     * Actual full-FK shoulder position for this same parent/rest frame, when
     * already available; otherwise chain placement computes it.
     */
    shoulder?: IAutoMovieVector3;
    /**
     * Mapped MiddleDistal bone origin in hand-local metres; zero when that
     * distal bone is absent. This is a bone origin, not a measured physical
     * fingertip.
     */
    tip: IAutoMovieVector3;
    /** Collider probes in the frame of their owning arm segment, metres. */
    surface: IAutoMovieVector3[];
    /** The segment carrying each corresponding surface probe. */
    owners: ("upper" | "lower" | "hand")[];
    /** Broad-phase spheres about each segment's local surface probes. */
    bounds: Record<
      "upper" | "lower" | "hand",
      {
        /**
         * Mean of this owner's surface probes in owner-local metres; zero
         * vector for an empty subset.
         */
        centre: IAutoMovieVector3;
        /**
         * Maximum distance of an owner-local surface probe from centre, metres;
         * zero for an empty subset.
         */
        radius: number;
      }
    >;
    /** Each surface probe's own-body audit part index. */
    segments: number[];
    /** Each surface probe's corner index within that part. */
    corners: number[];
    /** Own-body part pairs that share a joint or are the same part. */
    related: boolean[][];

    /**
     * The external parts the hand rests on in this frame (the base's `rests`,
     * by frame part index): their pairs with the hand are its contact, not a
     * collision.
     */
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
    /**
     * World collider corners outside the moving arms, including external
     * bodies.
     */
    body: {
      /** Obstacle probe position in world metres. */
      point: IAutoMovieVector3;
      /**
       * Zero-based collider-part index in the combined own-body then
       * external-body audit table.
       */
      part: number;
      /** Zero-based probe index within that collider part. */
      corner: number;
      /** Bone carrying the obstacle collider probe. */
      bone: Segment;
    }[];
  }

  /** A shape in an arm's way, placed, with its bounding sphere. */
  export interface IShape {
    /**
     * The bone the shape's segment rides on, or the subject and part of a
     * segment no human body carries.
     */
    bone: Segment;
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
    /**
     * Prepared bounds of a static hull in its own frame, metres. The six
     * values run from the least x, y and z to the greatest x, y and z.
     */
    readonly hullBox?: Readonly<Float64Array>;
  }

  /** The arm placed: its probes and its segments' world frames. */
  export interface IPlaced {
    /**
     * Each probe's world point and radius: eight axis spheres (two on the upper
     * arm, four on the forearm to the wrist, two on the hand), then optional
     * collider probes with radius 0. With surface=false there are exactly eight
     * probes.
     */
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

  /**
   * What carries an obstacle shape: a rig bone, or a subject and part
   * (`subject:part`) of a segment no human body carries
   * (`IAutoMovieMotionHumanColliders.IExternal`).
   */
  export type Segment = AutoMovieHumanoidBone | `${string}:${string}`;
}
