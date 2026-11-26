import { HUMANOID_REST_FRAME, Transform, Vector3, prepareChainPlant, AutoMovieEngineKinematics } from "@automovie/engine";
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
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/** Keep the source's placement independent of every returned chain's mutation. */
function copyShapes(
  shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
): IAutoMovieMotionHumanColliders.IPlaced[] {
  return shapes.map(copyShape);
}

/**
 * One fresh outward collider frame; only the original immutable shape geometry
 * is shared.
 */
function copyShape(
  shape: IAutoMovieMotionHumanColliders.IPlaced,
): IAutoMovieMotionHumanColliders.IPlaced {
  return {
    bone: shape.bone,
    pose: {
      position: { ...shape.pose.position },
      rotation: { ...shape.pose.rotation },
    },
    shapes: shape.shapes,
  };
}

/**
 * An arm chain on a posture's trunk, or null when the rig has no such chain.
 *
 * @param body The body.
 * @param posture The root and the heading; an absent pitch or roll is 0.
 * @param side The arm.
 * @param source The bilateral source prepare made for this body and posture,
 *   when both arms are prepared together.
 * @returns The chain with the trunk's shapes posed.
 */
export function AutoMovieMotionHumanBendChain(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanBend.ISolve["posture"],
  side: AutoMovieHumanSide,
  source?: AutoMovieMotionHumanBendChain.IPrepared,
): AutoMovieMotionHumanBendChain.IChain | null {
  const shared: AutoMovieMotionHumanBendChain.IPrepared | undefined = source;
  const axes: ReturnType<typeof AutoMovieEngineKinematics.skeletonJointAxes> =
    body.poseResolution.jointAxes;
  const pose: IAutoMoviePose = shared?.pose ?? {
    skeleton: body.skeleton.id,
    root: Transform.of(
      posture.root,
      humanPostureHeading({
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
    const shapes: IAutoMovieMotionHumanColliders.IPlaced[] =
      shared?.shapes ??
      HumanArmClearance.trunk(
        body,
        poseBones(body, pose, resolution(), HumanArmObstacleBones.TRUNK),
      );
    if (shared !== undefined) shared.shapes = shapes;
    return {
      prepared,
      shoulder: prepared.upper.worldPosition,
      span:
        Vector3.length(prepared.lowerOffset) +
        Vector3.length(prepared.effectorOffset),
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
 * An arm chain prepared on a posture's trunk for the elbow search of
 * `AutoMovieMotionHumanBend`: the engine's two-bone preparation, the shoulder,
 * the arm's span, the rig's clinical axes and the trunk's posed colliders the
 * forearm must clear.
 */
export namespace AutoMovieMotionHumanBendChain {
  /**
   * One trunk both arm chains are prepared on in one synchronous bilateral
   * preparation: the trunk pose, the workspace its forward kinematics runs in
   * and the trunk's colliders placed by the first side.
   */
  export interface IPrepared {
    /** The trunk pose, the posture's root and heading with no joint. */
    readonly pose: IAutoMoviePose;

    /** The forward-kinematics workspace, dropped once both sides are prepared. */
    resolution: ReturnType<typeof prepareHumanPoseResolution> | undefined;

    /** The sides prepared so far. */
    readonly sides: Set<AutoMovieHumanSide>;

    /**
     * The trunk's placed colliders, world metres, from the first side; each
     * chain receives a copy.
     */
    shapes?: IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /** An arm chain prepared on a posture's trunk. */
  export interface IChain {
    /** The engine's preparation of the chain. */
    prepared: NonNullable<ReturnType<typeof prepareChainPlant>>;

    /** The shoulder joint, world metres. */
    shoulder: IAutoMovieVector3;

    /** The arm's length from the shoulder to the wrist, metres. */
    span: number;

    /** The rig's clinical axes by bone. */
    axes: ReturnType<typeof AutoMovieEngineKinematics.skeletonJointAxes>;

    /** The trunk's placed colliders, world metres. */
    shapes: IAutoMovieMotionHumanColliders.IPlaced[];
  }

  /**
   * The source both arms of one trunk are prepared on: the posture's root and
   * heading as a pose with no joint, and a workspace for its forward
   * kinematics. The caller passes it to `of` for each side, on the same body
   * and posture.
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
          humanPostureHeading({
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
}
