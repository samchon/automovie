import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEmbraceFromBehind,
} from "@automovie/interface";
import { embraceFromBehind, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `embraceFromBehind.plan` wraps the arms round a partner from behind, the chin
 * on a shoulder and the chest on the partner's back: the plan declares its
 * contacts on the partner and holds the authored seconds.
 *
 * Scenario, the average man standing at the origin facing +Z, the small woman
 * standing still 0.3 m ahead facing away: embracing her for 1 s declares at
 * least one contact window borne on her, and lasts longer than the hold.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_touch_embrace_from_behind(): Promise<void> {
  // Plans both arms, the trunk and the head on the whole body against the partner's colliders.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const small: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const ahead: motionActionContext.IPartner = {
    subject: "b",
    body: small,
    plan: stand.plan(
      motionActionContext(
        small,
        { hold: 8, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z: 0.3 }, yaw: 0 },
      ),
    ),
  };
  const params: IAutoMovieMotionHumanEmbraceFromBehind = {
    partner: "b",
    hold: 1,
  };
  const plan: IAutoMovieMotionHumanActionPlan = embraceFromBehind.plan(
    motionActionContext(body, params, { partners: [ahead] }),
  );
  TestValidator.predicate(
    "the embrace",
    plan.duration > params.hold &&
      plan.contacts.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.support.kind === "person" && w.support.subject === "b",
      ),
  );
}
