import { AutoMovieEnginePhysics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines base and explicit joint effort with compliance through an inclusive softening deadline and independent recovery scale.
 * @evidence contracts/development/testing.md#behavioral-verification Reads effort at 1 s with an absent, future, equal and passed deadline and a separate recovery fraction.
 * @evidence contracts/development/testing.md#independent-expectations Base 0.8 times compliance 0.25 yields 0.2 through the deadline. After 0.999 s it is restored, and independent recovery 0.5 multiplies both values.
 */
export function test_engine_physics_joint_effort(): void {
  const base: Parameters<typeof AutoMovieEnginePhysics.physicalJointEffort>[0] = {
    effort: 0.8,
    seconds: 1,
    compliance: 0.25,
  };
  TestValidator.predicate(
    "undisturbed",
    nclose(AutoMovieEnginePhysics.physicalJointEffort(base), 0.8, 1e-12),
  );
  TestValidator.predicate(
    "override",
    nclose(AutoMovieEnginePhysics.physicalJointEffort({ ...base, override: 0.5 }), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "deadline ahead",
    nclose(AutoMovieEnginePhysics.physicalJointEffort({ ...base, softenedUntil: 1.2 }), 0.2, 1e-12),
  );
  TestValidator.predicate(
    "deadline now",
    nclose(AutoMovieEnginePhysics.physicalJointEffort({ ...base, softenedUntil: 1 }), 0.2, 1e-12),
  );
  TestValidator.predicate(
    "deadline passed",
    nclose(AutoMovieEnginePhysics.physicalJointEffort({ ...base, softenedUntil: 0.999 }), 0.8, 1e-12),
  );
  TestValidator.predicate(
    "recovery multiplies",
    nclose(
      AutoMovieEnginePhysics.physicalJointEffort({ ...base, recovery: 0.5, softenedUntil: 2 }),
      0.1,
      1e-12,
    ),
  );
}
