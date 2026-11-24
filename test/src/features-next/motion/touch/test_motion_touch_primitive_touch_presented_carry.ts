import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * The quiet arm presents the forearm surface that the other hand touches, then releases it.
 *
 * Scenarios:
 * 1. Ask the right hand to touch the left forearm and read the two surfaces from their own displayed bones.
 * 2. Read the presenting wrist relative to the body before presentation, during contact and on release.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The quiet arm presents the forearm surface that the other hand touches, then releases it.
 * @evidence contracts/development/testing.md#independent-expectations The contact target is the independently transformed forearm region. The returning wrist should reach its original body-relative location within the 10 mm contact allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Ask the right hand to touch the left forearm and read the two surfaces from their own displayed bones. Read the presenting wrist relative to the body before presentation, during contact and on release.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_touch_primitive_touch_presented_carry(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "scratch-forearm",
    [{ subject: "a", body }],
    HumanChain.subject("a").touch({
      target: { kind: "self", region: "forearmLeft" },
      hand: "right",
      kind: "press",
    }),
  );
  const ready: number = motionHumanLaw.event(film, "ready");
  const relax: number = motionHumanLaw.event(film, "relax");
  const all: motionComplaints.IGatherer = motionComplaints();
  const wrist = (s: number): IAutoMovieVector3 => {
    const bones: motionHumanLaw.Bones = film.bones("a", s);
    return Vector3.subtract(
      bones.get("leftHand")!.worldPosition,
      bones.get("hips")!.worldPosition,
    );
  };
  const presented: IAutoMovieVector3 = wrist(ready);
  for (const t of [ready, (ready + relax) / 2, relax]) {
    const bones: motionHumanLaw.Bones = film.bones("a", t);
    const gap: number = fixture.skin(
      body,
      bones,
      "right",
      fixture.site(body, bones, "forearmLeft"),
    );
    all.check(
      `the active hand meets the presented forearm at ${t}: ${gap} m`,
      Math.abs(gap) <= 0.01,
    );
    all.check(
      "the presentation holds in the hips frame",
      Vector3.distance(wrist(t), presented) <= 0.01,
    );
  }
  all.check(
    "the presentation moves away from the entry wrist",
    Vector3.distance(wrist(0), presented) > 0.01,
  );
  all.check(
    "the presenting wrist returns",
    Vector3.distance(wrist(film.duration), wrist(0)) <= 0.01,
  );
  all.assert("the carried presentation owns the passive arm");
}
