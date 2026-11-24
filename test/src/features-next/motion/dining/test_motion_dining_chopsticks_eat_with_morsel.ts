import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import { everydayTake } from "../../../features/internal/everydayTake";
import type { motionComplaints } from "../../../features/internal/motionComplaints";
import { diningScene } from "../../internal/diningScene";
import { motionActionUnit } from "../../internal/motionActionUnit";

/**
 * How near the morsel comes to the head bone at the bite's middle, metres: the
 * original's 0.15 m (`diningTable.mouth`).
 */
const BITE: number = 0.15;

/**
 * The pinched morsel carried to the mouth between the tips, on its own: step 7
 * (eatWith) of `test_motion_dining_utensils_chopsticks` with the morsel taken,
 * right-handed on m-average and left-handed on f-small, entered by the minimal
 * chain sit > pickUp(sticks) > write > workHeld(pinch), without the bowl's
 * steps (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. From the pinch's end to the bite's end the morsel's distance to the tips
 *    changes by at most 5 mm, the custody bound.
 * 2. At the bite's middle the morsel lies within the original's 0.15 m of the head
 *    bone it reads the mouth by.
 * 3. The fixed stick stays still in the hand through the bite, within 5 mm.
 * 4. The bite keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "the morsel stays between the tips to the
 * mouth" (its change part), "the morsel reaches the mouth" and the bite's part
 * of "the fixed stick stays still in the hand"; the gap at the pinch is
 * `test_motion_dining_chopsticks_pinch_take`'s, and the span across the bowl
 * actions stays the integration copy's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies, every bound and where the rest of each split check went.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write > workHeld > eatWith and reads the morsel's displayed frame against the sticks' displayed tips and the head bone, the sticks in the hand's frame and the verdict report over the bite's span; a morsel that slips or is left behind, a bite short of the mouth, a stick sliding or a finding in the bite fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the original's: the custody 5 mm (`diningTable.HOLD`) on the morsel's gap, the 0.15 m mouth bound against the head bone and the 5 mm drift; none is read from the bite's plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the empty bite is `test_motion_dining_chopsticks_eat_with`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_eat_with_morsel`.
 */
export function test_motion_dining_chopsticks_eat_with_morsel(): void {
  diningTable.run("chopsticks: carry the morsel to the mouth", eatMorsel);
}

/** One diner's bite with the morsel and its checks. */
function eatMorsel(
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
      })
      .registered("eatWith", { held: "sticks", point: "tips", hand: side }),
  );
  const pinch: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "workHeld",
  );
  const bite: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "eatWith",
  );
  const tips: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 =>
    everydayTake.point(take, scene.models.sticks!, "sticks", "tips", t);
  const gap: number = Vector3.distance(
    take.prop("morsel", pinch.end).position,
    tips(pinch.end),
  );
  let held: number = 0;
  for (let i: number = 0; i <= 24; ++i) {
    const t: number = pinch.end + ((bite.end - pinch.end) * i) / 24;
    held = Math.max(
      held,
      Math.abs(
        Vector3.distance(take.prop("morsel", t).position, tips(t)) - gap,
      ),
    );
  }
  checks.check(
    `${label}: the morsel stays between the tips to the mouth (${(held * 1000).toFixed(1)} mm)`,
    held <= diningTable.HOLD,
  );
  const middle: number = (bite.start + bite.end) / 2;
  const off: number = Vector3.distance(
    take.prop("morsel", middle).position,
    diningTable.mouth(take, middle),
  );
  checks.check(
    `${label}: the morsel reaches the mouth (${(off * 1000).toFixed(0)} mm from the head bone)`,
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
    `${label}: the fixed stick stays still in the hand through the bite (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", bite);
}
