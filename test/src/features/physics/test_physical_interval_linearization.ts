import {
  linearizePhysicalInterval,
  solvePhysicalFloorChainTarget,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";

/** Independent active-set probes preserve inequality and equality semantics.
 *
 * Scenarios:
 * 1. Small positive and negative equality errors retain a full derivative across a crossing probe.
 * 2. Slack and exact one-sided boundaries remain free to depart in either probe direction.
 * 3. Violated one-sided and narrow intervals linearize only their active signed row.
 * 4. A real bounded articulation starting exactly on the floor can lift into positive clearance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `linearizePhysicalInterval`, `solvePhysicalFloorChainTarget` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate, 5x TestValidator.equals; 4 numbered scenarios (first: Small positive and negative equality errors retain a full derivative across a crossing probe.; last: A real bounded articulation starting exactly on the floor can lift into positive clearance.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (7 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Small positive and negative equality errors retain a full derivative across a crossing probe.; last: A real bounded articulation starting exactly on the floor can lift into positive clearance.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_interval_linearization`, which owns the cases delegated to `PhysicalPointFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Small positive and negative equality errors retain a full derivative across a crossing probe.).
 */
export function test_physical_interval_linearization(): void {
  const delta: number = 1e-4;
  for (const value of [-1e-6, 1e-6]) {
    const model: (probe: number) => number[] = linearizePhysicalInterval(
      value,
      0,
      0,
    );
    const before: number[] = model(value);
    const after: number[] = model(value + delta);
    const derivative: number[] = after.map(
      (entry: number, index: number): number =>
        (entry - before[index]!) / delta,
    );
    TestValidator.predicate(
      "equality has exactly one full derivative across the hinge",
      Math.abs(derivative[0]! + derivative[1]! - 1) < 1e-12,
    );
  }
  for (const value of [0, 0.5, 1]) {
    const model: (probe: number) => number[] = linearizePhysicalInterval(
      value,
      0,
      1,
    );
    TestValidator.equals(
      "slack and boundary inequalities do not become bilateral constraints",
      model(value - delta),
      [0, 0],
    );
    TestValidator.equals(
      "departure into clearance remains free",
      model(value + delta),
      [0, 0],
    );
  }
  TestValidator.equals(
    "violated lower side retains signed probe beyond its boundary",
    linearizePhysicalInterval(-1e-6, 0)(delta),
    [delta],
  );
  TestValidator.equals(
    "violated upper side retains signed probe beyond its boundary",
    linearizePhysicalInterval(1e-6, undefined, 0)(-delta),
    [-delta],
  );
  TestValidator.equals(
    "narrow interval only activates the actually violated side",
    linearizePhysicalInterval(-delta, 0, 1e-6)(delta),
    [delta, 0],
  );
  const profile: P = PhysicalPointFixtures.profile();
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  const lifted: ReturnType<typeof solvePhysicalFloorChainTarget> =
    solvePhysicalFloorChainTarget({
      profile,
      targets,
      chain: ["carrier", "source"],
      contacts: ["source"],
      goal: { x: Math.sqrt(0.99), y: 1.1, z: 0 },
      endpointHeight: 1.1,
      floor: 0.99,
      iterations: 32,
      tolerance: 1e-6,
    });
  TestValidator.predicate(
    "an exact floor inequality does not pin the requested departure",
    lifted.residual < 1e-6 &&
      Math.abs(lifted.targets.source!.position.y - 1.1) < 1e-6,
  );
}
