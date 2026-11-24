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
import { motionStrokeUnit } from "../../internal/motionStrokeUnit";

/**
 * How far the scooped food leaves its place on the platter by the write's end,
 * metres: the original's 50 mm.
 */
const LEAVES: number = 0.05;

/**
 * The spoon scoops food from the platter, on its own: step 3 (write with a
 * take) of `test_motion_dining_utensils_serve`, right-handed on m-average and
 * left-handed on f-small, entered by the minimal chain sit > pickUp(spoon) (the
 * grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The spoon's face stays on the platter's top through the stroke and lies on
 *    its first and last vertices, within `diningTable.ON` (10 mm) plus the
 *    radius it declares.
 * 2. By the write's end the food has left its place on the platter by at least 50
 *    mm.
 * 3. The spoon rides the hand through the write within 5 mm.
 * 4. The write keeps the shipped bounds over its own span.
 *
 * Decomposes the original's check "the food leaves the platter", which it reads
 * between the scoop's end and the placing's start; here it is read at the
 * scoop's own end, as the placing is not performed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies, every bound and the read instant.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write and reads the spoon's displayed face in the platter's writing frame at ten times the film rate, the food's displayed place, the spoon in the hand's frame and the verdict report over the write's span; a spoon lifting off the platter, food left behind, a spoon sliding or a finding in the write fails.
 * @evidence contracts/development/testing.md#independent-expectations The surface bound is the dining specs' `ON`, the vertices the authored stroke, the leaving distance the original's 50 mm and the custody bound the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the placing is `test_motion_dining_serve_write_place`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_serve_write_scoop`.
 */
export function test_motion_dining_serve_write_scoop(): void {
  diningTable.run("serving: scoop from the platter", writeScoop);
}

/** One diner's scoop and its checks. */
function writeScoop(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.IServe = diningScene.serve(side);
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} serving serve`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "spoon", handle: "grip", hand: side, lift: 0.05 })
      .registered("write", {
        tool: "spoon",
        tip: "face",
        on: "platter",
        surface: "top",
        stroke: [
          [0, -0.02],
          [0, 0],
        ],
        duration: 0.4,
        hand: side,
        take: { prop: "serving", point: "face" },
      }),
  );
  const scoop: IAutoMovieMotionHumanSegment = motionStrokeUnit.stroke(
    checks,
    label,
    take,
    {
      subject: "actor",
      tool: "spoon",
      toolModel: scene.models.spoon!,
      tip: "face",
      on: "platter",
      onModel: scene.models.platter!,
      surface: "top",
      vertices: [
        [0, -0.02],
        [0, 0],
      ],
    },
    diningTable.ON,
  );
  const left: number = Vector3.distance(
    take.prop("serving", scoop.end).position,
    take.prop("serving", 0).position,
  );
  checks.check(
    `${label}: the food leaves the platter (${(left * 1000).toFixed(0)} mm)`,
    left >= LEAVES,
  );
  const drift: number = everydayTake.drift(
    take,
    side,
    "spoon",
    scoop.start,
    scoop.end,
  );
  checks.check(
    `${label}: the spoon rides the hand through the scoop (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", scoop);
}
