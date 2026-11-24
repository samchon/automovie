import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * Opposite shoulders constrain both hands in one simultaneous self-contact.
 *
 * Scenarios:
 * 1. Use the original crossed-arm posture and its declared permissible rests.
 * 2. At the held interval inspect each hand against the other shoulder; inspect elbow travel on both sides.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Opposite shoulders constrain both hands in one simultaneous self-contact.
 * @evidence contracts/development/testing.md#independent-expectations The target for each hand is a distinct body-local skin site transformed by displayed FK. A valid held contact has a 10 mm allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Use the original crossed-arm posture and its declared permissible rests. At the held interval inspect each hand against the other shoulder; inspect elbow travel on both sides.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_crossing_crossing_arm_reach(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "hug-self",
    [{ subject: "a", body }],
    HumanChain.subject("a").touch({
      target: { kind: "self", region: "shoulderLeft" },
      other: { kind: "self", region: "shoulderRight" },
      kind: "squeeze",
      rests: [
        { hand: "first", part: "lowerArm", on: "leftLowerArm" },
        { hand: "first", part: "lowerArm", on: "chest" },
        { hand: "first", part: "upperArm", on: "chest" },
        { hand: "other", part: "lowerArm", on: "rightLowerArm" },
        { hand: "other", part: "lowerArm", on: "chest" },
        { hand: "other", part: "upperArm", on: "chest" },
      ],
    }),
  );
  const all: motionComplaints.IGatherer = motionComplaints();
  const ready: number = motionHumanLaw.event(film, "ready");
  const relax: number = motionHumanLaw.event(film, "relax");
  for (const [side, region] of [
    ["right", "shoulderLeft"],
    ["left", "shoulderRight"],
  ] as const) {
    for (const t of [ready, (ready + relax) / 2, relax]) {
      const bones: motionHumanLaw.Bones = film.bones("a", t);
      const gap: number = fixture.skin(
        body,
        bones,
        side,
        fixture.site(body, bones, region),
      );
      all.check(
        `${side} hand at ${region}, ${t}: ${gap} m`,
        Math.abs(gap) <= 0.01,
      );
    }
    const travel: ReturnType<typeof motionHumanLaw.travel> =
      motionHumanLaw.travel(film, "a", `${side}LowerArm`);
    all.check(
      `${side} elbow transport: ${travel.value} m`,
      travel.value <= 0.08,
    );
  }
  all.assert("each crossed hand retains its own attachment");
}
