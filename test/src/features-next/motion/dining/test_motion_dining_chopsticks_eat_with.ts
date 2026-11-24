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
 * How near a bite's working point comes to the head bone at the bite's middle,
 * metres: the original's 0.15 m, read against the same bone
 * (`diningTable.mouth`).
 */
const BITE: number = 0.15;

/**
 * The held chopsticks brought to the mouth, on their own: step 7 (eatWith) of
 * `test_motion_dining_utensils_chopsticks` with nothing on the tips,
 * right-handed on m-average and left-handed on f-small, entered by the minimal
 * chain sit > pickUp(sticks), without the stroke, the pinch and the bowl (the
 * grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. At the bite's middle the tips lie within the original's 0.15 m of the head
 *    bone it reads the mouth by.
 * 2. The sticks ride the hand through the bite within 5 mm.
 * 3. The bite keeps the shipped bounds over its own span.
 *
 * The morsel's part of the bite is
 * `test_motion_dining_chopsticks_eat_with_morsel`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > eatWith and reads the sticks' displayed tips against the displayed head bone, the sticks in the hand's frame and the verdict report over the bite's span; tips short of the mouth, sticks sliding or a finding in the bite fails.
 * @evidence contracts/development/testing.md#independent-expectations The mouth bound is the original's 0.15 m against the head bone; the morsel rides within 30 mm of the tips there, so the tips' bound is the morsel's; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the bite with a morsel is its own unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_eat_with`.
 */
export function test_motion_dining_chopsticks_eat_with(): void {
  diningTable.run("chopsticks: bring the tips to the mouth", eatWith);
}

/** One diner's bite with empty sticks and its checks. */
function eatWith(
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
      .registered("eatWith", { held: "sticks", point: "tips", hand: side }),
  );
  const bite: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "eatWith",
  );
  const middle: number = (bite.start + bite.end) / 2;
  const off: number = Vector3.distance(
    everydayTake.point(take, scene.models.sticks!, "sticks", "tips", middle),
    diningTable.mouth(take, middle),
  );
  checks.check(
    `${label}: the tips reach the mouth (${(off * 1000).toFixed(0)} mm from the head bone)`,
    off <= BITE,
  );
  const drift: number = everydayTake.drift(
    take,
    side,
    "sticks",
    bite.start,
    bite.end,
  );
  checks.check(
    `${label}: the sticks ride the hand through the bite (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", bite);
}
