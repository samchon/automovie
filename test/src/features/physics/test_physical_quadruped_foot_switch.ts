import { physicalQuadrupedWrenchFootSwitch } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The quadruped foot switch decides touchdown as IHMC's 201903
 * `QuadrupedWrenchBasedFootSwitch` does (l.36, l.48-54): the measured vertical
 * force's magnitude past 4 % of the robot's weight, unfiltered.
 *
 * Scenarios, a 78 N robot, so a 3.12 N threshold:
 *
 * 1. 3.2 N hits and 3.1 N does not.
 * 2. The threshold itself, 3.12 N, does not hit, the comparison being strict.
 * 3. -3.2 N hits by magnitude.
 * 4. A share of 0.25, a foot's static share in four-leg stance, moves the
 *    threshold to 19.5 N: 19 N does not hit and 20 N does.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the threshold and each scenario's decision.
 * @evidence contracts/development/testing.md#behavioral-verification Queries the switch with explicit forces and reads its decision.
 * @evidence contracts/development/testing.md#independent-expectations The 3.12 N bound is 4 % of 78 N by hand and 19.5 N is a quarter of it.
 * @evidence contracts/development/testing.md#distinguishing-cases An absolute threshold such as the default switch's 40 N fails 1; a non-strict comparison fails 2; a signed comparison fails 3; an ignored share fails 4.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory forces.
 */
export function test_physical_quadruped_foot_switch(): void {
  const weight: number = 78;

  // 1. Either side of 4 % of the weight.
  TestValidator.equals(
    "above",
    physicalQuadrupedWrenchFootSwitch({ force: 3.2, weight }),
    true,
  );
  TestValidator.equals(
    "below",
    physicalQuadrupedWrenchFootSwitch({ force: 3.1, weight }),
    false,
  );

  // 2. The threshold itself does not hit.
  TestValidator.equals(
    "at threshold",
    physicalQuadrupedWrenchFootSwitch({ force: 0.04 * weight, weight }),
    false,
  );

  // 3. The magnitude decides.
  TestValidator.equals(
    "magnitude",
    physicalQuadrupedWrenchFootSwitch({ force: -3.2, weight }),
    true,
  );

  // 4. A caller's share.
  TestValidator.equals(
    "share below",
    physicalQuadrupedWrenchFootSwitch({ force: 19, weight, share: 0.25 }),
    false,
  );
  TestValidator.equals(
    "share above",
    physicalQuadrupedWrenchFootSwitch({ force: 20, weight, share: 0.25 }),
    true,
  );
}
