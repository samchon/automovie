import {
  preparePhysicalGeometry as Geometry,
  auditAutoMovieOutcome,
  measureAutoMovieContact,
} from "@automovie/engine";
import type {
  IAutoMovieAuditOutcome,
  IAutoMovieMeasureContact,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/** Contact is measured between displayed colliders and feeds the outcome audit unchanged.
 *
 * Scenarios:
 * 1. Two 0.1 m spheres 0.19 m apart compress by 0.01 m and yield a contact record that satisfies a required-contact audit.
 * 2. The same spheres 0.25 m apart separate by 0.05 m, yield no record, and the audit reports the missing contact.
 * 3. A side without declared colliders refuses.
 */
export async function test_unit_engine_composition_contact(): Promise<void> {
  const queries: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry();
  const profile: P = PhysicalFixtures.sphere(0.1);
  const side = (
    subject: string,
    x: number,
  ): IAutoMovieMeasureContact.ISide => ({
    subject,
    region: subject === "a" ? "hand" : "head",
    profile,
    segments: {
      root: {
        position: { x, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    bones: ["root"],
  });
  const touching: IAutoMovieMeasureContact.IResult = measureAutoMovieContact({
    a: side("a", 0),
    b: side("b", 0.19),
    queries,
    seconds: 1,
  });
  const apart: IAutoMovieMeasureContact.IResult = measureAutoMovieContact({
    a: side("a", 0),
    b: side("b", 0.25),
    queries,
    seconds: 1,
  });
  const outcome: IAutoMovieAuditOutcome.IOutcome = {
    id: "lands",
    required: [
      {
        a: { subject: "a", region: "hand" },
        b: { subject: "b", region: "head" },
        window: { start: 0.9, end: 1.1 },
      },
    ],
  };
  TestValidator.predicate(
    `measured contact (${touching.separation}, ${apart.separation})`,
    Math.abs(touching.separation + 0.01) < 1e-6 &&
      touching.contact !== null &&
      auditAutoMovieOutcome(outcome, [touching.contact]).length === 0 &&
      Math.abs(apart.separation - 0.05) < 1e-6 &&
      apart.contact === null &&
      auditAutoMovieOutcome(outcome, []).length === 1,
  );
  let refused: boolean = false;
  try {
    measureAutoMovieContact({
      a: { ...side("a", 0), bones: ["none"] },
      b: side("b", 0.19),
      queries,
      seconds: 1,
    });
  } catch {
    refused = true;
  }
  TestValidator.predicate("no colliders refuses", refused);
}
