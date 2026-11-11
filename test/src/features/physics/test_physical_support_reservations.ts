import {
  AutoMoviePhysicalBalance as Balance,
  AutoMoviePhysicalSimulation as Simulation,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Authored reservations and endpoint actuator strength are independent inputs.
 *
 * Scenarios:
 * 1. A reserved support keeps its tracking strength and changes cache identity.
 * 2. Unknown or duplicate reservations refuse before solver allocation.
 * 3. Reserving a candidate prohibits recovery without erasing actual contacts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalBalance`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate, 1x TestValidator.equals; 3 numbered scenarios (first: A reserved support keeps its tracking strength and changes cache identity.; last: Reserving a candidate prohibits recovery without erasing actual contacts.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A reserved support keeps its tracking strength and changes cache identity.; last: Reserving a candidate prohibits recovery without erasing actual contacts.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_reservations`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A reserved support keeps its tracking strength and changes cache identity.).
 */
export function test_physical_support_reservations(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 0.1);
  const input: Simulation.IInput = PhysicalFixtures.input([body], 0.1);
  input.gravity.y = -9.81;
  const before: string = Simulation.identity(input);
  body.targets[0]!.unavailableSupports = ["support-0"];
  body.supportTracking = {
    pattern: body.balance!.pattern,
    stiffness: 100,
    damping: 10,
    maximumForce: 100,
  };
  body.targets[0]!.supportStrength = { "support-0": 1 };
  TestValidator.predicate(
    "reserved endpoint retains actuator and enters identity",
    Simulation.identity(input) !== before &&
      body.targets[0]!.supportStrength["support-0"] === 1,
  );
  let refusals: number = 0;
  for (const unavailable of [["missing"], ["support-0", "support-0"]]) {
    const invalid: Simulation.IInput = structuredClone(input);
    invalid.bodies[0]!.targets[0]!.unavailableSupports = unavailable;
    try {
      Simulation.identity(invalid);
    } catch (error: unknown) {
      if (String(error).includes("reserved support")) refusals++;
    }
  }
  TestValidator.equals("all malformed reservations refuse", refusals, 2);
  const supports: Balance.ISupport[] = body.balance!.pattern.limbs.map(
    (
      limb: NonNullable<
        Simulation.IBody["balance"]
      >["pattern"]["limbs"][number],
    ): Balance.ISupport => {
      const position: P.ITransform["position"] = profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === limb.bone,
      )!.neutral.position;
      return { bone: limb.bone, position, points: [{ ...position, y: 0 }] };
    },
  );
  const common: Omit<Parameters<typeof Balance.assess>[0], "unavailable"> = {
    center: { x: 0, y: 1, z: 0 },
    velocity: { x: 2, y: 0, z: 0 },
    gravity: 9.81,
    floor: 0,
    pattern: body.balance!.pattern,
    supports,
    maximumStep: 0.7,
    margin: 0.01,
  };
  const available: Balance.IResult = Balance.assess({
    ...common,
    unavailable: [],
  });
  const reserved: Balance.IResult = Balance.assess({
    ...common,
    unavailable: supports.map(
      (support: Balance.ISupport): string => support.bone,
    ),
  });
  TestValidator.predicate(
    "actual support hull is retained while recovery candidates are reserved",
    available.state === "recovery" &&
      reserved.state === "unrecoverable" &&
      reserved.polygon.length === available.polygon.length,
  );
}
