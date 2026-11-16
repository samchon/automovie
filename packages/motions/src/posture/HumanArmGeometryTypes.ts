import type { swingTwistRange } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanColliders } from "./HumanColliders";

/**
 * The rig, frame and placed-geometry records shared by arm trajectories.
 * HumanArmGeometry keeps aliases for its existing public type names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines each record's coordinate frame, units, shape/probe ordering and borrowed ownership, including the setup's unchanged-operation scope.
 * @evidence contracts/development/design.md#principled-representation Separates fixed rig metadata, per-instant collision geometry and resulting FK points, with world metres, clinical degrees and unit quaternion rotations imported from their existing owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These five records are the existing geometry, trajectory, Jacobian and clearance consumers' shared data; HumanArmGeometry aliases keep their established names without duplicating their shapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new motion or collider representation is introduced; parallel probe arrays and nine-coordinate arrays still require caller-consistent ordering and sizes.
 */
export namespace HumanArmGeometryTypes {
  /**
   * A posed obstruction and its broad-phase bounding sphere, in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each shape's bone, audit ordering, world frame, collider ownership and bounding-sphere units.
   * @evidence contracts/development/design.md#principled-representation Pairs the actual profile shape and posed frame with a world bounding sphere that permits conservative distance rejection; positive radii and consistent bounds remain producer premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanArmShapes produces these fields for frame construction, distance checks and trajectory collision costs, borrowing HumanColliders' existing shape and pose types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The broad phase supplements the actual shape instead of replacing it, and part indices retain own-body/external ordering rather than naming fixtures.
   */
  export interface IShape {
    /** The bone the shape's segment rides on. */
    bone: AutoMovieHumanoidBone;

    /** Own-body audit index, followed by external segments in base order. */
    part: number;

    /** The segment's world pose. */
    pose: HumanColliders.IPlaced["pose"];

    /** The borrowed shape in the segment's frame. */
    shape: HumanColliders.IPlaced["shapes"][number];

    /** Its bounding sphere's world centre, metres. */
    centre: IAutoMovieVector3;

    /** Its bounding sphere's radius, metres. */
    radius: number;
  }

  /**
   * One arm's fixed rig metadata, borrowed for one unchanged trajectory operation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the three bones, effective constraints, canonical shoulder frame, resolved axes, borrowed rest transforms, coordinate freedoms and lazy clamp/basis readers.
   * @evidence contracts/development/design.md#principled-representation One actual body and three rig identities determine arm FK and joint admission; setup readers share fixed rig metadata, and each distinct local input retains the actual projection/composition when a derivative invocation shares identical completed local work.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Geometry, arm frames, trajectory contexts and Jacobians read these existing fields; clamp and basis readers remove repeated rig resolution within the same setup without a global skeleton cache.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The required shoulder domain/frame and three real bones are producer premises, and free-coordinate ordering is the existing nine-coordinate convention; callers keep the body and mappings unchanged until release.
   */
  export interface ISetup {
    /** The borrowed body, unchanged for this setup's operation. */
    body: IHumanBody;

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
    joint: swingTwistRange.IJoint;

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

    /** Whether each of the nine ordered coordinates is free. */
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
   * One instant's shoulder-parent frame, probes and surrounding posed colliders.
   * Parent and rig rest transforms stay unchanged while a completed shoulder
   * position is carried by this frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the parent world frame, optional completed same-frame shoulder point and its unchanged dependencies, hand-local fingertip, probe ownership, bounds, audit indices and surrounding world geometry.
   * @evidence contracts/development/design.md#principled-representation Separates one instant's world context from fixed rig metadata so FK can move the same probes through many candidate coordinates; parallel arrays preserve the audit's ownership and index correspondence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanArmFrame constructs these inputs for placement, clearance and Jacobians; the optional completed shoulder point removes a repeated parent-offset transform while older frames retain the original computation, and collider types stay borrowed from their owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts External parts follow own-body parts and have no own-body exclusion; probe-array lengths, related-matrix dimensions and unit parent rotations remain producer invariants rather than weakened casts.
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

