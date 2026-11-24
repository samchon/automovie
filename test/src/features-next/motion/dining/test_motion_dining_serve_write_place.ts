import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import type { motionComplaints } from "../../../features/internal/motionComplaints";
import { diningScene } from "../../internal/diningScene";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { motionStrokeUnit } from "../../internal/motionStrokeUnit";

/**
 * How near the left food rests to the plate's place across the table, metres:
 * the original's 60 mm.
 */
const ON_PLATE: number = 0.06;

/**
 * The spoon leaves the served food on the neighbour's plate, on its own: step 4
 * (write with a leave) of `test_motion_dining_utensils_serve`, right-handed on
 * m-average and left-handed on f-small, entered by the minimal chain sit >
 * pickUp(spoon) > write(scoop), which puts the food on the spoon (the grammar
 * has no entry state).
 *
 * Scenarios:
 *
 * 1. The spoon's face stays on the plate's top through the stroke and lies on its
 *    first and last vertices, within `diningTable.ON` (10 mm) plus the radius
 *    it declares.
 * 2. At the film's end the food rests on the plate: within 60 mm of its place
 *    across the table top and not below it.
 * 3. Once left, the food stays where it was left, within `diningTable.HOLD` (5
 *    mm).
 * 4. The placing keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "the food rests on the neighbour's plate"
 * and "the food stays on the plate once left".
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and checks, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write > write and reads the spoon's displayed face in the plate's writing frame at ten times the film rate, the food's displayed place after the leave and the verdict report over the placing's span; a spoon lifting off the plate, food left off the plate, under it or moving after it is left, or a finding in the placing fails.
 * @evidence contracts/development/testing.md#independent-expectations The surface bound is the dining specs' `ON`, the vertices the authored stroke, the plate bounds the original's 60 mm and `HOLD`; the plate's place is the scene's staging.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the scoop is `test_motion_dining_serve_write_scoop`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_serve_write_place`.
 */
export function test_motion_dining_serve_write_place(): void {
  diningTable.run("serving: leave the food on the plate", writePlace);
}

/** One diner's placing and its checks. */
function writePlace(
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
      })
      .registered("write", {
        tool: "spoon",
        tip: "face",
        on: "plate",
        surface: "top",
        stroke: [
          [0, 0],
          [0, 0.02],
        ],
        duration: 0.4,
        hand: side,
        leave: { prop: "serving", point: "pick" },
      }),
  );
  const place: IAutoMovieMotionHumanSegment = motionStrokeUnit.stroke(
    checks,
    label,
    take,
    {
      subject: "actor",
      tool: "spoon",
      toolModel: scene.models.spoon!,
      tip: "face",
      on: "plate",
      onModel: scene.models.plate!,
      surface: "top",
      vertices: [
        [0, 0],
        [0, 0.02],
      ],
      occurrence: 2,
    },
    diningTable.ON,
  );
  const rest: IAutoMovieVector3 = take.prop("serving", take.duration).position;
  const across: number = Vector3.distance(
    { ...rest, y: 0 },
    { ...scene.plate, y: 0 },
  );
  checks.check(
    `${label}: the food rests on the neighbour's plate (${(across * 1000).toFixed(0)} mm across, ${((rest.y - scene.plate.y) * 1000).toFixed(0)} mm up)`,
    across <= ON_PLATE && rest.y >= scene.plate.y,
  );
  const moved: number = Vector3.distance(
    take.prop("serving", place.end).position,
    rest,
  );
  checks.check(
    `${label}: the food stays on the plate once left (${(moved * 1000).toFixed(1)} mm)`,
    moved <= diningTable.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", place);
}
