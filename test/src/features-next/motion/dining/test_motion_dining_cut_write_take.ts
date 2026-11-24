import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import type { motionComplaints } from "../../../features/internal/motionComplaints";
import { diningScene } from "../../internal/diningScene";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { motionStrokeUnit } from "../../internal/motionStrokeUnit";

/**
 * Seconds on each side of the take's instant the piece's place is compared at:
 * one millisecond, in which a fork moving at a hand's speed moves well under a
 * millimetre.
 */
const INSTANT: number = 0.001;

/**
 * The fork takes the cut piece, on its own: step 5 (write with a take) of
 * `test_motion_dining_utensils_cut`, the fork in the left hand on m-average and
 * the right on f-small, entered by the minimal chain sit > pickUp(fork),
 * without the knife and the saw (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The fork's face stays on the steak's top through the stroke and lies on its
 *    first and last vertices, within `diningTable.ON` (10 mm) plus the radius
 *    it declares.
 * 2. The piece is taken where it lies: across the stroke's end, where the take
 *    sets it on the fork, it moves at most `ON`.
 * 3. From the take to the write's end the piece keeps its place on the fork, its
 *    distance to the fork's frame changing at most 5 mm.
 * 4. The write keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write and reads the fork's displayed face in the steak's writing frame at ten times the film rate, the piece's displayed frame on either side of the take and against the fork, and the verdict report over the write's span; a fork lifting off the food, a piece that jumps onto the fork or slides off it, or a finding in the write fails.
 * @evidence contracts/development/testing.md#independent-expectations The surface bound is the dining specs' `ON`, the vertices the authored stroke; a prop taken where it lies cannot move further than the tool in a millisecond, so `ON` bounds the jump; the custody bound is the dining specs' `HOLD`.
 * @evidence contracts/development/testing.md#distinguishing-cases Left- against right-hand forks on two statures; the bite with the piece is `test_motion_dining_cut_eat_with_piece`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_cut_write_take`.
 */
export function test_motion_dining_cut_write_take(): void {
  diningTable.run("knife and fork: the fork takes the piece", writeTake);
}

/** One diner's take of the piece and its checks. */
function writeTake(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.ICut = diningScene.cut(side);
  const edge: number = scene.edge;
  const stroke: readonly (readonly [number, number])[] = [
    [edge - scene.sign * 0.004, 0],
    [edge, 0],
  ];
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} knife and fork cut`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "fork", handle: "grip", hand: scene.other, lift: 0.05 })
      .registered("write", {
        tool: "fork",
        tip: "face",
        on: "steak",
        surface: "top",
        stroke: [
          [edge - scene.sign * 0.004, 0],
          [edge, 0],
        ],
        duration: 0.3,
        hand: scene.other,
        take: { prop: "piece", point: "face" },
      }),
  );
  const write: IAutoMovieMotionHumanSegment = motionStrokeUnit.stroke(
    checks,
    label,
    take,
    {
      subject: "actor",
      tool: "fork",
      toolModel: scene.models.fork!,
      tip: "face",
      on: "steak",
      onModel: scene.models.steak!,
      surface: "top",
      vertices: stroke,
    },
    diningTable.ON,
  );
  const taken: number = motionActionUnit.event(write, "strokeEnd");
  const jump: number = Vector3.distance(
    take.prop("piece", taken - INSTANT).position,
    take.prop("piece", taken + INSTANT).position,
  );
  checks.check(
    `${label}: the piece is taken where it lies (${(jump * 1000).toFixed(1)} mm across the take)`,
    jump <= diningTable.ON,
  );
  const fork: IAutoMovieRigidTransform = take.prop("fork", taken + INSTANT);
  const offset: number = Vector3.distance(
    take.prop("piece", taken + INSTANT).position,
    fork.position,
  );
  let slid: number = 0;
  for (let i: number = 0; i <= 24; ++i) {
    const t: number =
      taken + INSTANT + ((write.end - taken - INSTANT) * i) / 24;
    slid = Math.max(
      slid,
      Math.abs(
        Vector3.distance(
          take.prop("piece", t).position,
          take.prop("fork", t).position,
        ) - offset,
      ),
    );
  }
  checks.check(
    `${label}: the piece keeps its place on the fork (${(slid * 1000).toFixed(1)} mm)`,
    slid <= diningTable.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", write);
}
