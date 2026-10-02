import { clipHumanPersonTriangles } from "@automovie/human/human/seam/clipHumanPersonTriangles";
import { evaluateHumanPersonCut } from "@automovie/human/human/seam/evaluateHumanPersonCut";
import { humanPersonCutBoneWeights } from "@automovie/human/human/seam/humanPersonCutBoneWeights";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A scalar cut keeps partial triangles and one identity on a shared edge.
 * Expectations are independent affine arithmetic, not emitted snapshots.
 *
 * Scenarios:
 * 1. Two oppositely incident triangles share crossing 6 on edge 0-2;
 *    below-cut vertices stay interior, and positive vertices disappear.
 * 2. Exact-zero endpoints survive without duplicate-corner triangles; empty,
 *    wholly retained, wholly removed and opposite crossing directions agree.
 * 3. Already performed endpoint positions blend after posing, and complete
 *    bone maps retain all eight distinct influences before final face pruning.
 */
export const test_human_person_cut = (): void => {
  const cut = {
    margins: [-1, -1, 1, -1],
    intersections: [{ a: 1, b: 2, t: 0.5 }, { a: 2, b: 3, t: 0.5 }, { a: 0, b: 2, t: 0.5 }],
    indices: [],
  };
  const corners = clipHumanPersonTriangles([0, 1, 2, 0, 2, 3], cut);
  TestValidator.equals("two retained quadrilaterals emit four triangles", corners.length, 12);
  TestValidator.predicate("both incident triangles share crossing identity", corners.filter((one) => one.vertex === 6).length >= 2);
  TestValidator.predicate("positive vertex removed and negative originals retained", !corners.some((one) => one.vertex === 2) && [0, 1, 3].every((v) => corners.some((one) => one.vertex === v)));
  const positions = evaluateHumanPersonCut([0, -1, 0, 2, -1, 0, 2, 1, 4, 0, -1, 4], cut);
  TestValidator.predicate("shared intersection uses already evaluated endpoints", nclose(positions[18], 1) && nclose(positions[19], 0) && nclose(positions[20], 2));
  TestValidator.equals("empty topology remains empty", clipHumanPersonTriangles([], cut), []);
  TestValidator.equals("all-negative triangle keeps source order", clipHumanPersonTriangles([0, 1, 3], cut).map((v) => v.vertex), [0, 1, 3]);
  TestValidator.equals("all-positive triangle disappears", clipHumanPersonTriangles([0, 1, 2], { margins: [1, 1, 1], intersections: [], indices: [] }), []);
  for (const margins of [[0, -1, 1], [1, 0, -1], [-1, 1, 0]]) {
    const a = margins.indexOf(-1);
    const b = margins.indexOf(1);
    const edge = { a: Math.min(a, b), b: Math.max(a, b), t: 0.5 };
    const emitted = clipHumanPersonTriangles([0, 1, 2], { margins, intersections: [edge], indices: [] });
    TestValidator.predicate("zero endpoint emits one distinct triangle", emitted.length === 3 && new Set(emitted.map((v) => v.vertex)).size === 3 && emitted.some((v) => v.vertex === margins.indexOf(0)));
  }
  TestValidator.equals("zero-only retained edge emits no area", clipHumanPersonTriangles([0, 1, 2], { margins: [0, 0, 1], intersections: [], indices: [] }), []);
  const skin = { joints: ["a", "b", "c", "d", "e", "f", "g", "h"], boneIndices: [0, 1, 2, 3, 4, 5, 6, 7], weights: [0.4, 0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.4] };
  const boneCut = { margins: [-1, 3], intersections: [{ a: 0, b: 1, t: 0.25 }], indices: [] };
  const mixed = humanPersonCutBoneWeights(skin, 2, boneCut);
  TestValidator.equals("no intermediate four-influence pruning", mixed.size, 8);
  TestValidator.predicate("complete weight map is affine and normalized", nclose(mixed.get("a")!, 0.3) && nclose(mixed.get("h")!, 0.1) && nclose([...mixed.values()].reduce((a, b) => a + b, 0), 1));
  TestValidator.equals("original vertex keeps its weights", [...humanPersonCutBoneWeights(skin, 0)], [...humanPersonCutBoneWeights(skin, 0, boneCut)]);
  TestValidator.equals("zero slots do not add bones", [...humanPersonCutBoneWeights({ joints: ["head"], boneIndices: [0, 0, 0, 0], weights: [1, 0, 0, 0] }, 0)], [["head", 1]]);
};
