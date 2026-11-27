import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../../everyday/HumanTrunk";
import { walkReach } from "./walkReach";
import type { walkStation } from "../../gait/internal/walkStation";

/**
 * Prepare the displayed root's horizontal path for speed matching.
 *
 * @param body The fixed walking body.
 * @param gait The gait's trunk inclination.
 * @param steps The walking plan's fixed foot and root schedule.
 * @returns The world X and Z coordinates at an action second.
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
