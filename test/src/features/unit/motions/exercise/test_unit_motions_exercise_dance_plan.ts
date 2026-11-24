import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDance,
} from "@automovie/interface";
import { dance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `dance.plan` locks a solo step to a declared beat: beat `k` at `k 60 / bpm`
 * seconds, the step ending a beat after its last.
 *
 * The average man stands at the origin facing +Z; 4 beats at 120 bpm fall at
 * 0.5, 1, 1.5 and 2 s.
 *
 * Scenarios:
 *
 * 1. The step lasts 2.5 s, each `beat{k}` at its second and `relax` on the last
 *    beat.
 * 2. A bounce lowers the hips by 1 % of the stature on a beat (1 s) from where
 *    they are between beats (0.75 s).
 * 3. A sway to the right stands the hips half the feet's spacing to the right on
 *    the first beat and as far to the left on the second.
 * 4. A waltz on any step but the box is refused.
 */
export async function test_unit_motions_exercise_dance_plan(): Promise<void> {
  // Whole body: each step stands and bends over the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = (
    params: IAutoMovieMotionHumanDance.IParams,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDance.IParams> =>
    motionActionContext(body, params);
  const bounce: IAutoMovieMotionHumanActionPlan = dance.plan(
    context({ kind: "bounce", count: 4 }),
  );
  const at = (name: string): number =>
    bounce.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * bounce.duration;
  TestValidator.predicate(
    "the beats",
    nclose(bounce.duration, 2.5, 1e-12) &&
      [1, 2, 3, 4].every((k: number): boolean =>
        nclose(at(`beat${k}`), 0.5 * k, 1e-12),
      ) &&
      nclose(at("relax"), 2, 1e-12),
  );
  TestValidator.predicate(
    "the bounce",
    nclose(
      bounce.posture(1).root.y - bounce.posture(0.75).root.y,
      -0.01 * body.measure.stature,
      1e-9,
    ),
  );

  const swaying: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDance.IParams> =
    context({ kind: "sway", count: 4, side: "right" });
  const sway: IAutoMovieMotionHumanActionPlan = dance.plan(swaying);
  const half: number =
    Vector3.distance(
      swaying.entry.feet.left.ankle,
      swaying.entry.feet.right.ankle,
    ) / 2;
  const aside = (t: number): number =>
    sway.posture(t).root.x - swaying.entry.posture.root.x;
  TestValidator.predicate(
    "the sway",
    nclose(aside(0.5), -half, 1e-9) && nclose(aside(1), half, 1e-9),
  );

  TestValidator.predicate(
    "a waltz off the box",
    throwsError(() => dance.plan(context({ kind: "bounce", waltz: {} }))),
  );
}