    /** The middle fingertip offset from the wrist in hand-local metres. */
    tip: IAutoMovieVector3;

    /** Collider probes in the frame of their owning arm segment, metres. */
    surface: IAutoMovieVector3[];

    /** The segment carrying each corresponding surface probe. */
    owners: ("upper" | "lower" | "hand")[];

    /** Broad-phase spheres about each segment's local surface probes. */
    bounds: Record<
      "upper" | "lower" | "hand",
      { centre: IAutoMovieVector3; radius: number }
    >;

    /** Each surface probe's own-body audit part index. */
    segments: number[];

    /** Each surface probe's corner index within that part. */
    corners: number[];

    /** Own-body part pairs that share a joint or are the same part. */
    related: boolean[][];

    /** Actual arm colliders in their carrying arm segment's local frame. */
    colliders: {
      /** The segment carrying this collider. */
      owner: "upper" | "lower" | "hand";

      /** Its rig bone. */
      bone: AutoMovieHumanoidBone;

      /** Its own-body audit part. */
      part: number;

      /** Its pose relative to the carrying arm segment. */
      pose: HumanColliders.IPlaced["pose"];

      /** Its borrowed physical shapes. */
      shapes: HumanColliders.IPlaced["shapes"];
    }[];

    /** Posed obstruction shapes in the world. */
    shapes: IShape[];

    /** World collider corners outside the moving arms, including external bodies. */
    body: {
      /** The corner's world point, metres. */
      point: IAutoMovieVector3;

      /** Its part index, external parts following own-body parts. */
      part: number;

      /** Its corner index within that part. */
      corner: number;

      /** The rig bone carrying it. */
      bone: AutoMovieHumanoidBone;
    }[];
  }

  /**
   * Arm FK and probe positions at one candidate coordinate vector.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre joint/probe positions, world rotations, probe radii and the fixed axis-probe prefix.
   * @evidence contracts/development/design.md#principled-representation Actual shoulder/elbow/wrist transforms carry eight axis probes and optional collider probes; fixed probe order lets clearance and differentiation compare matching points across candidates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Placement, Jacobians and trajectory collision/travel costs read these points and rotations; the tuple form borrows the shared vector type and keeps each radius beside its point.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Probes supplement actual segment frames and colliders instead of claiming an exact surface; the eight existing axis-probe radii remain coarse model conventions.
   */
  export interface IPlaced {
    /** Eight axis probes first, followed by optional collider probes with radius zero. */
    probes: readonly (readonly [IAutoMovieVector3, number])[];

    /** The shoulder's world point, metres. */
    shoulder: IAutoMovieVector3;

    /** The elbow's world point, metres. */
    elbow: IAutoMovieVector3;

    /** The upper arm's world rotation. */
    upper: IAutoMovieQuaternion;

    /** The forearm's world rotation. */
    lower: IAutoMovieQuaternion;

    /** The wrist's world point, metres. */
    wrist: IAutoMovieVector3;

    /** The hand's world rotation. */
    hand: IAutoMovieQuaternion;
  }

  /**
   * A pose and external collider placements used to construct one arm frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that moving-arm joints are ignored and that the other bodies' colliders are already posed in the world.
   * @evidence contracts/development/design.md#principled-representation A borrowed canonical pose provides unchanged parents and nonmoving body parts, while external placed segments supply the surrounding geometry; the frame builder owns their interpretation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanArmFrame and trajectory contexts consume exactly these two inputs, reusing the pose and placed-collider owners' types.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts External bodies are data instead of fixture-specific fields, and readonly collider membership does not claim deep immutability of borrowed geometry.
   */
  export interface IBase {
    /** The pose; the moving arms' joints are ignored by the frame builder. */
    pose: IAutoMoviePose;

    /** Other bodies' placed colliders in world coordinates. */
    others: readonly HumanColliders.IPlaced[];
  }
}
