import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditGround";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of a few sums, metres. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanAuditGround.lift` reads the farthest a planted foot's
 * contact lies from its declared stationary surface, `|y - height|`; a foot
 * planted on a prop declares no stationary height and is not read.
 *
 * Scenarios, the average man's quiet stance, both feet planted for 1 s:
 *
 * 1. Raised 0.03 m and then 0.01 m, the lifts differ by the 0.02 m between them,
 *    with the quiet stance's soles within the skin of the floor.
 * 2. Raised 0.1 m with the feet planted on a 0.1 m tread, the lift is the quiet
 *    stance's on the floor.
 * 3. Raised 0.1 m with the feet planted on a prop, nothing is read.
 *
 * The body is built whole (`humanFixtureBody`): the contact is the foot's
 * lowest sole socket on the displayed bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names two lifted floor plants, a lift matching a tread height and an excluded prop support.
 * @evidence contracts/development/testing.md#behavioral-verification Queries AuditGround.lift with stored-body plants and three authored support cases, comparing returned vertical distances.
 * @evidence contracts/development/testing.md#independent-expectations Raising 0.03 m versus 0.01 m gives a 0.02 m difference. Raising both the body and its declared ground by 0.1 m preserves their relative height, while the prop supplies no stationary plane.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_ground_lift(): Promise<void> {
  // Reads the body's foot sole geometry (`HumanFoot.sockets`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const lift = (
    y: number,
    contacts: ReturnType<typeof auditStanceMotion.plants>,
  ): number =>
    AutoMovieMotionHumanAuditGround.lift(
      auditStanceMotion(body, { shift: () => ({ x: 0, y, z: 0 }), contacts }),
      "a",
      body,
      4,
    ).value;
  const floor: ReturnType<typeof auditStanceMotion.plants> =
    auditStanceMotion.plants();
  TestValidator.predicate(
    "raised",
    nclose(lift(0.03, floor) - lift(0.01, floor), 0.02, ROUNDING),
  );
  TestValidator.predicate(
    "on a tread",
    nclose(
      lift(0.1, auditStanceMotion.plants({ kind: "ground", height: 0.1 })),
      lift(0, floor),
      ROUNDING,
    ),
  );
  TestValidator.equals(
    "on a prop",
    lift(0.1, auditStanceMotion.plants({ kind: "prop", subject: "board" })),
    0,
  );
}
