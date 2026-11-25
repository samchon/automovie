import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
} from "@automovie/interface";
import { HumanRefusal, kiss, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `kiss.plan` refuses what its own rules cannot reach before any body is moved:
 * a partner beyond what the rise and the lean can close is refused on `region`
 * as a reach; a hand-kiss role on a region that is not the back of a hand is
 * refused on `region` as a parameter.
 *
 * Scenarios, two average men facing, `b` standing still:
 *
 * 1. `b` two statures away: `a` kissing his cheek is refused on `region`, a reach
 *    refusal.
 * 2. `b` 0.35 m away: a `kisser` role on his cheek is refused on `region`, a
 *    parameter refusal.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_touch_kiss(): Promise<void> {
  // Reads the partner's displayed surfaces and the reach of the body's lean.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const partner = (z: number): motionActionContext.IPartner => ({
    subject: "b",
    body,
    plan: stand.plan(
      motionActionContext(
        body,
        { hold: 6, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z }, yaw: 180 },
      ),
    ),
  });
  const refusal = (
    params: IAutoMovieMotionHumanKiss.IParams,
    z: number,
  ): HumanRefusal | undefined => {
    try {
      kiss.plan(motionActionContext(body, params, { partners: [partner(z)] }));
      return undefined;
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error : undefined;
    }
  };
  const far: HumanRefusal | undefined = refusal(
    { partner: "b", region: "cheekRight" },
    2 * body.measure.stature,
  );
  const role: HumanRefusal | undefined = refusal(
    { partner: "b", region: "cheekRight", handRole: "kisser" },
    0.35,
  );
  TestValidator.predicate(
    "the refusals",
    far?.kind === "reach" &&
      far.axis === "region" &&
      role?.kind === "parameter" &&
      role.axis === "region",
  );
}
