import { AutoMovieEnginePhysicalGeometry as Geometry, AutoMovieEngineCompositionOutcome, AutoMovieEngineCompositionContact } from "@automovie/engine";
import type {
  IAutoMovieAuditOutcome,
  IAutoMovieMeasureContact,
  IAutoMoviePhysicalProfile,
  IAutoMoviePreparePhysicalGeometry,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";

/** Rounding of a collider query, metres. */
const ROUNDING: number = 1e-6;

/**
 * `measureContact` measures the contact between two subjects'
 * displayed colliders, and its record feeds the outcome audit
 * (`auditOutcome`) unchanged.
 *
 * Scenarios, two 0.1 m spheres at 1 m height:
 *
 * 1. 0.19 m apart they compress by 0.01 m (separation -0.01) and yield a contact
 *    record that satisfies a required hand-on-head contact over 0.9 to 1.1 s.
 * 2. 0.25 m apart they separate by 0.05 m, yield no record, and the audit reports
 *    the missing contact.
 * 3. A side whose bones declare no colliders is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the overlapping sphere pair, the disjoint pair and refusal of a requested bone set without colliders.
 * @evidence contracts/development/testing.md#behavioral-verification Prepares the physical queries and calls CompositionContact.measure on posed 0.1 m sphere colliders, then passes the present contact to CompositionOutcome.audit.
 * @evidence contracts/development/testing.md#independent-expectations Subtracting the combined 0.2 m radii from centre gaps 0.19 and 0.25 gives -0.01 and 0.05 m to one micrometre. Only the first produces a contact in the required time and region.
 */
export async function test_engine_composition_measure_contact(): Promise<void> {
  const queries: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry.prepare();
  const profile: IAutoMoviePhysicalProfile = PhysicalFixtures.sphere(0.1);
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
  const touching: IAutoMovieMeasureContact.IResult = AutoMovieEngineCompositionContact.measure({
    a: side("a", 0),
    b: side("b", 0.19),
    queries,
    seconds: 1,
  });
  const apart: IAutoMovieMeasureContact.IResult = AutoMovieEngineCompositionContact.measure({
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
    "the measured contacts",
    Math.abs(touching.separation + 0.01) < ROUNDING &&
      touching.contact !== null &&
      AutoMovieEngineCompositionOutcome.audit(outcome, [touching.contact]).length === 0 &&
      Math.abs(apart.separation - 0.05) < ROUNDING &&
      apart.contact === null &&
      AutoMovieEngineCompositionOutcome.audit(outcome, []).length === 1,
  );
  let refused: boolean = false;
  try {
    AutoMovieEngineCompositionContact.measure({
      a: { ...side("a", 0), bones: ["none"] },
      b: side("b", 0.19),
      queries,
      seconds: 1,
    });
  } catch (error: unknown) {
    refused = error instanceof Error;
  }
  TestValidator.predicate("no colliders refuses", refused);
}
