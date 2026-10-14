import { bodyRegionBones } from "@automovie/engine";
import { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

const disjoint: (
  a: readonly AutoMovieHumanoidBone[],
  b: readonly AutoMovieHumanoidBone[],
) => boolean = (
  a: readonly AutoMovieHumanoidBone[],
  b: readonly AutoMovieHumanoidBone[],
): boolean => {
  const set: Set<AutoMovieHumanoidBone> = new Set(a);
  return b.every((x: AutoMovieHumanoidBone): boolean => !set.has(x));
};

/**
 * Observe literal region sizes, selected semantic membership, disjointness and fullBody concatenation. The runtime unit does not enumerate the complete AutoMovieHumanoidBone union independently, so extending that vocabulary without updating the partition is outside these assertions.
 *
 * Current bodyRegionBones declares its three lists with satisfies readonly AutoMovieHumanoidBone[], which admits each named element but does not prove vocabulary exhaustiveness. No AUTOMOVIE_RIG_IS_PARTITIONED declaration exists in that source owner, so this comment does not claim a compiler completeness guard that the current implementation lacks.
 *
 * Scenarios:
 *
 * 1. Each region owns the expected bones (lower = hips+legs, upper = torso+arms+
 *    fingers, head = neck/head/eyes/jaw, face = none).
 * 2. The three bony regions are pairwise disjoint.
 * 3. `fullBody` is exactly their concatenation, element for element. Nothing here
 *    asserts independent vocabulary completeness; the unique population is additionally fixed at 55.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls bodyRegionBones for all five regions and inspects literal lengths, selected membership, pairwise disjointness, concatenation order and the unique fullBody size. This observes the product's mask vocabulary, not only test fixture arrangement.
 * @evidence contracts/testing.md#independent-expectations Literal counts 9/41/5/0/55 and named hips/foot/spine/hand/finger/neck/jaw expectations independently constrain the returned lists. Concatenation agreement alone can share an omitted vocabulary member, so no complete union enumeration or current compiler exhaustiveness check is claimed.
 * @evidence contracts/testing.md#distinguishing-cases Retains lower/upper/head/face/full regions, all three pairwise intersections, concatenation order and unique count. Unknown runtime region admission, list mutation ownership and future bone-union completeness are outside this unchanged unit.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns all direct region reads and local set observations. The private intersection helper registers no extra cases and starts no viewer, process or native artifact.
 */
export function test_perform_body_region_bones(): void {
  const lower: readonly AutoMovieHumanoidBone[] = bodyRegionBones("lowerBody");
  const upper: readonly AutoMovieHumanoidBone[] = bodyRegionBones("upperBody");
  const head: readonly AutoMovieHumanoidBone[] = bodyRegionBones("head");
  const face: readonly AutoMovieHumanoidBone[] = bodyRegionBones("face");
  const full: readonly AutoMovieHumanoidBone[] = bodyRegionBones("fullBody");

  // 1. membership
  TestValidator.equals("lowerBody owns 9 bones", lower.length, 9);
  TestValidator.equals(
    "lowerBody has hips + a foot",
    namedFacts([
      ["lowerIncludesHips", (): boolean => lower.includes("hips")],
      ["lowerIncludesLeftFoot", (): boolean => lower.includes("leftFoot")],
    ]),
    { lowerIncludesHips: true, lowerIncludesLeftFoot: true },
  );
  TestValidator.equals("upperBody owns 41 bones", upper.length, 41);
  TestValidator.equals(
    "upperBody has spine, a hand, a finger",
    namedFacts([
      ["upperIncludesSpine", (): boolean => upper.includes("spine")],
      ["upperIncludesLeftHand", (): boolean => upper.includes("leftHand")],
      [
        "upperIncludesRightLittleDistal",
        (): boolean => upper.includes("rightLittleDistal"),
      ],
    ]),
    {
      upperIncludesSpine: true,
      upperIncludesLeftHand: true,
      upperIncludesRightLittleDistal: true,
    },
  );
  TestValidator.equals("head owns 5 bones", head.length, 5);
  TestValidator.equals(
    "head has neck + jaw",
    namedFacts([
      ["headIncludesNeck", (): boolean => head.includes("neck")],
      ["headIncludesJaw", (): boolean => head.includes("jaw")],
    ]),
    { headIncludesNeck: true, headIncludesJaw: true },
  );
  TestValidator.equals("face owns no bones", face.length, 0);

  // 2. pairwise disjoint
  TestValidator.predicate("lower ∩ upper = ∅", disjoint(lower, upper));
  TestValidator.predicate("lower ∩ head = ∅", disjoint(lower, head));
  TestValidator.predicate("upper ∩ head = ∅", disjoint(upper, head));

  // 3. fullBody preserves the current three-list order and unique population.
  TestValidator.equals(
    "fullBody is the three regions concatenated",
    [...full],
    [...lower, ...upper, ...head],
  );
  TestValidator.equals("fullBody has no duplicates", new Set(full).size, 55);
}
