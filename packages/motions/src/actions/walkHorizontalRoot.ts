import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { walkReach } from "./walkReach";
import type { walkStation } from "./walkStation";

/**
 * Prepare the displayed root's horizontal path for speed matching.
 *
 * @param body The fixed walking body.
 * @param gait The gait's trunk inclination.
 * @param steps The walking plan's fixed foot and root schedule.
 * @returns The world X and Z coordinates at an action second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the immutable inputs, action seconds and world horizontal output.
 * @evidence contracts/development/implementation.md#principled-implementation A vertical leg-reach correction preserves the horizontal position. This applies the same stance heading and hip-centred inclination as playback.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the planned root, yaw and scalar inclination, then applies the existing pivot.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual two scheduled feet for heading, the same clamped time and the original pivot arithmetic.
 * @evidence contracts/development/implementation.md#efficient-algorithms Does no hip FK, swing or leg IK for a horizontal-only demand.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the step, heading and pivot calculations of full posture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the same immutable body, gait and step plan as full posture.
 */
export function walkHorizontalRoot(
  body: IAutoMovieMotionHumanBody,
  gait: IAutoMovieMotionHumanWalkGait,
  steps: IAutoMovieMotionHumanWalkSteps.IPlan,
): walkStation.HorizontalRoot {
  return (seconds: number): walkStation.HorizontalPoint => {
    const t: number = Math.min(steps.duration, Math.max(0, seconds));
    const yaw: number = walkReach.turn(steps.yaw(t), {
      left: steps.foot("left", t),
      right: steps.foot("right", t),
    }).yaw;
    return AutoMovieMotionHumanLean.pivot(
      body,
      { root: steps.root(t), yaw, pitch: 0, roll: 0, joints: {}, limbs: {} },
      { pitch: HumanTrunk.pelvisPitch(gait.lean * steps.amount(t)), roll: 0 },
    ).root;
  };
}
