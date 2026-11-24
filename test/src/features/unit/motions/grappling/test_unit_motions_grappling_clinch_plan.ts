import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClinch,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import { clinch, stand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * `clinch.plan` takes a clinch grip on a partner standing within reach: each
 * hand reaches its region of the partner, the grip closes, holds `hold` seconds
 * unscaled by the manner's tempo, and lets go; each hand grips the partner as a
 * person support on its region.
 *
 * The average man faces a standing partner of the same body 0.45 m ahead.
 *
 * Scenarios:
 *
 * 1. A plum held 3 s lasts exactly 1 s longer than one held 2 s.
 * 2. Both hands grip the partner on the nape; a right collar-and-sleeve grip takes
 *    the left collar with the right hand and the right elbow with the left.
 * 3. A negative hold is refused, and so is an absent partner.
 */
export async function test_unit_motions_grappling_clinch_plan(): Promise<void> {
  // Whole body: the reach solves both arms over the full rig and reads the
  // partner's colliders.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const partner: IAutoMovieMotionHumanActionPlan = stand.plan(
    motionActionContext(
      body,
      { hold: 10 },
      {
        subject: "b",
        at: { x: 0, y: 0, z: 0.45 },
        yaw: 180,
      },
    ),
  );
  const plan = (
    params: IAutoMovieMotionHumanClinch.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    clinch.plan(
      motionActionContext(body, params, {
        partners: [{ subject: "b", body, plan: partner }],
      }),
    );
  const grips = (
    p: IAutoMovieMotionHumanActionPlan,
  ): [string, string | undefined][] =>
    p.contacts
      .filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.kind === "grip",
      )
      .map(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): [string, string | undefined] => [
          w.part,
          w.support.kind === "person" ? w.support.region : undefined,
        ],
      )
      .sort();

  // 1. The hold.
  TestValidator.predicate(
    "a second longer hold",
    nclose(
      plan({ partner: "b", hold: 3 }).duration -
        plan({ partner: "b", hold: 2 }).duration,
      1,
      1e-9,
    ),
  );

  // 2. The grips.
  TestValidator.equals(
    "the plum and the collar and sleeve",
    [
      grips(plan({ partner: "b" })),
      grips(plan({ partner: "b", grip: "collarSleeve" })),
    ],
    [
      [
        ["leftHand", "nape"],
        ["rightHand", "nape"],
      ],
      [
        ["leftHand", "elbowRight"],
        ["rightHand", "neckLeft"],
      ],
    ],
  );

  // 3. Refusals.
  TestValidator.predicate(
    "a negative hold, an absent partner",
    throwsError(() => plan({ partner: "b", hold: -1 })) &&
      throwsError(() => plan({ partner: "c" })),
  );
}
