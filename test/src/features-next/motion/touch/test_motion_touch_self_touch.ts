import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";

/**
 * A right palm follows its performer's upper-trunk skin throughout the active hold.
 *
 * Scenarios:
 * 1. Place the palm on the forehead and inspect the skin gap at arrival and release.
 * 2. Check the elbow's largest frame displacement during transport and its final departure from the skin.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A right palm follows its performer's upper-trunk skin throughout the active hold.
 * @evidence contracts/development/testing.md#independent-expectations Distance is read from the posed hand colliders to the independently transformed forehead. The original travel allowance is 80 mm per 24 Hz frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Place the palm on the forehead and inspect the skin gap at arrival and release. Check the elbow's largest frame displacement during transport and its final departure from the skin.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_touch_self_touch(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "facepalm",
    [{ subject: "a", body }],
    HumanChain.subject("a").touch({
      target: { kind: "self", region: "forehead" },
      kind: "press",
      effector: "palm",
    }),
  );
  const ready: number = motionHumanLaw.event(film, "ready");
  const relax: number = motionHumanLaw.event(film, "relax");
  const all: motionComplaints.IGatherer = motionComplaints();
  const gap = (seconds: number): number => {
    const bones: motionHumanLaw.Bones = film.bones("a", seconds);
    return fixture.skin(
      body,
      bones,
      "right",
      fixture.site(body, bones, "forehead"),
    );
  };
  for (const t of [ready, (ready + relax) / 2, relax])
    all.check(`forehead skin at ${t}: ${gap(t)} m`, Math.abs(gap(t)) <= 0.01);
  const max: ReturnType<typeof motionHumanLaw.travel> = motionHumanLaw.travel(
    film,
    "a",
    "rightLowerArm",
  );
  all.check(`elbow displacement: ${max.value} m`, max.value <= 0.08);
  all.check("release leaves the skin", gap(film.performance.duration) > 0.01);
  for (const region of ["templeLeft", "templeRight"] as const) {
    try {
      const lateral: motionHumanLaw.IFilm = motionHumanLaw.perform(
        "temple",
        [{ subject: "a", body }],
        HumanChain.subject("a").touch({
          target: { kind: "self", region },
          hand: "left",
          kind: "press",
          effector: "palm",
        }),
      );
      const t: number = motionHumanLaw.event(lateral, "ready");
      const bones: motionHumanLaw.Bones = lateral.bones("a", t);
      const distance: number = fixture.skin(
        body,
        bones,
        "left",
        fixture.site(body, bones, region),
      );
      all.check(
        "the left hand reaches " + region + " with skin gap " + distance,
        Math.abs(distance) <= 0.01,
      );
    } catch (error: unknown) {
      all.check(region + " contact: " + String(error), false);
    }
  }
  all.assert("self touch owns its approach, hold and release");
}
