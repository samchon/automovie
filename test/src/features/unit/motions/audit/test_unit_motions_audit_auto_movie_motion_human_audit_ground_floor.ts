import type {
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditGround } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanAuditGround.floor` reads how deep any collider sinks
 * below the floor under the person: the floor's height less the collider's
 * lowest point, zero when nothing sinks.
 *
 * Scenarios, the average man's quiet stance held for 1 s, both feet planted,
 * displaced as a whole:
 *
 * 1. Raised 0.5 m, nothing sinks: zero at `none`.
 * 2. Sunk 0.2 m and then 0.1 m, the same collider sinks deepest and its depths
 *    differ by the 0.1 m between them: a uniform translation moves every
 *    collider's lowest point with it.
 * 3. Sunk 0.1 m with the feet planted on a 0.3 m bank, the depth is 0.3 m deeper
 *    than on the world floor.
 *
 * The body is built whole (`humanFixtureBody`): the reading places the body's
 * colliders on its displayed bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_ground_floor(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const read = (
    y: number,
    bank: number = 0,
  ): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditGround.floor(
      auditStanceMotion(body, {
        shift: () => ({ x: 0, y, z: 0 }),
        contacts: auditStanceMotion.plants({ kind: "ground", height: bank }),
      }),
      "a",
      body,
      4,
    );
  TestValidator.equals("raised", read(0.5), {
    value: 0,
    seconds: 0,
    where: "none",
  });
  const deep: IAutoMovieMotionHumanAuditMeasure = read(-0.2);
  const shallow: IAutoMovieMotionHumanAuditMeasure = read(-0.1);
  TestValidator.predicate(
    "sunk",
    deep.where === shallow.where &&
      nclose(deep.value - shallow.value, 0.1, ROUNDING),
  );
  TestValidator.predicate(
    "on a bank",
    nclose(read(-0.1, 0.3).value - shallow.value, 0.3, ROUNDING),
  );
}
