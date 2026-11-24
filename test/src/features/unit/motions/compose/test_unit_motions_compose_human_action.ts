import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import { composeAutoMovieMotionHumanAction } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { linearMotionClock } from "../../../internal/synthetic/linearMotionClock";
import { syntheticHumanPlan } from "../../../internal/synthetic/syntheticHumanPlan";
import { throwsError } from "../../../internal/throwsError";

/**
 * `composeAutoMovieMotionHumanAction` writes each primitive whose window holds
 * a second onto the base's posture in channel order, plans each once when the
 * action is composed (`prepare`, in writing order), and solves what each reads
 * of other performers when the composed plan is prepared (`ready`, after the
 * base's own `prepare`).
 *
 * A neck nod over 0 to 1 s and a left elbow bend over 0.5 to 2 s on a 2 s still
 * base.
 *
 * Scenarios:
 *
 * 1. Composing plans each primitive once, the head before the arm, and readies
 *    none.
 * 2. At 0.75 s both write; at 1.5 s only the elbow; a channel no primitive claims
 *    keeps the base.
 * 3. The plan's `prepare` solves the base first, then readies each primitive in
 *    writing order; the claimed channels are the plan's.
 * 4. Two primitives on one channel at once, and a window past the action, are
 *    refused.
 */
export function test_unit_motions_compose_human_action(): void {
  const calls: string[] = [];
  const base: IAutoMovieMotionHumanActionPlan = {
    ...syntheticHumanPlan({ duration: 2 }),
    prepare: (): void => {
      calls.push("base");
    },
  };
  const primitive = (
    name: string,
    channel: "head" | "leftArm",
    from: number,
    to: number,
    bone: "neck" | "leftLowerArm",
  ): IAutoMovieMotionHumanPrimitive => ({
    channels: [channel],
    from,
    to,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      joints: { ...posture.joints, [bone]: [seconds * 10, 0, 0] },
    }),
    prepare: (): void => {
      calls.push(`plan ${name}`);
    },
    ready: (): void => {
      calls.push(`ready ${name}`);
    },
  });
  // Given arm first: the composer writes in channel order.
  const plan: IAutoMovieMotionHumanActionPlan =
    composeAutoMovieMotionHumanAction({
      base,
      clock: linearMotionClock(2, []),
      primitives: [
        primitive("elbow", "leftArm", 0.5, 2, "leftLowerArm"),
        primitive("nod", "head", 0, 1, "neck"),
      ],
    });

  // 1. Planned once, in writing order.
  TestValidator.equals("planned when composed", calls, [
    "plan nod",
    "plan elbow",
  ]);

  // 2. Writes by window.
  const both: IAutoMovieMotionHumanPosture = plan.posture(0.75);
  const late: IAutoMovieMotionHumanPosture = plan.posture(1.5);
  TestValidator.predicate(
    "each primitive writes inside its window",
    both.joints.neck?.[0] === 7.5 &&
      both.joints.leftLowerArm?.[0] === 7.5 &&
      late.joints.neck === undefined &&
      late.joints.leftLowerArm?.[0] === 15 &&
      late.root.y === 0.9,
  );

  // 3. Prepared on the placed performance.
  calls.length = 0;
  plan.prepare!();
  TestValidator.equals("the base, then each primitive", calls, [
    "base",
    "ready nod",
    "ready elbow",
  ]);
  TestValidator.equals("the claimed channels", plan.channels, [
    "head",
    "leftArm",
  ]);

  // 4. Refusals.
  TestValidator.predicate(
    "a shared channel and an outside window are refused",
    throwsError(
      (): IAutoMovieMotionHumanActionPlan =>
        composeAutoMovieMotionHumanAction({
          base,
          clock: linearMotionClock(2, []),
          primitives: [
            primitive("a", "head", 0, 1, "neck"),
            primitive("b", "head", 0.5, 1.5, "neck"),
          ],
        }),
    ) &&
      throwsError(
        (): IAutoMovieMotionHumanActionPlan =>
          composeAutoMovieMotionHumanAction({
            base,
            clock: linearMotionClock(2, []),
            primitives: [primitive("c", "head", 1, 3, "neck")],
          }),
      ),
  );
}
