import { createBall } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * A floor pickup of a ball and the pass that follows it pass the shipped take
 * verdicts on the extreme and the average body: no segment enters another, no
 * finger sinks under the floor, no joint pops or spins between frames, and the
 * cut from the pickup into the pass is continuous.
 *
 * Scenarios:
 *
 * 1. The small woman, the average man and the large man each pick a basketball up
 *    from the floor in front of them and chest-pass it; the whole take passes
 *    the verdicts at the film rate with the shipped limits.
 *
 * The limits are the motion audit's own (`HumanVerdicts`), read on the
 * displayed bones; ball-sports found `tangle`, `floor`, `jump` and `turn`
 * findings in exactly this sequence.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sequence, the bodies and the verdicts with their source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs pickUp and the chest pass through HumanPerformance and asserts the take verdicts over the displayed take; any penetration, floor, jump or turn finding fails with its act, part and second.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the audit's shipped physical limits, independent of the pick-up law.
 * @evidence contracts/development/testing.md#distinguishing-cases The two extreme bodies and the average one; the pass after the pickup exercises the cut out of a holding hand.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man and one ball.
 */
export function test_motion_prehension_pickup_verdicts(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const aim: IAutoMovieVector3 = { x: 0, y: 1.3, z: 3.45 };
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: `pickup-verdicts-${name}`,
        performers: [
          {
            subject: "guard",
            body: motionHumanBody(name),
            at: { x: 0, y: 0, z: 1.2 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("ball", ball, {
            position: { x: 0, y: 0, z: 1.69 },
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("guard")
          .pickUp({ prop: "ball", handle: "grip", lift: 0.15 })
          .ballSport(
            { kind: "chestPass", prop: "ball", at: aim, flightSeconds: 0.42 },
            "pass",
          ).node,
      });
      verdict(checks, `${name} floor pickup and chest pass`, performance);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("prehension pickup verdicts");
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
