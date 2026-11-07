import { TestValidator } from "@nestia/e2e";

import { physicalJointEffort } from "../../../../packages/engine/src/physics/physicalJointEffort";
import { nclose } from "../internal/nclose";

/** A disturbed joint tracks at its declared compliance fraction until its softening deadline, then recovers the full effort.
 *
 * Scenarios:
 * 1. Without a softening deadline the joint takes the body effort, and an explicit per-joint fraction replaces it.
 * 2. Up to and including the deadline the effort is multiplied by the compliance fraction; just after it the full effort returns.
 * 3. A moving recovery limb's balance fraction multiplies independently of compliance.
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
