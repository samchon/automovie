import { physicalShapeBounds } from "@automovie/engine";
import {
  HumanChain,
  HumanColliders,
  HumanPerformance,
  type IHumanBody,
  workout,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A workout's body never passes under the floor: not on its way down from
 * standing, not while it works, not on its way up, wherever its supported
 * posture rests on the floor.
 *
 * The bound is the floor audit's, 5 mm (`AutoMovieMotionHumanAudit`'s
 * `floor`), read as that audit reads it: the lowest point of every
 * collider of the displayed body, at every twenty-fourth of a second.
 *
 * Scenarios, on the smallest and the largest body of the sweep (`f-small`
 * and `m-large`), one repetition of each kind:
 * 1. Kinds whose supported posture rests on the floor and whose way down
 *    from standing carried the root through it: `superman`, `crunch`,
 *    `lyingLegRaise`, `pnfHamstring` and `benchPress`, held 0.5 s.
 * 2. `sidePlank` at the core class's own parameters (one repetition held
 *    1.5 s), whose forearm and fingers sank while it was held.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each kind through the public chain and reads the displayed colliders through the whole act; a way down that carries the root through the floor, or a held pose that sinks a limb into it, fails with the kind, the bone, the instant and the depth.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm bound is the floor audit's for any human motion.
 * @evidence contracts/development/testing.md#distinguishing-cases Kinds lying on the front and on the back, raised on a bench and on one forearm, on two extreme bodies; a kind whose keyed supported posture itself sinks is a fault of its keys, not of the floor rule; a body hanging from a bar, which the floor does not carry, is the hanging kinds' own spec's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds twelve short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bound with its source and how it is read, and the 2 scenarios.
 */
export function test_human_motion_workout_floor(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const LIMIT: number = 0.005;
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    for (const [kind, hold] of [
      ["superman", 0.5],
      ["crunch", 0.5],
      ["lyingLegRaise", 0.5],
      ["pnfHamstring", 0.5],
      ["benchPress", 0.5],
      ["sidePlank", 1.5],
    ] as const) {
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "workout-floor",
          laws: [workout],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a").registered("workout", {
            kind,
            reps: 1,
            hold,
          }).node,
        });
      } catch (error) {
        all.check(
          `${name} ${kind}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
        continue;
      }
      let worst: { depth: number; bone: string; seconds: number } = {
        depth: 0,
        bone: "none",
        seconds: 0,
      };
      for (
        let seconds: number = 0;
        seconds <= performance.duration + 1e-9;
        seconds += 1 / 24
      )
        for (const { bone, pose, shapes } of HumanColliders.placed(
          body,
          performance.bones("a", seconds),
        ))
          for (const shape of shapes) {
            const depth: number = -physicalShapeBounds(pose, shape).min.y;
            if (depth > worst.depth) worst = { depth, bone, seconds };
          }
      all.check(
        `${name} ${kind}: the ${worst.bone} sinks ${(worst.depth * 1000).toFixed(1)} mm under the floor at ${worst.seconds.toFixed(2)} s, within ${LIMIT * 1000} expected`,
        worst.depth <= LIMIT,
      );
    }
  }
  all.assert("a workout's body stays on the floor");
}
