import {
  ViolationCollector,
  getConstraint,
  validateJointRom,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { joint } from "../internal/fixtures";
import { nclose } from "../internal/nclose";

const romItems: (axes: Parameters<typeof joint>[1]) => IAutoMovieConstraintViolation[] = (axes: Parameters<typeof joint>[1]): IAutoMovieConstraintViolation[] => {
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
 * Report angles outside the default elbow interval on the offending axis with their degree distance from the nearest bound.
 *
 * Scenarios:
 *
 * 1. An elbow at 175-degree flexion exceeds the 150-degree maximum and reports one flexion fault.
 * 2. Negative ten-degree flexion falls below the zero minimum and reports one fault.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls ROM validation above and below the default elbow interval, requiring one located fault and the correct degree distance on each side.
 * @evidence contracts/testing.md#independent-expectations The declared [0,150] interval gives 175-150=25 and 0-(-10)=10 degree overshoots. These are arithmetic expectations of the conventional default policy, not a population-specific clinical certificate.
 * @evidence contracts/testing.md#distinguishing-cases Both upper and lower refusals preserve their counts and overshoots; accepted interior and immobile-axis behavior are separate ROM entries.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns two collector populations through a private helper and the existing joint fixture; no renderer, process or native artifact participates.
 */
export function test_rom_validate_over_range(): void {
  const over: IAutoMovieConstraintViolation[] = romItems({ flexion: 175 });
  TestValidator.equals("one violation for 175° flexion", over.length, 1);
  TestValidator.predicate(
    "flagged on flexion axis",
    over[0]!.path.endsWith(".flexion"),
  );
  TestValidator.predicate(
    "overshoot is degrees past the max (175 − 150)",
    nclose(over[0]!.overshoot!, 25, 0),
  );

  const under: IAutoMovieConstraintViolation[] = romItems({ flexion: -10 });
  TestValidator.equals("one violation for -10° (below min 0)", under.length, 1);
  TestValidator.predicate(
    "overshoot is degrees below the min (0 − (−10))",
    nclose(under[0]!.overshoot!, 10, 0),
  );
}
