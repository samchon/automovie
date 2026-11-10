import {
  preparePhysicalGeometry as Geometry,
  auditAutoMovieOutcome,
  measureAutoMovieContact,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Contact is measured between displayed colliders and feeds the outcome audit unchanged.
 *
 * Scenarios:
 * 1. Two 0.1 m spheres 0.19 m apart compress by 0.01 m and yield a contact record that satisfies a required-contact audit.
 * 2. The same spheres 0.25 m apart separate by 0.05 m, yield no record, and the audit reports the missing contact.
 * 3. A side without declared colliders refuses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `auditAutoMovieOutcome`, `measureAutoMovieContact`, `preparePhysicalGeometry` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate; 3 numbered scenarios (first: Two 0.1 m spheres 0.19 m apart compress by 0.01 m and yield a contact record that satisfies a...; last: A side without declared colliders refuses.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Two 0.1 m spheres 0.19 m apart compress by 0.01 m and yield a contact record that satisfies a...; last: A side without declared colliders refuses.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_composition_contact`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two 0.1 m spheres 0.19 m apart compress by 0.01 m and yield a contact record that satisfies a required-contact audit.).
 */
export async function test_composition_contact(): Promise<void> {
  const queries: Geometry.IQueries = await Geometry();
  const profile: P = PhysicalFixtures.sphere(0.1);
  const side = (subject: string, x: number): measureAutoMovieContact.ISide => ({
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
  const touching: measureAutoMovieContact.IResult = measureAutoMovieContact({
    a: side("a", 0),
    b: side("b", 0.19),
    queries,
    seconds: 1,
  });
  const apart: measureAutoMovieContact.IResult = measureAutoMovieContact({
    a: side("a", 0),
    b: side("b", 0.25),
    queries,
    seconds: 1,
  });
  const outcome: auditAutoMovieOutcome.IOutcome = {
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
