import {
  HUMANOID_REST_FRAME,
  Transform,
  Vector3,
  prepareChainPlant,
  skeletonJointAxes,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmObstacleBones } from "../posture/HumanArmObstacleBones";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * An arm chain prepared on a posture's trunk for the elbow search of
 * `AutoMovieMotionHumanBend`: the engine's two-bone preparation, the
 * shoulder, the arm's span, the rig's clinical axes and the trunk's posed
 * colliders the forearm must clear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared and for whom.
 * @evidence contracts/development/design.md#principled-representation IChain owns the actual side-specific engine geometry and world-metre obstacle frames; a bilateral source shares only the trunk pose, its workspace and its placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Search consumes IChain/of; handling's bilateral preparation uses prepare/IPrepared for actual crawl/load pairs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine owns chain geometry/admission and the profile owns obstacles; a shared source never replaces side-specific preparation or hand-goal sweeps.
 */
export namespace AutoMovieMotionHumanBendChain {
  /**
   * One trunk both arm chains are prepared on in one synchronous bilateral
   * preparation: the trunk pose, the workspace its forward kinematics runs
   * in and the trunk's colliders placed by the first side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds; `prepare` makes it and `of` reads it for a chain on the same body and posture.
   * @evidence contracts/development/design.md#principled-representation The record is the shared source itself: the empty-joint trunk pose, a workspace dropped once both sides are prepared, and the trunk placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Handling's bilateral BendPreparation passes it from `prepare` to the two `of` calls; no caller-authored frames or colliders are accepted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts It carries no target, elbow or solved chain; each side still runs its own engine chain preparation.
   */
  export interface IPrepared {
    /** The trunk pose, the posture's root and heading with no joint. */
    readonly pose: IAutoMoviePose;

    /** The forward-kinematics workspace, dropped once both sides are prepared. */
    resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;

    /** The sides prepared so far. */
    readonly sides: Set<AutoMovieHumanSide>;

    /** The trunk's placed colliders, world metres, from the first side; each chain receives a copy. */
    shapes?: IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * An arm chain prepared on a posture's trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it holds and its unit: the engine's preparation, the shoulder in world metres, the arm's span in metres, the rig's clinical axes and the trunk's placed colliders in world metres.
   * @evidence contracts/development/design.md#principled-representation Everything the swivel search reads that depends on the trunk alone: the chain the engine prepared, the shoulder and span derived from it, the clinical axes of the rig and the colliders the forearm must clear, all in the world frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by `AutoMovieMotionHumanBendSearch`; `prepared` and `axes` are the engine's own types, not restated.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine's preparation and axes types are derived from the engine's functions rather than declared again, and no member is optional, so a half-prepared chain cannot be written.
   */
  export interface IChain {
    /** The engine's preparation of the chain. */
    prepared: NonNullable<ReturnType<typeof prepareChainPlant>>;

    /** The shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** The arm's length from the shoulder to the wrist, metres. */
    span: number;

    /** The rig's clinical axes by bone. */
    axes: ReturnType<typeof skeletonJointAxes>;

