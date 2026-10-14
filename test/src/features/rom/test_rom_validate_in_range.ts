import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/fixtures";

/**
 * A pose inside the default elbow policy produces no violations; the result establishes acceptance under that table rather than a population-specific anatomical judgment.
 *
 * Scenarios:
 * 1. An elbow at 90-degree flexion inside [0,150], with zero on its immobile abduction axis, yields an empty violation list.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls joint-ROM validation and reads the collector, catching a detector that refuses a valid elbow or treats neutral on an immobile axis as motion.
 * @evidence contracts/testing.md#independent-expectations Ninety lies inside the declared inclusive zero-to-150 elbow interval and zero is neutral on an immobile axis; the empty result follows those policies without an implementation-produced expected report.
 * @evidence contracts/testing.md#distinguishing-cases This entry owns the accepted interior/immobile-zero case; neighboring out-of-range, moving-immobile and coupled-cone cases have separate named tests.
 * @evidence contracts/testing.md#execution-ownership The named portable unit owns one collector and the existing joint fixture, calls actual validation and starts no renderer, native build or process.
 */
export function test_rom_validate_in_range(): void {
  const collector: ViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftLowerArm", { flexion: 90, abduction: 0 }),
    constraint: getConstraint("leftLowerArm", null)!,
    path: "$input",
    collector,
  });
  TestValidator.equals(
    "no violations for a valid elbow",
    collector.items.length,
    0,
  );
}
