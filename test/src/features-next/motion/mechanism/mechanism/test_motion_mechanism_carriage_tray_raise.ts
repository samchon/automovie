import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";

/**
 * A tray raised level on the palm just under shoulder height, on its own: the
 * workHeld of the tray scene of `test_motion_mechanism_carriage`, on the
 * average man and the small woman, entered by the minimal chain stand > pickUp
 * (the tray on the palm).
 *
 * Scenarios, read at the raise's end, where the original reads them as the walk
 * starts:
 *
 * 1. The tray lies level: its up within the original's 10 degrees of the world's.
 * 2. The palm lies under the tray's centre: the wrist within the original's 100 mm
 *    of the tray's origin, read level, and below it.
 * 3. The bowl stays on the tray over the raise: its distance from the tray's
 *    origin changes by at most the original's 5 mm.
 * 4. The raise keeps the shipped bounds over its own span.
 *
 * Decomposes the original's palm check, and reads its level and bowl checks at
 * the raise's own end; their hold through the walks is the integration spec's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and checks, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp > workHeld(level) and reads the displayed tray, bowl and right hand at the raise's end, with the verdict report over its span; a tilted tray, a palm off its centre or above it, a bowl sliding off or a finding in the raise fails.
 * @evidence contracts/development/testing.md#independent-expectations The level, centring and custody bounds are the original's; the raise's level is the workHeld's asked `level`.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; taking the tray is `test_motion_mechanism_carriage_tray_pick_up`'s and carrying it through the walks the integration spec's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_tray_raise`.
 */
export function test_motion_mechanism_carriage_tray_raise(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} raises the tray`;
    try {
      raise(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a tray is raised level on the palm under its centre");
}

/** One body's raise and its checks. */
function raise(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const take: HumanPerformance = carriageScene.perform(
    `${label} tray raise`,
    body,
    carriageScene.trayProps(),
    carriageScene.raise(
      carriageScene.lift(HumanChain.subject("actor").stand()),
      body,
    ),
  );
  const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "workHeld",
  );
  const tilt: number = carriageScene.tilt(take, "tray", act.end);
  checks.check(
    `${label}: the tray lies level (${tilt.toFixed(1)} degrees)`,
    tilt <= carriageScene.LEVEL,
  );
  const palm: IAutoMovieVector3 = take
    .bones("actor", act.end)
    .get("rightHand")!.worldPosition;
  const centre: IAutoMovieVector3 = take.prop("tray", act.end).position;
  const off: number = Vector3.distance({ ...palm, y: 0 }, { ...centre, y: 0 });
  checks.check(
    `${label}: the palm lies under the tray's centre (${(off * 1000).toFixed(0)} mm, read level; ${((centre.y - palm.y) * 1000).toFixed(0)} mm below)`,
    off <= carriageScene.CENTRE && palm.y < centre.y,
  );
  const moved: number = Math.abs(
    carriageScene.bowl(take, act.end) - carriageScene.bowl(take, act.start),
  );
  checks.check(
    `${label}: the bowl stays on the tray (${(moved * 1000).toFixed(1)} mm)`,
    moved <= carriageScene.HOLD,
  );
  motionActionUnit.bounds(checks, label, take, "actor", act);
}