    /** The trunk's placed colliders, world metres. */
    shapes: IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * An arm chain on a posture's trunk, or null when the rig has no such chain.
   *
   * @param body The body.
   * @param posture The root and the heading; an absent pitch or roll is 0.
   * @param side The arm.
   * @param source The bilateral source prepare made for this body and posture, when both arms are prepared together.
   * @returns The chain with the trunk's shapes posed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's chain preparation on a pose whose root carries the posture's heading, and the trunk's colliders resolved on that pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one engine preparation and one record; an optional genuine bilateral source owns only common frame/FK/placement work.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain is null, never a guessed chain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reuses the body's merged raw-axis snapshot. Chain FK demands three chain bones/ancestry and trunk FK only the original axial obstacle names. A genuine bilateral source performs its trunk placement once, then copies S outward frames per chain through one static visitor, without a per-chain copy callback allocation; each side retains actual engine chain preparation. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body FK producer and the source's root and heading, the caller's own posture, establish common source work; placed frames are copied before return. All original side-specific chain/ROM decisions remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ordinary lazy reader ends at return/throw. A bilateral source borrows its one workspace until both sides have been attempted, then drops that reference; its pose and placement end with its synchronous owner. Returned chains retain fresh geometry/collider frames and borrowed immutable shapes, with no reader or time-keyed result.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanBend.ISolve["posture"],
    side: AutoMovieHumanSide,
    source?: IPrepared,
  ): IChain | null {
    const shared: IPrepared | undefined = source;
    const axes: ReturnType<typeof skeletonJointAxes> = body.poseResolution.jointAxes;
    const pose: IAutoMoviePose = shared?.pose ?? {
      skeleton: body.skeleton.id,
      root: Transform.of(
        posture.root,
        resolveHumanPosture.heading({
          yaw: posture.yaw,
          pitch: posture.pitch ?? 0,
          roll: posture.roll ?? 0,
        }),
      ),
      joints: [],
    };
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      shared?.resolution ?? prepareHumanPoseResolution();
    if (shared !== undefined) shared.resolution = resolution;
    try {
      const prepared: ReturnType<typeof prepareChainPlant> = prepareChainPlant(
        {
          skeleton: body.skeleton,
          pose,
          chain: {
            upper: `${side}UpperArm`,
            lower: `${side}LowerArm`,
            effector: `${side}Hand`,
          },
          topology: body.topology,
          jointAxes: axes,
          restFrames: HUMANOID_REST_FRAME,
        },
        resolution(),
        body.poseResolution,
      );
      if (prepared === null) return null;
      const shapes: IAutoMovieMotionHumanColliders.IPlaced[] = shared?.shapes ??
        HumanArmClearance.trunk(
          body,
          poseBones(body, pose, resolution(), HumanArmObstacleBones.TRUNK),
        );
      if (shared !== undefined) shared.shapes = shapes;
      return {
        prepared,
        shoulder: prepared.upper.worldPosition,
        span: Vector3.length(prepared.lowerOffset) + Vector3.length(prepared.effectorOffset),
        axes,
        shapes: shared === undefined ? shapes : copyShapes(shapes),
      };
    } finally {
      if (shared !== undefined) {
        shared.sides.add(side);
        if (shared.sides.size === 2) shared.resolution = undefined;
      }
    }
  }

  /**
   * The source both arms of one trunk are prepared on: the posture's root
   * and heading as a pose with no joint, and a workspace for its forward
   * kinematics. The caller passes it to `of` for each side, on the same body
   * and posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the source holds, its optional borrowed reader and the caller's same-body, same-posture contract.
   * @evidence contracts/development/implementation.md#principled-implementation Both arm sources use the same empty-joint trunk pose, formed once from the posture's root and heading; the chain and collider owners run their preparations at each `of` in side order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record; `of` reads it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal, selected elbow, score or candidate enters the source.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant construction; the first successful side computes the trunk FK and S placements once and the second copies them.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's one body and posture make the trunk the same for both sides; every side still performs its own engine chain preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller releases the source with its synchronous pair; it retains one pose, O(S) trunk placements and at most one reader, dropped after both sides even on throw. Returned chains hold no source or reader.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanBend.ISolve["posture"],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IPrepared {
    return {
      pose: {
        skeleton: body.skeleton.id,
        root: Transform.of(
          { x: posture.root.x, y: posture.root.y, z: posture.root.z },
          resolveHumanPosture.heading({
            yaw: posture.yaw,
            pitch: posture.pitch ?? 0,
            roll: posture.roll ?? 0,
          }),
        ),
        joints: [],
      },
      resolution: prepareHumanPoseResolution(resolution),
      sides: new Set(),
    };
  }

  /** Keep the source's placement independent of every returned chain's mutation. */
  function copyShapes(shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[]): IAutoMovieMotionHumanColliders.IPlaced[] {
    return shapes.map(copyShape);
  }

  /** One fresh outward collider frame; only the original immutable shape geometry is shared. */
  function copyShape(shape: IAutoMovieMotionHumanColliders.IPlaced): IAutoMovieMotionHumanColliders.IPlaced {
    return {
      bone: shape.bone,
      pose: { position: { ...shape.pose.position }, rotation: { ...shape.pose.rotation } },
      shapes: shape.shapes,
    };
  }
}
