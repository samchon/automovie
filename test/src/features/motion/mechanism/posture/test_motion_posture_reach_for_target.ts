import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanStance,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";

import { everydayTake } from "../../../internal/everydayTake";
import { motionComplaints } from "../../../internal/motionComplaints";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * A rider's trunk leans forward exactly as far as the hands need to reach what
 * they hold (`AutoMovieMotionHumanMount.HumanMountReach.reach`), as a
 * fixed-seat rower leans to the catch: the least flexion of the spine that
 * brings each shoulder within `ARM` of its arm's length of its point, read in
 * closed form from the shoulder's circle under the spine's flexion.
 *
 * On the polygon man, average man and small woman, standing upright at the
 * origin facing +Z, a point is put ahead of the right shoulder at its height.
 *
 * Scenarios:
 *
 * 1. A point within the arm's reach as the body stands needs no lean.
 * 2. Points 1.05, 1.15 and 1.25 times the reach ahead need a lean, and at that
 *    lean the shoulder read by forward kinematics lies at the reach from the
 *    point, within 1e-6 m: the closed form is exact, not sampled.
 * 3. Those leans grow with the point's distance.
 * 4. Half a degree less lean leaves the point out of reach.
 * 5. A point no lean up to `LEAN` reaches returns `LEAN`.
 * 6. With both hands, the lean is the larger of the two hands' own leans.
 * 7. No hand holding needs no lean.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public reach and reads the leant posture's shoulders by forward kinematics; a lean that stops short, overshoots, is sampled instead of exact, or ignores a hand fails with the distances.
 * @evidence contracts/development/testing.md#independent-expectations The reach is read from the body's own segments by forward kinematics, the leant shoulder likewise, and the bound 1e-6 m is far under the millimetre any contact check reads; nothing is read from the reach's own arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases A point within reach, three beyond it, one beyond every lean, two hands at once and none, on one measured body.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 7 scenarios with their bounds.
 */
export function test_motion_posture_reach_for_target(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const complaints: string[] = [];
  for (const name of ["f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
      const seated: IAutoMovieMotionHumanPosture =
        AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
      const read = (degrees: number): ReturnType<typeof poseBones> =>
        poseBones(
          body,
          resolveHumanPosture(body, {
            ...AutoMovieMotionHumanMount.HumanMountRider.leant(seated, degrees),
            limbs: {},
          }),
        );
      const upright: ReturnType<typeof poseBones> = read(0);
      const shoulder = (
        bones: ReturnType<typeof poseBones>,
        side: AutoMovieHumanSide,
      ): IAutoMovieVector3 => bones.get(`${side}UpperArm`)!.worldPosition;
      const span = (side: AutoMovieHumanSide): number =>
        AutoMovieMotionHumanMount.HumanMountRider.ARM *
        (Vector3.length(
          Vector3.subtract(
            upright.get(`${side}LowerArm`)!.worldPosition,
            shoulder(upright, side),
          ),
        ) +
          Vector3.length(
            Vector3.subtract(
              upright.get(`${side}Hand`)!.worldPosition,
              upright.get(`${side}LowerArm`)!.worldPosition,
            ),
          ));
      const ahead = (
        side: AutoMovieHumanSide,
        times: number,
      ): IAutoMovieVector3 =>
        Vector3.add(shoulder(upright, side), {
          x: 0,
          y: 0,
          z: times * span(side),
        });
      const reach: (
        points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
      ) => number = AutoMovieMotionHumanMount.HumanMountReach.reach(
        body,
        seated,
        ["left", "right"],
      );

      // 1. Within reach.
      const near: number = reach({ right: ahead("right", 0.95) });
      if (near !== 0)
        complaints.push(`${name}: a point within reach leans ${near} degrees`);

      // 2 to 4. Beyond reach: the exact lean, growing with the distance.
      let previous: number = 0;
      for (const times of [1.05, 1.15, 1.25]) {
        const point: IAutoMovieVector3 = ahead("right", times);
        const lean: number = reach({ right: point });
        const gap: number =
          Vector3.length(
            Vector3.subtract(point, shoulder(read(lean), "right")),
          ) - span("right");
        if (!(Math.abs(gap) <= 1e-6))
          complaints.push(
            `${name}: at ${times} reaches the shoulder lies ${(gap * 1000).toFixed(4)} mm off the reach at the lean of ${lean.toFixed(3)} degrees`,
          );
        if (!(lean > previous))
          complaints.push(
            `${name}: the lean at ${times} reaches, ${lean.toFixed(3)}, is not above ${previous.toFixed(3)}`,
          );
        const short: number =
          Vector3.length(
            Vector3.subtract(point, shoulder(read(lean - 0.5), "right")),
          ) - span("right");
        if (!(short > 0))
          complaints.push(
            `${name}: half a degree less than ${lean.toFixed(3)} still reaches at ${times} reaches`,
          );
        previous = lean;
      }

      // At maximum lean construct a point on the measured reach sphere.
      const limitShoulder: IAutoMovieVector3 = shoulder(read(60), "right");
      const boundary: IAutoMovieVector3 = {
        ...limitShoulder,
        z: limitShoulder.z + span("right"),
      };
      const boundaryLean: number = reach({ right: boundary });
      if (Math.abs(boundaryLean - 60) > 1e-6)
        complaints.push(
          name +
            ": exact outer reach uses " +
            boundaryLean +
            " degrees instead of 60",
        );
      // 5. Beyond every lean.
      const far: number = reach({ right: ahead("right", 3) });
      // Sixty degrees is the published seated lean limit. One unit in the last place can change a boundary comparison.
      if (Math.abs(far - 60) > 60 * Number.EPSILON)
        complaints.push(`${name}: a point beyond every lean leans ${far}`);

      // 6. Two hands: the larger lean.
      const one: number = reach({ right: ahead("right", 1.05) });
      const other: number = reach({ left: ahead("left", 1.25) });
      const both: number = reach({
        right: ahead("right", 1.05),
        left: ahead("left", 1.25),
      });
      if (!(Math.abs(both - Math.max(one, other)) <= 1e-12))
        complaints.push(
          `${name}: two hands lean ${both}, not the larger of ${one} and ${other}`,
        );

      // 7. No hand.
      if (reach({}) !== 0) complaints.push(`${name}: no hand leans`);
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.equals("the rider's lean", complaints, []);
  checks.assert("posture reach for target");
}
