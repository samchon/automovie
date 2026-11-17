import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanChain, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanSegment, IAutoMovieVector3 } from "@automovie/interface";
import {
  getConstraint,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";

import { HumanChain, HumanForceTrunk, HumanPerformance, HumanSocial, armWrestle, seated } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A pinned arm wrestler's trunk is bent by the force exchanged (#3439, the
 * claim the composition campaign handed it): at the pin the loser's trunk
 * bends toward the pin's side by the share of its side-bending range whose
 * stiffness holds the torque its shoulder resists with, and the winner's
 * trunk does not bend.
 *
 * The expected share is derived here from the sources, not read from the
 * law: the shoulder's eccentric internal-rotation peak, 0.65 N m per
 * kilogram of body mass (Tasiopoulos et al. 2018, Front Physiol 9:1597,
 * Table 2, male controls at 60 degrees a second; provisional for women),
 * held by the trunk's lateral bending stiffness by quarter of its range,
 * 0.32, 0.83, 2.03 and 5.03 N m per degree (Watt, Callaway and Williams
 * 2022, Med Biol Eng Comput 60(8), Table 6), integrated over the bend. The
 * stage is `test_human_motion_social_arm_wrestle`'s: the two seated face to
 * face, the table's top above the seat and the clasp over its point, with
 * its stated provisional sizes, the struggle cut to one second and a pin
 * of 45 degrees. A joint angle is read within 1 degree, the bound the
 * carried spec reads a trunk's lean to.
 *
 * Scenarios, the average man (a) winning against the small woman (b) and
 * against the average woman (b):
 * 1. At `pin` the loser's spine and chest side-bend toward its own right,
 *    the pin's side, by the derived share of their ranges, within 1 degree
 *    each, from their bend at `go`.
 * 2. The winner's spine and chest side bend changes by at most 1 degree
 *    from `go` to `pin`.
 * 3. Metamorphic: the heavier loser, whose shoulder resists more, bends by
 *    no smaller a share than the lighter one.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Seats two performers, joins them through the public arm wrestle record and reads the placed postures' trunk joints at the shared events; a loser that does not bend, bends the wrong way or by another amount, or a winner that bends fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The share is derived in the test from the two cited tables and the body's range, not read from `HumanForceTrunk.share`; the 1 degree bound is the carried spec's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two losers of different mass, the loser and the winner, two events.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds two seated performances; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the claim, the derivation with its sources, the stage and the 3 scenarios.
 */
export function test_human_motion_arm_wrestle_force(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const ROTATION: number = 0.65;
  const LATERAL: readonly number[] = [0.32, 0.83, 2.03, 5.03];
  const DEGREE: number = 1;
  const shares: number[] = [];
  for (const loser of ["f-small", "f-average"] as const) {
    const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
      a: motionHumanBody("m-average"),
      b: motionHumanBody(loser),
    };
    const apart: number = 0.45;
    const top: number = seated.popliteal(bodies.a) + 0.27;
    const table: IAutoMovieVector3 = { x: 0, y: top, z: 0.275 };
    const sits = (who: "a" | "b"): IAutoMovieMotionHumanChain => {
      const behind: number = bodies[who].rest.get("leftFoot")!.z - 0.1;
      return HumanChain.subject(who).sit({
        seat: {
          at: {
            x: 0,
            y: seated.popliteal(bodies[who]),
            z: who === "a" ? behind : apart - behind,
          },
          yaw: who === "a" ? 0 : 180,
          depth: 0.45,
        },
      });
    };
    let film: IAutoMovieMotionHumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "wrestle",
        laws: [armWrestle],
        performers: (["a", "b"] as const).map((subject: "a" | "b") => ({
          subject,
          body: bodies[subject],
          at: { x: 0, y: 0, z: subject === "a" ? 0 : apart },
          yaw: subject === "a" ? 0 : 180,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.mutual(
          HumanSocial.armWrestle,
          { one: sits("a"), other: sits("b") },
          { table, winner: "one", seconds: 1, pin: 45 },
        ).node,
      });
    } catch (error) {
      all.check(
        `against ${loser}: the contest plans, refused with ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    const instant = (who: "a" | "b", event: string): number => {
      const placed: IAutoMovieMotionHumanSegment.ISegment = film.segments(who)[1]!;
      return (
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration
      );
    };
    const bendOf = (who: "a" | "b", seconds: number, bone: "spine" | "chest"): number =>
      film.posture(who, seconds).joints[bone]?.[1] ?? 0;

    // The derived share: the torque the loser's shoulder resists with, held
    // by the stiffness integrated over the bend.
    const torque: number =
      ROTATION *
      resolveAutoMovieCenterOfMass(bodies.b.skeleton, bodies.b.profile).mass;
    const range: number = HumanForceTrunk.range(bodies.b, "right");
    let left: number = torque;
    let share: number = 1;
    for (let q: number = 0; q < LATERAL.length; q++) {
      const holds: number = (LATERAL[q]! * range) / LATERAL.length;
      if (left <= holds) {
        share = (q + left / holds) / LATERAL.length;
        break;
      }
      left -= holds;
    }
    shares.push(share);

    // 1. The loser bends toward its right by that share of each range.
    const go: number = instant("b", "go");
    const pin: number = instant("b", "pin");
    for (const bone of ["spine", "chest"] as const) {
      const before: number = bendOf("b", go, bone);
      const after: number = bendOf("b", pin, bone);
      // The joint's own range end on the right, the end the bend goes to.
      const end: number =
        getConstraint(
          bone,
          bodies.b.skeleton.bones.find((b) => b.bone === bone)?.constraint ??
            null,
        )?.abduction?.max ?? 0;
      const expected: number = before + share * (end - before);
      all.check(
        `against ${loser}: the loser's ${bone} side-bends to ${after.toFixed(1)} degrees at the pin from ${before.toFixed(1)} at go, ${expected.toFixed(1)} within ${DEGREE} expected (share ${share.toFixed(3)} of the range, torque ${torque.toFixed(1)} N m)`,
        Math.abs(after - expected) <= DEGREE,
      );
    }

    // 2. The winner does not bend.
    for (const bone of ["spine", "chest"] as const) {
      const change: number = Math.abs(
        bendOf("a", instant("a", "pin"), bone) -
          bendOf("a", instant("a", "go"), bone),
      );
      all.check(
        `against ${loser}: the winner's ${bone} side bend changes by ${change.toFixed(2)} degrees from go to pin, ${DEGREE} at most expected`,
        change <= DEGREE,
      );
    }
  }

  // 3. The heavier loser bends no less.
  if (shares.length === 2)
    all.check(
      `the average woman bends by a share of ${shares[1]!.toFixed(3)}, the small woman by ${shares[0]!.toFixed(3)}: no smaller for the heavier expected`,
      shares[1]! >= shares[0]!,
    );
  all.assert("a pinned arm wrestler's trunk is bent by the force exchanged");
}
