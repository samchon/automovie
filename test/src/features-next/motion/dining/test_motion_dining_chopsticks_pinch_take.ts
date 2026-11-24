import { Vector3 } from "@automovie/engine";
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
 * How near the taken morsel lies to the tips as the pinch closes, metres: the
 * original's 30 mm, a morsel's size between closed tips.
 */
const BETWEEN: number = 0.03;

/**
 * How near the pinch's articulation comes to its driven travel, its own unit
 * (degrees): the original's 0.5.
 */
const TRAVEL: number = 0.5;

/**
 * The held chopsticks pinch a morsel and take it, on their own: step 4
 * (workHeld with a take) of `test_motion_dining_utensils_chopsticks`,
 * right-handed on m-average and left-handed on f-small, entered by the minimal
 * chain sit > pickUp(sticks) > write onto the rice, which brings the tips to
 * the morsel (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The tips close on the morsel: the pinch reaches its driven 12 within 0.5.
 * 2. The taken morsel lies within 30 mm of the tips as the pinch ends.
 * 3. The fixed stick stays still in the hand through the pinch, within 5 mm.
 * 4. The pinch keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "the tips close on the morsel", the gap part
 * of "the morsel stays between the tips to the mouth" and the pinch's part of
 * "the fixed stick stays still in the hand"; the bite's parts are
 * `test_motion_dining_chopsticks_eat_with_morsel`'s, and the span across the
 * bowl actions stays the integration copy's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies, every bound and where the rest of each split check went.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write > workHeld and reads the sticks' displayed articulation state, the morsel's displayed frame against the sticks' displayed tips, the sticks in the hand's frame and the verdict report over the pinch's span; a pinch that stops short, a morsel taken from afar or left behind, a stick sliding or a finding in the pinch fails.
 * @evidence contracts/development/testing.md#independent-expectations The travel is the authored drive (12) within the original's 0.5, the gap the original's 30 mm and the custody bound the everyday prop specs' 5 mm; none is read from the pinch's plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the stroke and the bite are their own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_pinch_take`.
 */
export function test_motion_dining_chopsticks_pinch_take(): void {
  diningTable.run("chopsticks: pinch and take the morsel", pinchTake);
}

/** One diner's pinch and its checks. */
function pinchTake(
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
      .pickUp({ prop: "sticks", handle: "grip", hand: side, lift: 0.05 })
      .registered("write", {
        tool: "sticks",
        tip: "tips",
        on: "rice",
        surface: "top",
        stroke: [
          [0, -0.01],
          [0, 0],
        ],
        duration: 0.3,
        hand: side,
      })
      .registered("workHeld", {
        prop: "sticks",
        hand: side,
        drive: [{ articulation: "pinch", to: 12 }],
        take: { prop: "morsel", point: "tips" },
        duration: 0.3,
      }),
  );
  const pinch: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "workHeld",
  );
  const travel: number = take.state("sticks", pinch.end)["pinch"] ?? 0;
  checks.check(
    `${label}: the tips close on the morsel (pinch ${travel.toFixed(2)} of 12)`,
    Math.abs(travel - 12) <= TRAVEL,
  );
  const gap: number = Vector3.distance(
    take.prop("morsel", pinch.end).position,
    everydayTake.point(take, scene.models.sticks!, "sticks", "tips", pinch.end),
  );
  checks.check(
    `${label}: the taken morsel lies between the tips (${(gap * 1000).toFixed(1)} mm)`,
    gap <= BETWEEN,
  );
  const drift: number = everydayTake.drift(
    take,
    side,
    "sticks",
    pinch.start,
    pinch.end,
  );
  checks.check(
    `${label}: the fixed stick stays still in the hand through the pinch (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", pinch);
}
