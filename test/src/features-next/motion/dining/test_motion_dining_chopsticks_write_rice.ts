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
import { motionStrokeUnit } from "../../internal/motionStrokeUnit";

/**
 * The held chopsticks' tips stroke onto the rice, on their own: step 3 (write)
 * of `test_motion_dining_utensils_chopsticks`, right-handed on m-average and
 * left-handed on f-small, entered by the minimal chain sit > pickUp(sticks)
 * (the grammar has no entry state). The original checks no goal of this step;
 * its refusal (`write#1 region`) hides every later step there.
 *
 * Scenarios:
 *
 * 1. From the stroke's start to its end the tips stay on the rice's top within
 *    `diningTable.ON` (10 mm) plus the radius the tips declare.
 * 2. The tips lie on the stroke's first vertex at its start and on its last at its
 *    end, within the same bound.
 * 3. The sticks ride the hand through the write within 5 mm.
 * 4. The write keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write and reads the sticks' displayed tips in the rice's displayed writing frame at ten times the film rate, the sticks in the hand's frame and the verdict report over the write's span; tips lifting off or sinking into the rice, a stroke missing its vertices, sticks sliding in the hand or a finding in the write fails.
 * @evidence contracts/development/testing.md#independent-expectations The vertices are the authored stroke in the writing affordance's frame (`IAutoMovieMotionHumanWrite.stroke`); the surface bound is the dining specs' `ON`, widened only by the radius the tips' archetype declares, as the law's mark is; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the pickUp, the pinch, the bowl and the bite are their own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_write_rice`.
 */
export function test_motion_dining_chopsticks_write_rice(): void {
  diningTable.run("chopsticks: stroke onto the rice", writeRice);
}

/** One diner's stroke onto the rice and its checks. */
function writeRice(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.IChopsticks = diningScene.chopsticks(body, side);
  const stroke: readonly (readonly [number, number])[] = [
    [0, -0.01],
    [0, 0],
  ];
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
      }),
  );
  const write: IAutoMovieMotionHumanSegment = motionStrokeUnit.stroke(
    checks,
    label,
    take,
    {
      subject: "actor",
      tool: "sticks",
      toolModel: scene.models.sticks!,
      tip: "tips",
      on: "rice",
      onModel: scene.models.rice!,
      surface: "top",
      vertices: stroke,
    },
    diningTable.ON,
  );
  const drift: number = everydayTake.drift(
    take,
    side,
    "sticks",
    write.entryTime,
    write.end,
  );
  checks.check(
    `${label}: the sticks ride the hand through the stroke (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", write);
}
