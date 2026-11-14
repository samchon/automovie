import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * A touch's arm carried to the face and back moves without a step: the
 * goal's end of the carry is the goal's fit at fixed seconds of each
 * stretch, carried between neighbouring fits (`AutoMovieMotionHumanArmCarry`'s
 * `ICarry.stretch`), so a fit that would choose between two near-equal arms
 * differently from one instant to the next no longer steps the arm shown.
 *
 * Wiping the mouth with the right hand on the average man stepped its upper
 * arm 3.7 degrees and its wrist 17.6 mm within a 480th of a second of the way
 * back (`test_human_motion_law_hand_to_face_wipe_mouth`'s audit). The spec
 * reads the displayed elbow and wrist joints every 480th of a second over the
 * way there (`start` to `ready`) and the way back (`relax` to the film's end).
 *
 * Scenario: no step of the elbow or the wrist in a 480th of a second exceeds
 * 1.5 times the peak speed of a minimum-jerk movement along the same path in
 * the same time, 1.875 times the path's length over the stretch's duration
 * (Flash and Hogan 1985, J Neurosci 5:1688; the carry's weight follows that
 * profile); the 1.5 is provisional, for a joint-space blend's uneven speed
 * along its path. A step between two arms adds its whole size to one step.
 *
 * The bound is on the step, not on the acceleration. Searched: peak hand
 * acceleration in reaching and in the drinking task. No paper read reports
 * it in m/s²; the drinking task's control subjects reach a peak hand speed of
 * 551 and 560 mm/s over phases of 1.21 and 1.00 s (Murphy, Sunnerhagen,
 * Johnels and Willén 2006, J Neuroeng Rehabil 3:18, table 2), which the
 * minimum-jerk relation (peak acceleration 5.77 D/T² against peak speed
 * 1.875 D/T) puts at 1.4 to 1.7 m/s². A bound on the second difference at
 * that acceleration also reads the clearing course's turn, piecewise linear
 * in its keys by design (`HumanArmClearing.course`), whose change of slope
 * at a key is not a step: the readings that tripped a 1 mm second difference
 * changed only the upper arm's abduction's rate, the course's own joint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law through the chain and reads displayed joints at the audit's finest step; an arm that steps between two fits fails with the bone, the second, the size and the arm's joints around it.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the minimum-jerk speed of the film's own path (Flash and Hogan 1985) with a stated provisional margin, not read from the law or its keys; the searched acceleration and why it is not the bound are stated.
 * @evidence contracts/development/testing.md#distinguishing-cases Both stretches of the carry, where the goal moves and the fit is read at keys, on the task whose arm stepped; the hold, where the arm is the goal's own fit, is the law specs'.
 * @evidence contracts/development/testing.md#execution-ownership In memory, one film of one body; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the measured defect, what is read, the one scenario with its source and its provisional margin, and the searched alternative.
 */
export function test_human_motion_compose_arm_carry_keyed(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "carry-keyed",
    [{ subject: "a", body }],
    HumanChain.subject("a").act("handToFace", {
      task: "wipeMouth",
      side: "right",
    }),
  );
  const step: number = 1 / 480;
  const complaints: string[] = [];
  for (const [from, to] of [
    [0, motionHumanLaw.event(film, "ready")],
    [motionHumanLaw.event(film, "relax"), film.duration],
  ] as const) {
    const count: number = Math.floor((to - from) / step);
    for (const bone of [
      "rightLowerArm",
      "rightHand",
    ] as const satisfies readonly AutoMovieHumanoidBone[]) {
      const at = (i: number): IAutoMovieVector3 =>
        film.bones("a", from + i * step).get(bone)!.worldPosition;
      const steps: number[] = Array.from(
        { length: count },
        (_: unknown, i: number): number => {
          const a: IAutoMovieVector3 = at(i);
          const b: IAutoMovieVector3 = at(i + 1);
          return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
        },
      );
      const path: number = steps.reduce(
        (s: number, d: number): number => s + d,
        0,
      );
      const limit: number = 1.5 * 1.875 * (path / (to - from)) * step;
      const worst: number = Math.max(...steps);
      const when: number = from + steps.indexOf(worst) * step;
      // The right arm's joints around a reading, so a complaint says which
      // joint turned: the clearing turns only the upper arm's abduction and
      // the elbow's flexion, a fit every joint.
      const arm = (seconds: number): string =>
        film.performance
          .pose("a", seconds)
          .joints.filter((joint: IAutoMovieJointPose): boolean =>
            ["rightUpperArm", "rightLowerArm", "rightHand"].includes(
              joint.bone,
            ),
          )
          .map(
            (joint: IAutoMovieJointPose): string =>
              `[${(joint.flexion ?? 0).toFixed(2)}, ${(joint.abduction ?? 0).toFixed(2)}, ${(joint.twist ?? 0).toFixed(2)}]`,
          )
          .join(" ");
      if (!(worst <= limit))
        complaints.push(
          `${bone}: it steps ${(worst * 1000).toFixed(2)} mm within a 480th of a second at ${when.toFixed(4)} s (${from.toFixed(2)} to ${to.toFixed(2)} s, a ${(path * 1000).toFixed(0)} mm path), at most ${(limit * 1000).toFixed(2)} mm expected; the arm at, and a step after, it: ${[0, 1].map((k: number): string => arm(when + k * step)).join(" | ")}`,
        );
    }
  }
  TestValidator.equals("the carried arm moves continuously", complaints, []);
}
