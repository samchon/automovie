import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import type { IAutoMovieViolationCollector } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/fixtures";

/**
 * A pose inside the default elbow policy produces no violations; the result establishes acceptance under that table rather than a population-specific anatomical judgment.
 *
 * Scenarios:
 * 1. An elbow at 90-degree flexion inside [0,150], with zero on its immobile abduction axis, yields an empty violation list.
 */
export function test_unit_engine_rom_validate_in_range(): void {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
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
