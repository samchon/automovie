import { Vector3, planPhysicalRootSupportTargets } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/**
 * Actual-root feedback retains independently planted endpoints without moving the root or solved bodies.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `planPhysicalRootSupportTargets` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_root_support_feedback`, which owns the cases delegated to `PhysicalModelFixtures`, `PhysicalSupportFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Actual-root feedback retains independently planted endpoints without moving the root or solved bodies) as stated in this comment.
 */
export function test_physical_root_support_feedback(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: ReturnType<typeof PhysicalSupportFixtures.body> =
    PhysicalSupportFixtures.body(profile, 0);
  body.supportTracking = {
    pattern: body.balance!.pattern,
    stiffness: 1000,
    damping: 100,
    maximumForce: 100,
    iterations: 48,
    tolerance: 0.0001,
  };
  const targets: Record<string, P.ITransform> = body.targets[0]!.segments;
  const before: string = JSON.stringify(targets);
  const actual: P.ITransform = structuredClone(targets.body!);
  actual.position.x += 0.03;
  const planned: ReturnType<typeof planPhysicalRootSupportTargets> =
    planPhysicalRootSupportTargets({
      body,
      targets,
      root: { bone: "body", pose: actual },
    });
  const findings: string[] = [];
  if (
    Vector3.length(Vector3.subtract(planned.body!.position, actual.position)) >
    1e-12
  )
    findings.push("feedback changed the actual-root premise");
  for (const limb of body.supportTracking.pattern.limbs) {
    const error: number = Vector3.length(
      Vector3.subtract(
        planned[limb.bone]!.position,
        targets[limb.bone]!.position,
      ),
    );
    if (error > 0.003)
      findings.push(`${limb.bone}: root-error compensation ${error}`);
  }
  if (JSON.stringify(targets) !== before)
    findings.push("authored inputs mutated");
  TestValidator.equals(
    "root error does not become planted support drift",
    findings,
    [],
  );
}
