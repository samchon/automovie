import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { reweightHumanBodyShoulderSkin } from "../../../scripts/body-basis/reweightHumanBodyShoulderSkin";
import { nclose, throwsError } from "../internal/predicates";

/**
 * A directional attachment cannot be inferred at a joint centre, and an
 * offline reweight result owns every array it returns. The hand-authored
 * fixture has one vertex exactly at each centre and one above each centre.
 *
 * Scenarios:
 * 1. The two centre vertices keep their indices and weights; the adjacent
 *    upper vertices transfer their whole arm share to the matching girdle.
 * 2. Mutating the result's joint names, indices and weights leaves the caller's
 *    input arrays unchanged.
 * 3. NaN or infinite endpoints, endpoints outside the vector-angle range and
 *    an equal or reversed pair are refused.
 * 4. The exact [0, 180] ramp endpoints are admitted.
 */
export const test_human_body_shoulder_skin_reweight_boundaries = (): void => {
  const joints: AutoMovieHumanoidBone[] = [
    "leftUpperArm", "leftShoulder", "rightUpperArm", "rightShoulder",
  ];
  const skin = {
    joints,
    boneIndices: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  };
  const before = JSON.stringify(skin);
  const run = (onsetDegrees: number, fullDegrees: number) =>
    reweightHumanBodyShoulderSkin({
      positions: [0.2, 0, 0, -0.2, 0, 0, 0.2, 0.1, 0, -0.2, 0.1, 0],
      skin,
      centres: {
        leftUpperArm: { x: 0.2, y: 0, z: 0 },
        rightUpperArm: { x: -0.2, y: 0, z: 0 },
      },
      onsetDegrees,
      fullDegrees,
    });
  const result = run(70, 110);
  TestValidator.equals("only vertices with an upward direction change", result.changed, 2);
  TestValidator.equals("both joint-centre attachments stay", result.skin.boneIndices.slice(0, 8), skin.boneIndices.slice(0, 8));
  TestValidator.predicate("no centre influence becomes NaN or loses mass", result.skin.weights.slice(0, 8).every((weight, index) => nclose(weight, skin.weights[index], 1e-12)));
  TestValidator.equals("upper vertices belong to their own girdle", [result.skin.boneIndices[8], result.skin.boneIndices[12]], [1, 3]);
  result.skin.joints[0] = "upperChest";
  result.skin.boneIndices[0] = 1;
  result.skin.weights[0] = 0.5;
  TestValidator.equals("all output arrays are independently owned", JSON.stringify(skin), before);
  for (const [onset, full] of [
    [NaN, 110], [70, Infinity], [-1, 110], [70, 181], [70, 70], [110, 70],
  ])
    TestValidator.predicate(
      `invalid ramp ${onset},${full} is refused`,
      throwsError(() => run(onset, full), "finite angles in [0, 180]"),
    );
  TestValidator.equals("the vector-angle interval's endpoints are admitted", run(0, 180).changed, 2);
};
