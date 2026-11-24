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
import { motionStrokeUnit } from "../../internal/motionStrokeUnit";

/**
 * How far past the plate's centre line the knife's edge goes on each side of
 * the saw, metres: the original's 20 mm.
 */
const ACROSS: number = 0.02;

/**
 * The knife saws across the steak while the fork pins it, on its own: step 4
 * (write with a steadying fork) of `test_motion_dining_utensils_cut`,
 * right-handed on m-average and left-handed on f-small, entered by the minimal
 * chain sit > pickUp(fork) > pickUp(knife) (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The fork's tines stay on the food through the stroke, within `diningTable.ON`
 *    (10 mm) of where they pin it at the stroke's start.
 * 2. The knife's edge crosses the food: it goes 20 mm past the plate's centre line
 *    on each side.
 * 3. The knife's face stays on the steak's top through the stroke and passes every
 *    authored vertex, within `ON` plus the radius it declares.
 * 4. Knife and fork ride their hands through the write within 5 mm.
 * 5. The write keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "the fork's tines stay on the food through
 * the cut" and "the knife's edge crosses the food". The original reads both
 * between 30 and 70 % of the write's span; this unit reads them over the
 * stroke's own events, `strokeStart` to `strokeEnd`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies, every bound and the read span.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > pickUp > write and reads the fork's and the knife's displayed working points, the knife's face in the steak's writing frame at ten times the film rate, both tools in their hands' frames and the verdict report over the write's span; a fork that lets go of the food, a knife that does not cross it or lifts off it, a tool sliding or a finding in the write fails.
 * @evidence contracts/development/testing.md#independent-expectations The pin and surface bounds are the dining specs' `ON`; the crossing is the original's 20 mm against the plate's place; the vertices are the authored stroke; the custody bound is the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the out-of-reach plate is `test_motion_dining_cut_write_refusal`'s, the take and the bite their own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_cut_write_saw`.
 */
export function test_motion_dining_cut_write_saw(): void {
  diningTable.run("knife and fork: saw with the fork pinning", writeSaw);
}

/** One diner's saw and its checks. */
function writeSaw(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.ICut = diningScene.cut(side);
  const edge: number = scene.edge;
  const stroke: readonly (readonly [number, number])[] = [
    [edge, -0.03],
    [edge, 0.03],
    [edge, -0.03],
    [edge, 0.03],
  ];
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} knife and fork cut`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "fork", handle: "grip", hand: scene.other, lift: 0.05 })
      .pickUp({ prop: "knife", handle: "grip", hand: side, lift: 0.05 })
      .registered("write", {
        tool: "knife",
        tip: "face",
        on: "steak",
        surface: "top",
        stroke: [
          [edge, -0.03],
          [edge, 0.03],
          [edge, -0.03],
          [edge, 0.03],
        ],
        duration: 1.2,
        hand: side,

        // The fork pins a hand's breadth from the knife, as the original.
        steady: {
          tool: "fork",
          tip: "face",
          at: [edge - scene.sign * everydayTake.BREADTH * body.measure.hand, 0],
        },
      }),
  );
  const write: IAutoMovieMotionHumanSegment = motionStrokeUnit.stroke(
    checks,
    label,
    take,
    {
      subject: "actor",
      tool: "knife",
      toolModel: scene.models.knife!,
      tip: "face",
      on: "steak",
      onModel: scene.models.steak!,
      surface: "top",
      vertices: stroke,
    },
    diningTable.ON,
  );
  const from: number = motionActionUnit.event(write, "strokeStart");
  const to: number = motionActionUnit.event(write, "strokeEnd");
  const fork: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 =>
    everydayTake.point(take, scene.models.fork!, "fork", "face", t);
  const pin: IAutoMovieVector3 = fork(from);
  let pinned: number = 0;
  let lowest: number = Infinity;
  let highest: number = -Infinity;
  for (let i: number = 0; i <= 48; ++i) {
    const t: number = from + ((to - from) * i) / 48;
    pinned = Math.max(pinned, Vector3.distance(fork(t), pin));
    const blade: IAutoMovieVector3 = everydayTake.point(
      take,
      scene.models.knife!,
      "knife",
      "face",
      t,
    );
    lowest = Math.min(lowest, blade.z - scene.plate.z);
    highest = Math.max(highest, blade.z - scene.plate.z);
  }
  checks.check(
    `${label}: the fork's tines stay on the food through the cut (${(pinned * 1000).toFixed(1)} mm)`,
    pinned <= diningTable.ON,
  );
  checks.check(
    `${label}: the knife's edge crosses the food (${(lowest * 1000).toFixed(0)} to ${(highest * 1000).toFixed(0)} mm)`,
    lowest <= -ACROSS && highest >= ACROSS,
  );
  for (const [hand, tool] of [
    [side, "knife"],
    [scene.other, "fork"],
  ] as const) {
    const drift: number = everydayTake.drift(
      take,
      hand,
      tool,
      write.start,
      write.end,
    );
    checks.check(
      `${label}: the ${tool} rides the ${hand} hand through the saw (${(drift * 1000).toFixed(1)} mm)`,
      drift <= motionActionUnit.HOLD,
    );
  }
  motionActionUnit.bounds(checks, label, take, "actor", write);
}
