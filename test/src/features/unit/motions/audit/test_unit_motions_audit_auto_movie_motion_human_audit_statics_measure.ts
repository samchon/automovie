import type {
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditStatics } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `AutoMovieMotionHumanAuditStatics.measure` reads how far, horizontally, the
 * centre of mass of a held body lies outside the load-weighted Minkowski sum of
 * its contact patches, the points the support forces' resultant can pass
 * through (static equilibrium of a rigid body).
 *
 * Scenarios, the average man's quiet stance held still for 1 s:
 *
 * 1. Each foot bearing half the weight: the centre lies over the region between
 *    the feet, so nothing is read.
 * 2. The left foot declared to bear it all: the region is the left sole alone, and
 *    the centre, near the midline, lies outside it by more than nothing and
 *    less than the hips' half width, the most a foot under the hip joint lies
 *    from the midline, on both windows.
 * 3. A window without a declared load is not read.
 *
 * The body is built whole (`humanFixtureBody`): the reading places the body's
 * mass model and its soles on the displayed bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_statics_measure(): Promise<void> {
  // Reads the whole-body centre of mass (`body.massModel`, every segment's mass) and the soles.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const read = (
    contacts: ReturnType<typeof auditStanceMotion.plants>,
  ): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditStatics.measure(
      auditStanceMotion(body, { contacts }),
      "a",
      body,
      4,
    );
  TestValidator.equals(
    "shared",
    read(auditStanceMotion.plants({ kind: "ground" }, [0.5, 0.5])).value,
    0,
  );
  const one: IAutoMovieMotionHumanAuditMeasure = read(
    auditStanceMotion.plants({ kind: "ground" }, [1, 0]),
  );
  TestValidator.predicate(
    "one foot bears it all",
    one.value > 0 &&
      one.value < body.measure.hipHalfWidth &&
      one.where === "stand leftFoot 1, stand rightFoot 0",
  );
  TestValidator.equals("undeclared", read(auditStanceMotion.plants()).value, 0);
}
