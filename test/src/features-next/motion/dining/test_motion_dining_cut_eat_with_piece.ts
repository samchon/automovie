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
 * How near the piece comes to the head bone at the bite's middle, metres: the
 * original's 0.15 m (`diningTable.mouth`).
 */
const BITE: number = 0.15;

/**
 * The fork carries the taken piece to the mouth, on its own: step 6 (eatWith)
 * of `test_motion_dining_utensils_cut`, the fork in the left hand on m-average
 * and the right on f-small, entered by the minimal chain sit > pickUp(fork) >
 * write(take), without the knife and the saw (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. At the bite's middle the piece lies within the original's 0.15 m of the head
 *    bone it reads the mouth by.
 * 2. The piece rides the fork from the take: its distance to the fork's frame at
 *    the bite's middle differs from the one at the take's end by at most
 *    `diningTable.HOLD` (5 mm).
 * 3. The fork rides the hand through the bite within 5 mm.
 * 4. The bite keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "the cut piece follows the fork to the
 * mouth" and "the piece rides the fork from the take".
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and checks, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp > write > eatWith and reads the piece's and the fork's displayed frames, the displayed head bone and the verdict report over the bite's span; a piece left behind or short of the mouth, a fork sliding or a finding in the bite fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the original's: the 0.15 m mouth bound against the head bone and the 5 mm custody bound, read on the displayed props.
 * @evidence contracts/development/testing.md#distinguishing-cases Left- against right-hand forks on two statures; the take is `test_motion_dining_cut_write_take`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_cut_eat_with_piece`.
 */
export function test_motion_dining_cut_eat_with_piece(): void {
  diningTable.run("knife and fork: carry the piece to the mouth", eatPiece);
}

/** One diner's bite with the piece and its checks. */
function eatPiece(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.ICut = diningScene.cut(side);
  const edge: number = scene.edge;
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
      })
      .registered("eatWith", {
        held: "fork",
        point: "face",
        hand: scene.other,
      }),
  );
  const spear: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "write",
  );
  const bite: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "eatWith",
  );
  const middle: number = (bite.start + bite.end) / 2;
  const off: number = Vector3.distance(
    take.prop("piece", middle).position,
    diningTable.mouth(take, middle),
  );
  checks.check(
    `${label}: the cut piece follows the fork to the mouth (${(off * 1000).toFixed(0)} mm from the head bone)`,
    off <= BITE,
  );
  const offset: number = Vector3.distance(
    take.prop("piece", spear.end).position,
    take.prop("fork", spear.end).position,
  );
  const rode: number = Math.abs(
    Vector3.distance(
      take.prop("piece", middle).position,
      take.prop("fork", middle).position,
    ) - offset,
  );
  checks.check(
    `${label}: the piece rides the fork from the take (${(rode * 1000).toFixed(1)} mm)`,
    rode <= diningTable.HOLD,
  );
  const drift: number = everydayTake.drift(
    take,
    scene.other,
    "fork",
    bite.start,
    bite.end,
  );
  checks.check(
    `${label}: the fork rides the hand through the bite (${(drift * 1000).toFixed(1)} mm)`,
    drift <= motionActionUnit.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", bite);
}
