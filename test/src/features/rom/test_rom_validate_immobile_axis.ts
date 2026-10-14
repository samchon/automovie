import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../internal/fixtures";
import { nclose } from "../internal/nclose";

const romItems: (
  axes: Parameters<typeof joint>[1],
) => IAutoMovieConstraintViolation[] = (
  axes: Parameters<typeof joint>[1],
): IAutoMovieConstraintViolation[] => {
  const collector: ViolationCollector = new ViolationCollector();
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
 *
 * @evidence contracts/testing.md#behavioral-verification Validates specified motion on the default elbow's immobile abduction axis and reads count, axis path and overshoot; zero must remain accepted.
 * @evidence contracts/testing.md#independent-expectations An immobile axis permits rest or zero, so a 20-degree input is 20 degrees from its only admitted specified angle. This pins table policy rather than measuring anatomy.
 * @evidence contracts/testing.md#distinguishing-cases The nonzero refusal contrasts its zero neighbor under the same constraint; ordinary bounded-axis and coupled-swing faults are covered by other ROM entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns its two collector populations through a private local helper and existing joint fixture, with no native artifact or host.
 */
export function test_rom_validate_immobile_axis(): void {
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
