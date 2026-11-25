import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * `AutoMovieMotionHumanAuditBalance.margin` reads the margin of stability at
 * one instant: the extrapolated centre's distance inside the base of support,
 * positive inside, the velocity a central difference over `STEP` either side.
 *
 * Scenarios, the average man's quiet stance, both feet planted:
 *
 * 1. Still, the centre lies inside the feet's hull, by no more than half the
 *    foot's length (the centre stands between heel and toe).
 * 2. Every bone but the feet carried 0.5 m forward, it lies outside: negative.
 * 3. Moving forward as a whole at 1 m/s, the extrapolated centre leads the still
 *    one by `v / omega0` and the margin falls accordingly: less than the still
 *    margin.
 *
 * The body is built whole (`humanFixtureBody`): the reading places the body's
 * mass model and its soles on the displayed bones.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_balance_margin(): Promise<void> {
  // Reads the whole-body centre of mass (`body.massModel`, every segment's mass) and the soles.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const still: number = AutoMovieMotionHumanAuditBalance.margin(
    auditStanceMotion(body, { contacts: auditStanceMotion.plants() }),
    "a",
    body,
    body.massModel,
    0.5,
  );
  TestValidator.predicate(
    "still",
    still > 0 && still <= body.measure.footLength / 2,
  );
  const leaned: number = AutoMovieMotionHumanAuditBalance.margin(
    auditStanceMotion(body, {
      contacts: auditStanceMotion.plants(),
      pose: (bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>) =>
        new Map(
          [...bones].map(
            ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
              AutoMovieHumanoidBone,
              IAutoMovieResolvedBone,
            ] => [
              name,
              /(Foot|Toes)$/.test(name)
                ? bone
                : {
                    ...bone,
                    worldPosition: Vector3.add(bone.worldPosition, {
                      x: 0,
                      y: 0,
                      z: 0.5,
                    }),
                  },
            ],
          ),
        ),
    }),
    "a",
    body,
    body.massModel,
    0.5,
  );
  TestValidator.predicate("leaned", leaned < 0);
  const moving: number = AutoMovieMotionHumanAuditBalance.margin(
    auditStanceMotion(body, {
      contacts: auditStanceMotion.plants(),
      shift: (t: number) => ({ x: 0, y: 0, z: t }),
    }),
    "a",
    body,
    body.massModel,
    0.5,
  );
  TestValidator.predicate("moving", moving < still);
}
