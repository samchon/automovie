import { createBag } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";

/**
 * A bag passed from hand to hand without being set down, on its own: the
 * change-hands scene of `test_motion_mechanism_carriage`, moved here whole
 * since the change is the scene (the right hand takes the tote by its strap,
 * the left takes its handle, the right lets go), on the average man and the
 * small woman.
 *
 * Scenarios:
 *
 * 1. Each pickUp closes its hand on its handle (`motionGraspUnit.pickUp`: the
 *    grasp and pickUp contracts): the right on the strap, the left on the
 *    handle while the right still holds.
 * 2. Both hands hold only briefly: the right lets go at most the original's 1.5 s
 *    after the left's pickUp ends.
 * 3. After the release the left hand bears the bag within the original's 5 mm.
 * 4. The bag is never set down: from the left's pickUp on it stays above the
 *    original's 300 mm.
 * 5. The take passes the shipped verdicts, and the release keeps the shipped
 *    bounds over its own span.
 *
 * The original's scene but for its refusal, which is
 * `test_motion_mechanism_carriage_overload_refusal`'s, so the integration spec
 * no longer plays it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original scene it moves, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > pickUp(right) > pickUp(left) > release(right) and reads the displayed hands and tote, with the whole verdict and the release's bounds; a hand off its handle, a long two-handed hold, a bag slipping from the left hand, a bag set down or a finding fails.
 * @evidence contracts/development/testing.md#independent-expectations The overlap, custody and height bounds are the original's; the grasps' places are the pickUp contract's on the archetype's `strap` and `handle`.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; one hand against two, then the other one.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_change_hands`.
 */
export function test_motion_mechanism_carriage_change_hands(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} changes hands`;
    try {
      change(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a bag changes hands without being set down");
}

/** One body's change and its checks. */
function change(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const tote: everydayTake.IPosable = createBag({ id: "tote", kind: "tote" });
  const take: HumanPerformance = carriageScene.perform(
    `${label} change hands`,
    body,
    // Before the body, where either hand reaches its handles.
    [everydayTake.prop("tote", tote, { x: 0, y: 0.7, z: 0.35 })],
    HumanChain.subject("actor")
      .stand()
      .pickUp({ prop: "tote", handle: "strap", hand: "right", lift: 0 })
      .pickUp({ prop: "tote", handle: "handle", hand: "left", lift: 0 })
      .release({ hand: "right" }),
  );
  try {
    everydayTake.clean(label, take);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "right",
    prop: "tote",
    model: tote,
    handle: "strap",
    lift: 0,
  });
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "left",
    prop: "tote",
    model: tote,
    handle: "handle",
    lift: 0,
    occurrence: 2,
  });
  const second: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "pickUp",
    2,
  );
  const release: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
    take,
    "actor",
    "release",
  );
  const overlap: number = release.end - second.end;
  checks.check(
    `${label}: both hands hold only briefly (${overlap.toFixed(2)} s)`,
    overlap <= carriageScene.OVERLAP,
  );
  const held: number = everydayTake.drift(
    take,
    "left",
    "tote",
    release.end,
    take.duration,
  );
  checks.check(
    `${label}: the left hand bears the bag after the change (${(held * 1000).toFixed(1)} mm)`,
    held <= carriageScene.HOLD,
  );
  let low: number = Infinity;
  for (
    let t: number = second.start;
    t <= take.duration;
    t += 1 / motionActionUnit.RATE
  )
    low = Math.min(low, take.prop("tote", t).position.y);
  checks.check(
    `${label}: the bag is never set down (lowest ${(low * 1000).toFixed(0)} mm)`,
    low > carriageScene.CARRIED,
  );
  motionActionUnit.bounds(checks, label, take, "actor", release);
}
