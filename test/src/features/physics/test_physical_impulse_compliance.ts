import { physicalJointEffort } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/** A disturbed joint tracks at its declared compliance fraction until its softening deadline, then recovers the full effort.
 *
 * Scenarios:
 * 1. Without a softening deadline the joint takes the body effort, and an explicit per-joint fraction replaces it.
 * 2. Up to and including the deadline the effort is multiplied by the compliance fraction; just after it the full effort returns.
 * 3. A moving recovery limb's balance fraction multiplies independently of compliance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalJointEffort` on in-memory inputs and asserts the returned observations through 6x TestValidator.predicate; 3 numbered scenarios (first: Without a softening deadline the joint takes the body effort, and an explicit per-joint fraction replaces it.; last: A moving recovery limb's balance fraction multiplies independently of compliance.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (6 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Without a softening deadline the joint takes the body effort, and an explicit per-joint fraction replaces it.; last: A moving recovery limb's balance fraction multiplies independently of compliance.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_impulse_compliance`, which owns the cases delegated to `nclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Without a softening deadline the joint takes the body effort, and an explicit per-joint fraction replaces it.).
 */
export function test_physical_impulse_compliance(): void {
  const base: Parameters<typeof physicalJointEffort>[0] = {
    effort: 0.8,
    seconds: 1,
    compliance: 0.25,
  };
  TestValidator.predicate(
    "undisturbed joint takes the body effort",
    nclose(physicalJointEffort(base), 0.8),
  );
  TestValidator.predicate(
    "explicit joint fraction replaces the body effort",
    nclose(physicalJointEffort({ ...base, override: 0.5 }), 0.5),
  );
  TestValidator.predicate(
    "deadline still ahead keeps the joint compliant",
    nclose(physicalJointEffort({ ...base, softenedUntil: 1.2 }), 0.8 * 0.25),
  );
  TestValidator.predicate(
    "the deadline instant itself is still compliant",
    nclose(physicalJointEffort({ ...base, softenedUntil: 1 }), 0.8 * 0.25),
  );
  TestValidator.predicate(
    "a passed deadline restores the full effort",
    nclose(physicalJointEffort({ ...base, softenedUntil: 0.999 }), 0.8),
  );
  TestValidator.predicate(
    "recovery and compliance fractions multiply independently",
    nclose(
      physicalJointEffort({ ...base, recovery: 0.5, softenedUntil: 2 }),
      0.8 * 0.5 * 0.25,
    ),
  );
}
