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
 * `track`, the weapon's working point keeps to the sight line from the
 * aimer's eye to the walking person's sternum, and without it the point
 * stays on the line to where the person was.
 *
 * The empty hand stands in for the weapon, as the family's laws allow: its
 * working point is at the knuckles, read here by the middle finger's
 * knuckle joint, which rides the hand rigidly, and the eye is the head's
 * joint, as the law takes it. The bound is the motion campaign's 15 mm
 * contact bound, taken on how far that joint's distance from the sight
 * line departs from what a presentation at a standing target shows. One film per case on one pair of
 * bodies keeps the test well under a minute; the geometry is a rotation
 * about the eye, which does not depend on the build, so a second pair
 * would repeat it.
 *
 * Not pinned here: the bore's direction, which the firearm shot test pins
 * with a pistol. The first runs of this test read the empty hand's long
 * axis 17 to 20 degrees off the sight line, when `presentFirearm` judged
 * its pose by the muzzle's point alone; it now judges both ends of the
 * bore.
 *
 * Scenarios, the average man aiming at the small woman 3 m ahead, who
 * stands 0.5 s and then walks 1.5 m to her left:
 * 1. With `track`, at 1.5 s, 2.5 s and 3.3 s of the film the knuckle is as
 *    far from the line from the eye to her sternum as it is when she
 *    stands still instead of walking, within 15 mm (that joint lies about
 *    47 mm off the line on these bodies, the same at every instant read,
 *    so the distance itself is not zero).
 * 2. Without it, at 3.3 s the knuckle is more than 100 mm farther from
 *    that line: the aim stayed where she stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and reads both displayed bodies; an aim that lags, leads or stays behind fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the campaign's contact bound; the line runs between two displayed joints of two bodies and the point is a displayed joint; nothing is read from a plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Tracking at three instants across the walk against the same scene without tracking.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and five short films without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the bound's source, why one pair suffices and the 2 scenarios.
 */
export function test_human_motion_firearm_tracking(): void {
  const bodies: Record<"a" | "b", IHumanBody> = {
    a: motionHumanBody("m-average"),
    b: motionHumanBody("f-small"),
  };
  const complaints: string[] = [];
  const off = (
    track: boolean,
    seconds: number,
    walks: boolean = true,
  ): number => {
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
      composition: (walks
        ? HumanChain.subject("b")
            .stand({ seconds: 0.5 })
            .walk({ to: { x: 1.5, y: 0, z: 3 } })
            .stand({ seconds: 1.5 })
        : HumanChain.subject("b").stand({ seconds: 4 })
      ).with(
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
    const knuckle: IAutoMovieVector3 = HumanSignature.joint(
      aimer,
      seconds,
      "rightMiddleProximal",
    );
    const eye: IAutoMovieVector3 = HumanSignature.joint(aimer, seconds, "head");
    const sternum: IAutoMovieVector3 = HumanSignature.region(
      HumanSignature.of(film, "b", bodies.b, 180),
      "sternum",
      seconds,
    );
    // The knuckle's distance from the sight line, millimetres.
    const sight: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(sternum, eye),
    );
    const from: IAutoMovieVector3 = Vector3.subtract(knuckle, eye);
    return (
      1000 *
      Vector3.length(
        Vector3.subtract(from, Vector3.scale(sight, Vector3.dot(from, sight))),
      )
    );
  };

  // 1. Tracking keeps the knuckle where a still target has it.
  const still: number = off(true, 2.5, false);
  for (const seconds of [1.5, 2.5, 3.3]) {
    const away: number = off(true, seconds);
    if (!(Math.abs(away - still) <= 15))
      complaints.push(
        `tracking: at ${seconds} s the knuckle is ${away.toFixed(1)} mm from the line from the eye to her sternum, within 15 mm of the ${still.toFixed(1)} mm it keeps on a target that stands expected`,
      );
  }

  // 2. Without tracking the aim stays where she stood.
  const left: number = off(false, 3.3);
  if (!(left - still > 100))
    complaints.push(
      `not tracking: at 3.3 s the knuckle is ${left.toFixed(1)} mm from the line from the eye to her sternum, more than 100 mm expected`,
    );
  TestValidator.equals("a tracking aim follows its target", complaints, []);
}
