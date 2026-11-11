import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Ownership admission refuses phantom or disconnected selections and invalid inherited-residual budgets before native allocation.
 *
 * Scenarios:
 * 1. A complete leaf or branch subtree, all authored and default all dynamic remain valid.
 * 2. Sparse, duplicate, unknown and non-closed selections are refused.
 * 3. Nonfinite/negative inherited linear and angular budgets are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: A complete leaf or branch subtree, all authored and default all dynamic remain valid.; last: Nonfinite/negative inherited linear and angular budgets are refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A complete leaf or branch subtree, all authored and default all dynamic remain valid.; last: Nonfinite/negative inherited linear and angular budgets are refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_ownership_admission`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A complete leaf or branch subtree, all authored and default all dynamic remain valid.).
 */
export function test_physical_ownership_admission(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: Simulation.IBody = PhysicalFixtures.body(
    "assembly",
    profile,
    1 / 120,
  );
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
  const branch: string[] = ["upper-0", "lower-0", "support-0"];
  for (const selected of [undefined, [], ["support-0"], branch]) {
    body.targets[0]!.dynamicSegments = selected;
    Simulation.identity(input);
  }
  const findings: string[] = [];
  const invalid: string[][] = [
    new Array<string>(1),
    ["absent"],
    ["support-0", "support-0"],
    ["upper-0"],
    ["body"],
  ];
  for (const [index, selected] of invalid.entries()) {
    body.targets[0]!.dynamicSegments = selected;
    try {
      Simulation.identity(input);
      findings.push(`Invalid subtree ${index} accepted`);
    } catch {}
  }
  body.targets[0]!.dynamicSegments = [];
  for (const value of [-1, NaN, Infinity])
    for (const field of [
      "maximumLinearError",
      "maximumJointViolation",
    ] as const) {
      body.handoffLimits = {
        maximumLinearError: 0.005,
        maximumJointViolation: 0.01,
        [field]: value,
      };
      try {
        Simulation.identity(input);
        findings.push(`Invalid ${field} ${value} accepted`);
      } catch {}
    }
  body.handoffLimits = {
    maximumLinearError: 0.005,
    maximumJointViolation: 0.01,
  };
  Simulation.identity(input);
  body.handoffSeconds = Number.MAX_VALUE;
  try {
    Simulation.identity(input);
    findings.push("Overflowing native return tick duration accepted");
  } catch {}
  TestValidator.equals(
    "all invalid ownership declarations refuse",
    findings,
    [],
  );
}
