import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPursuit,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPursuit, run, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * `HumanPursuit.flee` runs straight away from a person: from where the
 * performer stands, along the level line from that person's sternum through the
 * performer, `FLIGHT` hip heights (or the metres asked) on.
 *
 * Two average men: `a` at the origin facing +Z, `b` standing 3 m ahead.
 *
 * Scenarios:
 *
 * 1. Fleeing `b`, `a` runs to `FLIGHT` hip heights behind it along −Z: the plan is
 *    the run to that point.
 * 2. Asked for 4 m, it runs to 4 m behind.
 * 3. No distance to run is refused.
 */
export async function test_unit_motions_lexicon_pursuit_flee(): Promise<void> {
  // Whole body: the run is the full gait law over the body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const partner: IAutoMovieMotionHumanActionPlan = stand.plan(
    motionActionContext(body, { hold: 10 }, { at: { x: 0, y: 0, z: 3 } }),
  );
  const flee = (
    params: IAutoMovieMotionHumanPursuit.IFlee,
  ): IAutoMovieMotionHumanActionPlan =>
    HumanPursuit.flee.plan(
      motionActionContext(body, params, {
        partners: [{ subject: "b", body, plan: partner }],
      }),
    );
  // Where `a` stands: its root over its feet, the line's start.
  const here: IAutoMovieVector3 = motionActionContext(body, {}).entry.posture
    .root;
  const ran = (metres: number): IAutoMovieMotionHumanActionPlan =>
    run.plan(
      motionActionContext(body, {
        to: { x: here.x, y: 0, z: here.z - metres },
      }),
    );
  const end = (plan: IAutoMovieMotionHumanActionPlan): IAutoMovieVector3 =>
    plan.posture(plan.duration).root;
  const away: number = HumanPursuit.FLIGHT * body.measure.hipHeight;
  TestValidator.predicate(
    "away from b",
    vclose(end(flee({ from: "b" })), end(ran(away)), 1e-6),
  );
  TestValidator.predicate(
    "four metres",
    vclose(end(flee({ from: "b", metres: 4 })), end(ran(4)), 1e-6),
  );
  TestValidator.predicate(
    "no distance",
    throwsError(() => flee({ from: "b", metres: 0 })),
  );
}
