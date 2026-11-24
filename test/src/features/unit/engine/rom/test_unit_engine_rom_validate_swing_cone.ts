import { ViolationCollector, validateJointRom } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieJointConstraint,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/fixtures";
import { nclose } from "../../../internal/predicates";

/** A ball-joint constraint: axes wide open, only the combined swing capped. */
const CONE: IAutoMovieJointConstraint = {
  flexion: { min: -180, max: 180 },
  abduction: { min: -180, max: 180 },
  twist: null,
  swingDeg: 100,
};

const coneItems: (
  axes: Parameters<typeof joint>[1],
) => IAutoMovieConstraintViolation[] = (
  axes: Parameters<typeof joint>[1],
): IAutoMovieConstraintViolation[] => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
  validateJointRom({
    joint: joint("leftUpperArm", axes),
    constraint: CONE,
    path: "$input",
    collector,
  });
  return collector.items;
};

/**
 * A declared swing cap excludes a coupled corner that both axis intervals admit; rest contributes zero to the coupled metric.
 *
 * Scenarios:
 *
 * 1. A 90/90-degree corner has 120-degree swing and one swing fault, 20 degrees beyond the cap.
 * 2. A 30/30-degree corner stays inside the cone and produces no fault.
 * 3. Each single 50-degree axis passes with its partner at rest; 150-degree flexion fails identically with null and zero abduction.
 */
export function test_unit_engine_rom_validate_swing_cone(): void {
  // 1. past the cone
  const over: IAutoMovieConstraintViolation[] = coneItems({
    flexion: 90,
    abduction: 90,
  });
  TestValidator.equals("corner pose flagged once", over.length, 1);
  TestValidator.predicate(
    "flagged on the swing path",
    over[0]!.path.endsWith(".swing"),
  );
  TestValidator.predicate(
    "overshoot is degrees past the cone (120 − 100)",
    nclose(over[0]!.overshoot!, 20),
  );

  // 2. inside the cone
  TestValidator.equals(
    "modest combined swing is fine",
    coneItems({ flexion: 30, abduction: 30 }).length,
    0,
  );

  // 3. a resting axis contributes 0 to the cone, it does not exempt it.
  // Inside the cone: swingConeAngle(0, 50) = 50 <= 100 → clean.
  TestValidator.equals(
    "a single-axis pose inside the cone passes with the other axis at rest",
    coneItems({ abduction: 50 }).length,
    0,
  );
  TestValidator.equals(
    "and symmetrically with flexion alone",
    coneItems({ flexion: 50 }).length,
    0,
  );
  // Past the cone: swingConeAngle(150, 0) = 150 > 100 → flagged, and a resting
  // axis must read identically to an explicit 0 (the same rendered rotation).
  const restingPastCone: IAutoMovieConstraintViolation[] = coneItems({
    flexion: 150,
  });
  const zeroPastCone: IAutoMovieConstraintViolation[] = coneItems({
    flexion: 150,
    abduction: 0,
  });
  TestValidator.equals(
    "a resting axis does not exempt a pose past the cone",
    restingPastCone.length,
    1,
  );
  TestValidator.predicate(
    "a resting axis and an explicit 0 give the identical cone verdict",
    restingPastCone.length === zeroPastCone.length &&
      restingPastCone.every(
        (item: IAutoMovieConstraintViolation, index: number): boolean =>
          item.path === zeroPastCone[index]!.path &&
          nclose(item.overshoot!, zeroPastCone[index]!.overshoot!, 0),
      ),
  );
}
