import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMovieFootfallPattern as Pattern } from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Shared support-only and balance admission.
 *
 * Scenarios:
 * 1. One stationary tracking support with minimumSupports=1 remains legal.
 * 2. Missing carriers, sparse declarations and disconnected chains refuse.
 * 3. Empty explicit floor witnesses retain the documented shape fallback.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through no assertion call; 3 numbered scenarios (first: One stationary tracking support with minimumSupports=1 remains legal.; last: Empty explicit floor witnesses retain the documented shape fallback.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: One stationary tracking support with minimumSupports=1 remains legal.; last: Empty explicit floor witnesses retain the documented shape fallback.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_pattern_admission`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: One stationary tracking support with minimumSupports=1 remains legal.).
 */
export function test_physical_support_pattern_admission(): void {
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    PhysicalModelFixtures.quadrupod(),
    1 / 120,
  );
  const pattern: Pattern = structuredClone(body.balance!.pattern);
  pattern.limbs = pattern.limbs.slice(0, 1);
  pattern.minimumSupports = 1;
  delete body.balance;
  body.supportTracking = {
    pattern,
    stiffness: 100,
    damping: 10,
    maximumForce: 100,
  };
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
  Simulation.identity(input);
  const mutations: ((limb: Pattern["limbs"][number]) => void)[] = [
    (limb: Pattern["limbs"][number]): void => {
      limb.contacts = ["missing"];
      limb.floorPoints = [
        { bone: "missing", localPoint: { x: 0, y: 0, z: 0 } },
      ];
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.floorPoints = [
        { bone: "support-1", localPoint: { x: 0, y: 0, z: 0 } },
      ];
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.chain = ["upper-1", "lower-0", "support-0"];
    },
    (limb: Pattern["limbs"][number]): void => {
      const before: string[] = limb.chain;
      limb.chain = new Array<string>(before.length);
      limb.chain[0] = before[0]!;
      limb.chain[before.length - 1] = before.at(-1)!;
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.contacts = new Array<string>(1);
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.floorPoints = new Array<
        NonNullable<typeof limb.floorPoints>[number]
      >(1);
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.reach = { root: "lower-0", middle: "upper-0", tip: "support-0" };
    },
    (limb: Pattern["limbs"][number]): void => {
      limb.localPoint = { x: NaN, y: 0, z: 0 };
    },
  ];
  for (const mutate of mutations) {
    const invalid: Simulation.IInput = structuredClone(input);
    mutate(invalid.bodies[0]!.supportTracking!.pattern.limbs[0]!);
    assert.throws((): string => Simulation.identity(invalid));
  }
  pattern.limbs[0]!.floorPoints = [];
  Simulation.identity(input);
}
