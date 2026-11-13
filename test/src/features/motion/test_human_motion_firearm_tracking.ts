import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanWeaponFirearm,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A presented weapon that tracks stays on a target that moves: with
 * `track`, the line of the aiming hand keeps passing the walking person's
 * sternum, and without it the line stays where the person was.
 *
 * The bound is the firearm family's declared dispersion, 1 degree between
 * the bore's line and the aim point (#3348). The empty hand stands in for
 * the weapon, as the family's laws allow: its line runs from the wrist
 * through the middle finger's knuckle, the axis the law aims. One film per
 * case on one pair of bodies keeps the test well under a minute; the
 * geometry is a rotation about the eye, which does not depend on the
 * build, so a second pair would repeat it.
 *
 * Scenarios, the average man aiming at the small woman 3 m ahead, who
 * stands 0.5 s and then walks 1.5 m to her left:
 * 1. With `track`, at 1.5 s, 2.5 s and 3.3 s of the film the hand's line
 *    passes within 1 degree of her sternum.
 * 2. Without it, at 3.3 s the hand's line is more than 10 degrees off her
 *    sternum: the aim stayed where she stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and reads both displayed bodies; an aim that lags, leads or stays behind fails with the angle.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the family's declared dispersion; the target is the displayed sternum and the line the displayed hand's own joints; nothing is read from a plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Tracking at three instants across the walk against the same scene without tracking.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and two short films without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bound's source, why one pair suffices and the 2 scenarios.
 */
export function test_human_motion_firearm_tracking(): void {
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const complaints: string[] = [];
  const off = (track: boolean, seconds: number): number => {
    const film: HumanPerformance = new HumanPerformance({
      seed: "tracking",
      laws: [HumanWeaponFirearm.present],
      performers: [
        {
          subject: "a",
          body: bodies.a,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body: bodies.b,
          at: { x: 0, y: 0, z: 3 },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],

      // The walker is composed first: the aim reads her placed path.
      composition: HumanChain.subject("b")
        .stand({ seconds: 0.5 })
        .walk({ to: { x: 1.5, y: 0, z: 3 } })
        .stand({ seconds: 1.5 })
        .with(
          HumanChain.subject("a")
            .stand({ seconds: 0.3 })
            .registered("presentFirearm", {
              target: { kind: "person", subject: "b", region: "sternum" },
              hands: 1,
              seconds: 3,
              track,
            }),
        ).node,
    });
    const held: HumanSegment.ISegment | undefined = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "presentFirearm");
    if (held === undefined || seconds < held.start || seconds > held.end)
      throw new Error(`the presentation does not cover ${seconds} s`);
    const aimer: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      bodies.a,
      0,
    );
    const wrist: IAutoMovieVector3 = HumanSignature.joint(
      aimer,
      seconds,
      "rightHand",
    );
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        HumanSignature.joint(aimer, seconds, "rightMiddleProximal"),
        wrist,
      ),
    );
    const sternum: IAutoMovieVector3 = HumanSignature.region(
      HumanSignature.of(film, "b", bodies.b, 180),
      "sternum",
      seconds,
    );
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            Vector3.dot(line, Vector3.normalize(Vector3.subtract(sternum, wrist))),
          ),
        ),
      ) *
        180) /
      Math.PI
    );
  };

  // 1. Tracking keeps the line on her.
  for (const seconds of [1.5, 2.5, 3.3]) {
    const angle: number = off(true, seconds);
    if (!(angle <= 1))
      complaints.push(
        `tracking: at ${seconds} s the hand's line passes ${angle.toFixed(2)} degrees from her sternum, 1 degree at most expected`,
      );
  }

  // 2. Without tracking the aim stays where she stood.
  const left: number = off(false, 3.3);
  if (!(left > 10))
    complaints.push(
      `not tracking: at 3.3 s the hand's line is ${left.toFixed(2)} degrees from her sternum, more than 10 expected`,
    );
  TestValidator.equals("a tracking aim follows its target", complaints, []);
}
