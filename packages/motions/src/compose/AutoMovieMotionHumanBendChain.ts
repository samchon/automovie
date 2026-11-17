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
 * @evidence contracts/development/design.md#principled-representation IChain owns the actual side-specific engine geometry and world-metre obstacle frames; an opaque bilateral source shares only actual common body/root/heading prerequisites.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Search consumes IChain/of; handling's bilateral preparation uses prepare/IPrepared for actual crawl/load pairs without exposing mutable source data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The engine owns chain geometry/admission and the profile owns obstacles; opaque provenance and exact source matching never replace side-specific preparation or hand-goal sweeps.
 */
export namespace AutoMovieMotionHumanBendChain {
  /** Private provenance makes the shared source a product of this owner. */
  const BRAND: unique symbol = Symbol("AutoMovieMotionHumanBendChain");

  /** Weak ownership follows the caller's synchronous bilateral preparation. */
  const SOURCES: WeakMap<IPrepared, ISource> = new WeakMap();

  /** Actual unchanged body/frame prerequisites shared by the two arm preparations. */
  interface ISource {
    /** Body identity and its borrowed immutable definition dependencies. */
    body: IAutoMovieMotionHumanBody;
    skeleton: IAutoMovieMotionHumanBody["skeleton"];
    profile: IAutoMovieMotionHumanBody["profile"];
    topology: IAutoMovieMotionHumanBody["topology"];
    poseResolution: IAutoMovieMotionHumanBody["poseResolution"];
    rest: IAutoMovieMotionHumanBody["rest"];

    /** Copied world-metre root and heading values establish frame equivalence. */
    root: IAutoMovieVector3;
    yaw: number;
    pitch: number;
    roll: number;

    /** Genuine fixed source pose/axes, without any hand goal or selected bend. */
    pose: IAutoMoviePose;
    axes: ReturnType<typeof skeletonJointAxes>;

    /** Borrowed operation workspace ends after both sides have been visited. */
    resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;
    sides: Set<AutoMovieHumanSide>;

    /** Private actual trunk placement, copied before an outward chain receives it. */
    shapes?: IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * Opaque fixed-body/trunk source for one synchronous bilateral preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Only prepare creates this handle; of checks actual provenance, body dependencies and exact world root/heading before sharing source work. Release it with the paired operation.
   * @evidence contracts/development/design.md#principled-representation The private symbol brands actual body/frame preparation, while the private weak owner holds copied metre coordinates and genuine source data; a handle represents no target or valid IK solution.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Handling's bilateral BendPreparation supplies this one opaque handle to the two existing chain preparations; no caller-authored frames or colliders are accepted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown or mismatched handles take the ordinary path. The brand alone never certifies source equivalence or bypasses actual chain/ROM admission.
   */
  export interface IPrepared {
    /** Private producer provenance; no source data is exposed for mutation. */
    readonly [BRAND]: true;
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
   * @param source Optional genuine unchanged bilateral source; mismatch uses ordinary preparation.
   * @returns The chain with the trunk's shapes posed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's chain preparation on a pose whose root carries the posture's heading, and the trunk's colliders resolved on that pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one engine preparation and one record; an optional genuine bilateral source owns only common frame/FK/placement work.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain is null, never a guessed chain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reuses the body's merged raw-axis snapshot. Chain FK demands three chain bones/ancestry and trunk FK only the original axial obstacle names. A genuine bilateral source performs its trunk placement once, then copies S outward frames per chain through one static visitor, without a per-chain copy callback allocation; each side retains actual engine chain preparation. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body FK producer and exact root/heading establish common source work. Optional provenance/dependency checks reject unrelated sources, and private placed frames are copied before return. All original side-specific chain/ROM decisions remain actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ordinary lazy reader ends at return/throw. A bilateral token borrows its one workspace until both sides have been attempted, then drops that reference; the token's fixed source/placement ends with its synchronous owner. Returned chains retain fresh geometry/collider frames and borrowed immutable shapes, with no reader or time-keyed result.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanBend.ISolve["posture"],
    side: AutoMovieHumanSide,
    source?: IPrepared,
  ): IChain | null {
    const shared: ISource | undefined = source === undefined
      ? undefined : matchingSource(source, body, posture);
    const axes: ReturnType<typeof skeletonJointAxes> =
      shared?.axes ?? body.poseResolution.jointAxes;
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
   * Bind one actual unchanged body/root/heading for its two arm preparations.
   * Construction copies fixed coordinates and forms their original heading;
   * numerical chain admission/FK/placement remain lazy at actual of calls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines synchronous unchanged-body scope, copied world-metre root/degree heading, optional borrowed reader and lazy original numerical admission.
   * @evidence contracts/development/implementation.md#principled-implementation Both arm sources use the same empty-joint trunk pose. Copy that actual fixed root, compute its original heading once, and let the existing chain and collider owners perform each demanded preparation in original side order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This sole producer owns shared source data behind an opaque token; of owns source matching, each actual side and fresh outward records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal, selected elbow, score, candidate, readiness assertion or foreign preparation enters the handle. Body definitions retain their existing immutable-body contract; changed frame scalars or replaced dependencies select the original cold path.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant construction and frame matching precede original per-side chain preparation. The first successful side computes requested trunk FK and S placements once; subsequent sides copy S current frames without repeated placement arithmetic. No speedup is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Exact copied root/heading plus actual immutable body/rig/profile/topology/rest/FK identities establish shared source geometry. The operation reader shares completed rows only, and every side still performs its own engine chain/domain preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller releases one token with its synchronous pair. Its weak entry retains one fixed pose, O(S) private trunk placements and at most one operation reader; after both side attempts the reader/supplier reference is dropped even on throw. Returned chains contain no token or reader.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanBend.ISolve["posture"],
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IPrepared {
    const token: IPrepared = Object.freeze<IPrepared>({ [BRAND]: true });
    const axes: ReturnType<typeof skeletonJointAxes> = body.poseResolution.jointAxes;
    const root: IAutoMovieVector3 = {
      x: posture.root.x, y: posture.root.y, z: posture.root.z,
    };
    const yaw: number = posture.yaw;
    const pitch: number = posture.pitch ?? 0;
    const roll: number = posture.roll ?? 0;
    SOURCES.set(token, {
      body, skeleton: body.skeleton, profile: body.profile,
      topology: body.topology, poseResolution: body.poseResolution, rest: body.rest,
      root, yaw, pitch, roll, axes,
      pose: {
        skeleton: body.skeleton.id,
        root: Transform.of(root, resolveHumanPosture.heading({ yaw, pitch, roll })),
        joints: [],
      },
      resolution: prepareHumanPoseResolution(resolution),
      sides: new Set(),
    });
    return token;
  }

  /** Reject foreign/replaced sources and any actual root/heading edit. */
  function matchingSource(
    token: IPrepared,
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanBend.ISolve["posture"],
  ): ISource | undefined {
    const source: ISource | undefined = SOURCES.get(token);
    return source !== undefined && source.body === body &&
      source.skeleton === body.skeleton && source.profile === body.profile &&
      source.topology === body.topology && source.poseResolution === body.poseResolution &&
      source.rest === body.rest && Object.is(source.root.x, posture.root.x) &&
      Object.is(source.root.y, posture.root.y) && Object.is(source.root.z, posture.root.z) &&
      Object.is(source.yaw, posture.yaw) && Object.is(source.pitch, posture.pitch ?? 0) &&
      Object.is(source.roll, posture.roll ?? 0) ? source : undefined;
  }

  /** Keep private source placement independent of every public chain's mutation. */
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
