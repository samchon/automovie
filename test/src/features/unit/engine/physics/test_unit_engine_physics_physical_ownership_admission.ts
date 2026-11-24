import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";

/**
 * Ownership admission refuses phantom or disconnected selections and invalid
 * inherited-residual budgets before native allocation.
 *
 * Scenarios:
 *
 * 1. A complete leaf or branch subtree, all authored and default all dynamic
 *    remain valid.
 * 2. Sparse, duplicate, unknown and non-closed selections are refused.
 * 3. Negative inherited linear and angular budgets are refused.
 */
export function test_unit_engine_physics_physical_ownership_admission(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "assembly",
    profile,
    1 / 120,
  );
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1 / 120);
  const branch: string[] = ["upper-0", "lower-0", "support-0"];
  for (const selected of [undefined, [], ["support-0"], branch]) {
    body.targets[0]!.dynamicSegments = selected;
    Simulation.identity(input);
  }
  const findings: string[] = [];
  const invalid: string[][] = [
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
  for (const value of [-1])
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
  TestValidator.equals(
    "all invalid ownership declarations refuse",
    findings,
    [],
  );
}
