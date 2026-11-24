import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import { everydayTake } from "../../../features/internal/everydayTake";
import type { motionComplaints } from "../../../features/internal/motionComplaints";
import { diningScene } from "../../internal/diningScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/**
 * The held bowl raised to the chin, on its own: step 6 (workHeld of the bowl)
 * of `test_motion_dining_utensils_chopsticks`, the bowl in the left hand on
 * m-average and the right on f-small, entered by the minimal chain sit >
 * pickUp(bowl), without the chopsticks' steps (the grammar has no entry
 * state).
 *
 * Scenarios:
 *
 * 1. At the work's end the bowl stands at the asked height, 0.15 m below the
 *    seated chin, within `diningTable.MOUTH` (60 mm, the lips' half width).
 * 2. The bowl rides the hand through the work within 5 mm.
 * 3. The work keeps the shipped bounds over its own span.
 *
 * Decomposes the original's check "the bowl is raised to the chin".
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and check, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > workHeld and reads the bowl's displayed height, the bowl in the hand's frame and the verdict report over the work's span; a bowl short of or above the chin, a bowl sliding in the hand or a finding in the work fails.
 * @evidence contracts/development/testing.md#independent-expectations The height is the authored `at.up`, the chin read from the body's shoulder height less the thigh's drop as the original reads it, within the original's `MOUTH`; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Left- against right-hand bowls on two statures; the pickUp is `test_motion_dining_chopsticks_pick_up_bowl`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_raise_bowl`.
 */
export function test_motion_dining_chopsticks_raise_bowl(): void {
  diningTable.run("chopsticks: raise the bowl", raiseBowl);
}

/** One diner's raise of the bowl and its checks. */
function raiseBowl(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.IChopsticks = diningScene.chopsticks(body, side);
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} chopsticks chopsticks`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "bowl", handle: "body", hand: scene.other, lift: 0.05 })
      .registered("workHeld", {
        prop: "bowl",
        hand: scene.other,
        at: { out: 0.2, up: scene.chin - 0.15, forward: 0.3, level: true },
        duration: 0.5,
      }),
  );
  const lifted: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "workHeld",
  );
  const height: number = take.prop("bowl", lifted.end).position.y;
  checks.check(
    `${label}: the bowl is raised to the chin (${((height - (scene.chin - 0.15)) * 1000).toFixed(1)} mm off)`,
    Math.abs(height - (scene.chin - 0.15)) <= diningTable.MOUTH,
  );
  const drift: number = everydayTake.drift(
    take,
    scene.other,
    "bowl",
    lifted.start,
    lifted.end,
  );
  checks.check(
    `${label}: the bowl rides the hand through the raise (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", lifted);
}
