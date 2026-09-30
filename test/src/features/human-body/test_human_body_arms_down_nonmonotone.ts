import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  createHumanBodyBasisBuilder,
  segmentHumanBodyModel,
  solveHumanBodyArmsDown,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyTrunkArmFixture } from "../internal/humanBodyTrunkArmFixture";

/**
 * An arm may leave one body surface, meet another, and leave it again while
 * lowering. A first-safe-angle search must not assume clean contact is a
 * monotone function of shoulder elevation.
 *
 * Scenarios:
 * 1. A trunk reaches x = 0.24 m; a separate upper-chest block occupies
 *    x = 0.36–0.39 m, y = 2.70–2.80 m. The 0.04 m thick left arm extends
 *    0.30 m from (0.25, 3, 0). Direct built-skin readings establish that it
 *    crosses at 0°, clears at 10°, crosses again at 22.5°, and clears at 45°.
 * 2. The preset chooses an angle no more than one degree above the lower
 *    clean interval, rather than the later clean interval above 22.5°.
 */
export const test_human_body_arms_down_nonmonotone = (): void => {
  const basis = humanBodyTrunkArmFixture(0.24, {
    low: [0.36, 2.7, -0.03],
    high: [0.39, 2.8, 0.03],
  });
  const build = createHumanBodyBasisBuilder(basis);
  const document = {
    id: "arm-islands",
    name: "Arm islands",
    basis: basis.id,
    shape: {},
    pose: [
      {
        bone: "leftLowerArm" as const,
        flexion: 0,
        abduction: null,
        twist: null,
      },
      {
        bone: "rightLowerArm" as const,
        flexion: 0,
        abduction: null,
        twist: null,
      },
    ],
  };
  const crosses = (elevation: number): boolean => {
    const built = build({
      ...document,
      shoulders: [
        { bone: "leftUpperArm", plane: 0, elevation, axialRotation: 0 },
        { bone: "rightUpperArm", plane: 0, elevation: 45, axialRotation: 0 },
      ],
    });
    const { model } = segmentHumanBodyModel(basis, built);
    return measureAutoMovieModelCrossings(model, { withinParts: true }).some(
      (entry) =>
        entry.part.startsWith("leftUpperArm/") ||
        entry.other.startsWith("leftUpperArm/"),
    );
  };
  TestValidator.equals(
    "the built arm has two separate contact intervals",
    [0, 10, 22.5, 45].map(crosses),
    [true, false, true, false],
  );
  const solved = solveHumanBodyArmsDown(basis, build, document);
  const left = solved.shoulders!.find((goal) => goal.bone === "leftUpperArm")!;
  TestValidator.predicate(
    "the preset chooses the first clean interval",
    left.elevation > 0 && left.elevation <= 11,
  );
};
