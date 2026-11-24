import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/fixtures";
import { nclose } from "../../../internal/nclose";

const romItems: (
  axes: Parameters<typeof joint>[1],
) => IAutoMovieConstraintViolation[] = (
  axes: Parameters<typeof joint>[1],
): IAutoMovieConstraintViolation[] => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftLowerArm", axes),
    constraint: getConstraint("leftLowerArm", null)!,
    path: "$input",
    collector,
  });
  return collector.items;
};

/**
 * The default elbow policy marks abduction immobile: specified nonzero motion fails and zero remains neutral.
 *
 * Scenarios:
 *
 * 1. Twenty-degree elbow abduction reports one abduction fault and a 20-degree overshoot.
 * 2. Zero on the same immobile axis produces no violation.
 */
export function test_unit_engine_rom_validate_immobile_axis(): void {
  const items: IAutoMovieConstraintViolation[] = romItems({ abduction: 20 });
  TestValidator.equals("immobile-axis motion flagged", items.length, 1);
  TestValidator.predicate(
    "flagged on abduction axis",
    items[0]!.path.endsWith(".abduction"),
  );
  TestValidator.predicate(
    "overshoot is the full distance from 0",
    nclose(items[0]!.overshoot!, 20, 0),
  );

  TestValidator.equals(
    "zero on immobile axis is fine",
    romItems({ abduction: 0 }).length,
    0,
  );
}
