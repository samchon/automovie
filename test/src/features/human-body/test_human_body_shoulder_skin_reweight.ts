import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { reweightHumanBodyShoulderSkin } from "../../../scripts/body-basis/reweightHumanBodyShoulderSkin";
import { nclose, throwsError } from "../internal/predicates";

const JOINTS: AutoMovieHumanoidBone[] = [
  "upperChest",
  "leftShoulder",
  "leftUpperArm",
  "rightShoulder",
  "rightUpperArm",
  "spine",
  "hips",
];
const CHEST = 0;
const LEFT_GIRDLE = 1;
const LEFT_ARM = 2;
const RIGHT_GIRDLE = 3;
const RIGHT_ARM = 4;
const SPINE = 5;
const HIPS = 6;

/** Weights of one vertex as a bone-index map, ignoring empty slots. */
const share = (
  skin: { boneIndices: number[]; weights: number[] },
  v: number,
): Map<number, number> => {
  const found = new Map<number, number>();
  for (let k = 0; k < 4; ++k)
    if (skin.weights[4 * v + k] > 0)
      found.set(skin.boneIndices[4 * v + k], skin.weights[4 * v + k]);
  return found;
};

/**
 * The humerus's skin share above the glenohumeral centre moves to the girdle
 * bone of the same side, by a geometric rule that reads no photograph or
 * person.
 *
 * The fixture is seven hand-placed vertices around left and right centres at
 * `(+-0.17, 0, 0)` with a ramp from 70 to 110 degrees off the upward axis, so
 * every expected weight below is hand arithmetic on a smoothstep.
 *
 * Scenarios:
 * 1. A vertex straight above the left centre (0 degrees) gives its whole
 *    humeral weight to the left girdle and keeps its chest weight.
 * 2. The right mirror of it does the same to the right girdle, so the rule is
 *    bilaterally symmetric.
 * 3. A vertex straight below (180 degrees) is untouched, the negative twin of
 *    scenario 1.
 * 4. A vertex level with the centre (90 degrees, the ramp's midpoint) splits
 *    its humeral weight in half.
 * 5. A vertex that would gain a fifth influence drops the smallest, keeps
 *    four influences and renormalises to one, and the tie between the arm and
 *    girdle shares resolves to the lower bone index.
 * 6. A left-arm weight on the right side of the midline and a vertex with no
 *    humeral weight are untouched, and the input skin is never mutated.
 * 7. A ramp whose onset is not below its full angle, and a skin missing the
 *    girdle bone, are refused.
 */
export const test_human_body_shoulder_skin_reweight = (): void => {
  const centres = {
    leftUpperArm: { x: 0.17, y: 0, z: 0 },
    rightUpperArm: { x: -0.17, y: 0, z: 0 },
  };
  const positions = [
    0.17, 0.1, 0, // 0 above the left centre
    -0.17, 0.1, 0, // 1 above the right centre
    0.17, -0.1, 0, // 2 below the left centre
    0.27, 0, 0, // 3 level with the left centre
    0.27, 0, 0, // 4 level, four influences
    -0.05, 0.1, 0, // 5 above, but across the midline from the left arm
    0.17, 0.1, 0, // 6 above, no humeral weight
  ];
  const boneIndices = [
    CHEST, LEFT_ARM, 0, 0,
    CHEST, RIGHT_ARM, 0, 0,
    CHEST, LEFT_ARM, 0, 0,
    CHEST, LEFT_ARM, 0, 0,
    CHEST, LEFT_ARM, SPINE, HIPS,
    CHEST, LEFT_ARM, 0, 0,
    CHEST, SPINE, 0, 0,
  ];
  const weights = [
    0.4, 0.6, 0, 0,
    0.4, 0.6, 0, 0,
    0.4, 0.6, 0, 0,
    0.6, 0.4, 0, 0,
    0.3, 0.3, 0.2, 0.2,
    0.4, 0.6, 0, 0,
    0.5, 0.5, 0, 0,
  ];
  const skin = { joints: JOINTS, boneIndices, weights };
  const before = JSON.stringify(skin);
  const withoutGirdle: AutoMovieHumanoidBone[] = ["upperChest", "leftUpperArm"];
  const run = (onsetDegrees = 70, fullDegrees = 110) =>
    reweightHumanBodyShoulderSkin({
      positions,
      skin,
      centres,
      onsetDegrees,
      fullDegrees,
    });
  const { skin: result, changed } = run();
  const at = (v: number) => share(result, v);
  const close = (found: Map<number, number>, expected: [number, number][]) =>
    found.size === expected.length &&
    expected.every(([bone, w]) => nclose(found.get(bone) ?? -1, w, 1e-9));

  TestValidator.predicate(
    "above the left centre the girdle takes the arm's whole share",
    close(at(0), [
      [CHEST, 0.4],
      [LEFT_GIRDLE, 0.6],
    ]),
  );
  TestValidator.predicate(
    "the right mirror moves to the right girdle",
    close(at(1), [
      [CHEST, 0.4],
      [RIGHT_GIRDLE, 0.6],
    ]),
  );
  TestValidator.predicate(
    "below the centre nothing moves",
    close(at(2), [
      [CHEST, 0.4],
      [LEFT_ARM, 0.6],
    ]),
  );
  TestValidator.predicate(
    "level with the centre the ramp splits the arm share in half",
    close(at(3), [
      [CHEST, 0.6],
      [LEFT_ARM, 0.2],
      [LEFT_GIRDLE, 0.2],
    ]),
  );
  const four = at(4);
  TestValidator.equals("a fifth influence is dropped", four.size, 4);
  TestValidator.predicate(
    "the four influences are renormalised and the arm lost the tie",
    close(four, [
      [CHEST, 0.3 / 0.85],
      [LEFT_GIRDLE, 0.15 / 0.85],
      [SPINE, 0.2 / 0.85],
      [HIPS, 0.2 / 0.85],
    ]),
  );
  TestValidator.predicate(
    "an arm weight across the midline and a vertex without one are untouched",
    close(at(5), [
      [CHEST, 0.4],
      [LEFT_ARM, 0.6],
    ]) &&
      close(at(6), [
        [CHEST, 0.5],
        [SPINE, 0.5],
      ]),
  );
  TestValidator.equals("changed vertices are counted", changed, 4);
  TestValidator.equals(
    "the input skin is not mutated",
    JSON.stringify(skin),
    before,
  );
  TestValidator.predicate(
    "an inverted ramp is refused",
    throwsError(() => run(110, 70), "onset below full"),
  );
  TestValidator.predicate(
    "a skin without the girdle bone is refused",
    throwsError(
      () =>
        reweightHumanBodyShoulderSkin({
          positions,
          skin: { ...skin, joints: withoutGirdle },
          centres,
          onsetDegrees: 70,
          fullDegrees: 110,
        }),
      "does not name",
    ),
  );
};
