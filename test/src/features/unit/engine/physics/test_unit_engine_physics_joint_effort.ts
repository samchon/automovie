import { physicalJointEffort } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `physicalJointEffort` scales a body's effort by a joint's compliance until
 * its softening deadline.
 *
 * Base: effort 0.8, time 1 s, compliance 0.25.
 *
 * Scenarios:
 *
 * 1. Without a deadline the joint takes the effort 0.8; an explicit per-joint
 *    fraction 0.5 replaces it.
 * 2. A deadline of 1.2 or exactly 1 multiplies by the compliance: 0.2.
 * 3. A deadline already passed (0.999) restores the full effort 0.8.
 * 4. A recovery fraction of 0.5 multiplies independently: 0.8 x 0.5 x 0.25.
 */
export function test_unit_engine_physics_joint_effort(): void {
  const base: Parameters<typeof physicalJointEffort>[0] = {
    effort: 0.8,
    seconds: 1,
    compliance: 0.25,
  };
  TestValidator.predicate(
    "undisturbed",
    nclose(physicalJointEffort(base), 0.8, 1e-12),
  );
  TestValidator.predicate(
    "override",
    nclose(physicalJointEffort({ ...base, override: 0.5 }), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "deadline ahead",
    nclose(physicalJointEffort({ ...base, softenedUntil: 1.2 }), 0.2, 1e-12),
  );
  TestValidator.predicate(
    "deadline now",
    nclose(physicalJointEffort({ ...base, softenedUntil: 1 }), 0.2, 1e-12),
  );
  TestValidator.predicate(
    "deadline passed",
    nclose(physicalJointEffort({ ...base, softenedUntil: 0.999 }), 0.8, 1e-12),
  );
  TestValidator.predicate(
    "recovery multiplies",
    nclose(
      physicalJointEffort({ ...base, recovery: 0.5, softenedUntil: 2 }),
      0.1,
      1e-12,
    ),
  );
}
