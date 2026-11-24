import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKuzushi,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { kuzushi } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `kuzushi.plan` breaks a standing base: the body turns as one about its
 * ankles' midpoint by `depth` forward over `TIP` (0.5 s) on a minimum-jerk
 * share, holds for `hold`, and comes back over `TIP`; `broken` marks the full
 * lean and `relax` the start back.
 *
 * The average man stands at the origin; he is tipped 15 degrees and held 1 s.
 *
 * Scenarios:
 *
 * 1. The plan lasts `2 · 0.5 + 1` = 2 s; `broken` falls at a quarter, `relax` at
 *    three quarters.
 * 2. The tip is 0 at the start, 7.5 degrees at 0.25 s (the minimum-jerk share one
 *    half), 15 through the hold and 0 again at the end.
 * 3. A rigid turn about the ankles keeps the root as far from them.
 * 4. A depth past 30 degrees, or a negative hold, is refused.
 */
export async function test_unit_motions_grappling_kuzushi_plan(): Promise<void> {
  // Whole body: the context stands the body in its quiet stance, resolving the
  // full rig and its planted feet.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = (
    params: IAutoMovieMotionHumanKuzushi.IParams,
  ): IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKuzushi.IParams> =>
    motionActionContext(body, params);
  const tipped: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKuzushi.IParams> =
    context({ depth: 15, hold: 1 });
  const plan: IAutoMovieMotionHumanActionPlan = kuzushi.plan(tipped);

  // 1. Timing.
  TestValidator.equals(
    "the timing",
    [plan.duration, plan.events],
    [
      2,
      [
        { name: "broken", share: 0.25 },
        { name: "relax", share: 0.75 },
      ],
    ],
  );

  // 2. The tip.
  const start: IAutoMovieMotionHumanPosture = plan.posture(0);
  const tip = (seconds: number): number =>
    plan.posture(seconds).pitch - start.pitch;
  TestValidator.predicate(
    "the minimum-jerk tip",
    tip(0) === 0 &&
      nclose(tip(0.25), 7.5, 1e-9) &&
      nclose(tip(0.5), 15, 1e-9) &&
      nclose(tip(1.2), 15, 1e-9) &&
      nclose(tip(2), 0, 1e-9),
  );

  // 3. About the ankles.
  const pivot: IAutoMovieVector3 = {
    x: (tipped.entry.feet.left.ankle.x + tipped.entry.feet.right.ankle.x) / 2,
    y: (tipped.entry.feet.left.ankle.y + tipped.entry.feet.right.ankle.y) / 2,
    z: (tipped.entry.feet.left.ankle.z + tipped.entry.feet.right.ankle.z) / 2,
  };
  const reach = (p: IAutoMovieMotionHumanPosture): number =>
    Math.hypot(p.root.x - pivot.x, p.root.y - pivot.y, p.root.z - pivot.z);
  TestValidator.predicate(
    "turned about the ankles",
    nclose(reach(plan.posture(1)), reach(start), 1e-9),
  );

  // 4. Refusals.
  TestValidator.predicate(
    "too deep, or a negative hold",
    throwsError(() => kuzushi.plan(context({ depth: 40 }))) &&
      throwsError(() => kuzushi.plan(context({ hold: -1 }))),
  );
}
