import { createPortraitNoseComponent } from "@automovie/human/face/anatomy/nose/createPortraitNoseComponent";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Aperture spreading remains finite at a separate skin identity coincident
 * with a rim sample and leaves skin outside its metric reach untouched.
 *
 * Scenarios:
 * 1. A square opening of width 2 mm doubles about X. Its coincident skin
 *    sample at (1,-1,0) follows the rim toward (2,-1,0) within numerical
 *    tolerance; the 30 mm distant sample retains its original coordinates.
 */
export const test_subject_nasal_skin_spread_coincident = (): void => {
  const positions = [
    [-1, -1, 0],
    [1, -1, 0],
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [30, 0, 0],
  ];
  const plan = createPortraitNoseComponent(
    {
      midline: 0,
      tipY: 0,
      tipRadius: [1, 1],
      alarOffset: 1,
      alarY: 0,
      alarRadius: 1,
      surface: [0, 1, 2, 3, 4, 5],
      nostrils: [[0, 1]],
    },
    {
      widthScale: 1,
      tipProjection: 0,
      alarProjection: 0,
      nostrilWidthScale: 2,
      nostrilHeightScale: 1,
      nostrilRise: 0,
      nostrilTilt: 0,
      rimRoundness: 0,
      rimSupport: 0.1,
      cavityContraction: 0.6,
      cavityOffset: [0, 3, -5],
      blendReach: 10,
    },
  ).fit({ positions, indices: [0, 1, 2, 0, 2, 3], viewRay: [0, 0, 1] });
  const targets = new Map(plan.constraints.map((one) => [one.vertex, one.target]));
  TestValidator.predicate(
    "the rim was widened and the caller's host is unchanged",
    nclose(targets.get(1)![0]!, 2) && nclose(positions[1]![0]!, 1),
  );
  TestValidator.predicate(
    "coincident skin follows the aperture without nonfinite coordinates",
    targets.get(4)!.every((value, axis) => nclose(value, [2, -1, 0][axis]!)),
  );
  TestValidator.predicate(
    "skin beyond the reach retains its coordinates",
    targets.get(5)!.every((value, axis) => nclose(value, positions[5]![axis]!)),
  );
};
