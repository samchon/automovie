import {
  HUMANOID_REST_FRAME,
  Transform,
  Vector3,
  prepareChainPlant,
  type skeletonJointAxes,
} from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { HumanColliders } from "../posture/HumanColliders";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

/**
 * An arm chain prepared on a posture's trunk for the elbow search of
 * `AutoMovieMotionHumanBend`: the engine's two-bone preparation, the
 * shoulder, the arm's span, the rig's clinical axes and the trunk's posed
 * colliders the forearm must clear.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared and for whom.
 * @evidence contracts/development/design.md#principled-representation One record of everything the swivel search reads that depends on the trunk alone, prepared once per request.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and its one constructor.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The chain is the engine's preparation; nothing is measured here.
 */
export namespace AutoMovieMotionHumanBendChain {
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
    shapes: HumanColliders.IPlaced[];
  }

  /**
   * An arm chain on a posture's trunk, or null when the rig has no such chain.
   *
   * @param body The body.
   * @param posture The root and the heading; an absent pitch or roll is 0.
   * @param side The arm.
   * @returns The chain with the trunk's shapes posed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's chain preparation on a pose whose root carries the posture's heading, and the trunk's colliders resolved on that pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose, one preparation, one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain is null, never a guessed chain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reuses the body's merged raw-axis snapshot instead of scanning skeleton axes. Prepared chain FK demands three chain bones/ancestry, then the subsequent bone map shares exact completed rows through one operation reader; collider selection remains unchanged and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body's genuine immutable FK producer supplies both chain preparation and the canonical poseBones map under the same operation reader. HumanArmClearance.trunk keeps its original collider selection, and all outputs remain fresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The lazy reader is released at synchronous return or throw; the fresh chain record retains only its original prepared geometry and colliders, without any reader or time-keyed pose result.
   */
  export function of(
    body: IHumanBody,
    posture: AutoMovieMotionHumanBend.ISolve["posture"],
    side: AutoMovieMotionHumanBend.Side,
  ): IChain | null {
    const axes: ReturnType<typeof skeletonJointAxes> = body.poseResolution.jointAxes;
    const pose: IAutoMoviePose = {
      skeleton: body.skeleton.id,
      root: Transform.of(posture.root, resolveHumanPosture.heading({
          yaw: posture.yaw,
          pitch: posture.pitch ?? 0,
          roll: posture.roll ?? 0,
        })),
      joints: [],
    };
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const prepared: ReturnType<typeof prepareChainPlant> = prepareChainPlant({
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
    }, resolution(), body.poseResolution);
    if (prepared === null) return null;
    return {
      prepared,
      shoulder: prepared.upper.worldPosition,
      span:
        Vector3.length(prepared.lowerOffset) +
        Vector3.length(prepared.effectorOffset),
      axes,
      shapes: HumanArmClearance.trunk(
        body,
        poseBones(body, pose, resolution()),
      ),
    };
  }
}
