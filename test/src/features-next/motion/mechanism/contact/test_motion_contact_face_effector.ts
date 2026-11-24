import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/**
 * A face-directed hand motion approaches the named anatomical site and leaves it after the task.
 *
 * Scenarios:
 * 1. Stage one unsupported right-hand wipe at the mouth and observe contact at the stroke boundaries.
 * 2. Bound the visible elbow transport between neighbouring frames.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A face-directed hand motion approaches the named anatomical site and leaves it after the task.
 * @evidence contracts/development/testing.md#independent-expectations The measured mouth is the independently transformed region and the hand uses its posed skin. Its 80 mm frame allowance is unchanged from the physical audit.
 * @evidence contracts/development/testing.md#distinguishing-cases Stage one unsupported right-hand wipe at the mouth and observe contact at the stroke boundaries. Bound the visible elbow transport between neighbouring frames.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_face_effector(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "wipe-mouth",
    [{ subject: "a", body }],
    HumanChain.subject("a").handToFace({ kind: "wipeMouth", hand: "right" }),
  );
  const start: number = motionHumanLaw.event(film, "strokeStart");
  const end: number = motionHumanLaw.event(film, "strokeEnd");
  const bounds: motionComplaints.IGatherer = motionComplaints();
  for (const t of [start, (start + end) / 2, end]) {
    const bones: motionHumanLaw.Bones = film.bones("a", t);
    const mouth: IAutoMovieVector3 = fixture.site(body, bones, "mouth");
    const distance: number = fixture.skin(body, bones, "right", mouth);
    bounds.check(
      `wiping hand at ${t} s: ${distance} m from the mouth`,
      Math.abs(distance) <= body.measure.hand,
    );
  }
  const travel: ReturnType<typeof motionHumanLaw.travel> =
    motionHumanLaw.travel(film, "a", "rightLowerArm");
  bounds.check(
    `elbow ${travel.value} m at ${travel.seconds} s`,
    travel.value <= 0.08,
  );
  const released: motionHumanLaw.Bones = film.bones("a", film.duration);
  bounds.check(
    "after release the hand has left the mouth",
    fixture.skin(
      body,
      released,
      "right",
      fixture.site(body, released, "mouth"),
    ) > 0.01,
  );
  bounds.assert("the hand wipes the face and returns to rest");
}
