import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { walkReach } from "./walkReach";
import type { walkStation } from "../../gait/internal/walkStation";

/*
 * Prepare the displayed root's horizontal path for speed matching.
 * Parameter body: The fixed walking body.
 * Parameter gait: The gait's trunk inclination.
 * Parameter steps: The walking plan's fixed foot and root schedule.
 * Returns: The world X and Z coordinates at an action second.
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
