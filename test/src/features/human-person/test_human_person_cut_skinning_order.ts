import { skinHumanBodySurface } from "@automovie/human/body/basis/skinHumanBodySurface";
import { evaluateHumanPersonCut } from "@automovie/human/human/seam/evaluateHumanPersonCut";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * A source edge must be sampled after its endpoint skinning when its performed
 * triangle is the declared source surface. Interpolating a rest position and
 * its weights first is a different dual-quaternion surface. The two-point
 * counterexample uses metres and a quarter turn around +Z, not clinical motion.
 *
 * Scenarios:
 * 1. Endpoint-specific identity and quarter-turn transforms move the source
 *    points to (+1, 0, 0) and (-1, 0, 0); their performed midpoint is zero.
 * 2. The interpolated rest point with equally blended influences rotates by
 *    45 degrees to (0, sqrt(1/2), 0), demonstrating noncommutation.
 * 3. With one common rigid transform both orders yield (-1/2, 1/2, 0).
 *    Neither operation changes caller-owned positions or frozen cut samples.
 */
export const test_human_person_cut_skinning_order = (): void => {
  const positions = [1, 0, 0, 0, 1, 0];
  const cut = {
    margins: [-1, 1],
    intersections: [{ a: 0, b: 1, t: 0.5 }],
    indices: [] as number[],
  };
  const skin: Parameters<typeof skinHumanBodySurface>[1] = {
    joints: ["hips", "head"],
    boneIndices: [0, 0, 0, 0, 1, 0, 0, 0],
    weights: [1, 0, 0, 0, 1, 0, 0, 0],
  };
  const midpointSkin: Parameters<typeof skinHumanBodySurface>[1] = {
    joints: ["hips", "head"],
    boneIndices: [0, 1, 0, 0],
    weights: [0.5, 0.5, 0, 0],
  };
  const joints: Parameters<typeof skinHumanBodySurface>[2] = [
    { bone: "hips", parent: null },
    { bone: "head", parent: "hips" },
  ];
  const identity = { x: 0, y: 0, z: 0, w: 1 };
  const quarter = { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 };
  const origin = { x: 0, y: 0, z: 0 };
  const transforms: Parameters<typeof skinHumanBodySurface>[3] = new Map([
    [
      "hips",
      {
        rest: { position: origin, rotation: identity },
        posed: { position: origin, rotation: identity },
      },
    ],
    [
      "head",
      {
        rest: { position: origin, rotation: identity },
        posed: { position: origin, rotation: quarter },
      },
    ],
  ]);
  const posed = skinHumanBodySurface(positions, skin, joints, transforms);
  TestValidator.predicate(
    "the endpoints establish the nonrigid performed edge",
    posed.every((value, i) => nclose(value, [1, 0, 0, -1, 0, 0][i], 1e-12)),
  );
  const after = evaluateHumanPersonCut(posed, cut).slice(6);
  TestValidator.predicate(
    "post-pose source-edge sampling reaches the origin",
    after.every((value) => nclose(value, 0, 1e-12)),
  );
  const restMidpoint = evaluateHumanPersonCut(positions, cut).slice(6);
  const before = skinHumanBodySurface(
    restMidpoint,
    midpointSkin,
    joints,
    transforms,
  );
  TestValidator.predicate(
    "pre-pose interpolation selects a distinct blended rotation",
    before.every((value, i) => nclose(value, [0, Math.SQRT1_2, 0][i], 1e-12)),
  );
  TestValidator.predicate(
    "the two supported orders must not be declared equivalent",
    Math.hypot(...before.map((value, i) => value - after[i])) > 0.7,
  );
  const rigid: Parameters<typeof skinHumanBodySurface>[3] = new Map(
    [...transforms].map(([bone, value]) => [
      bone,
      { ...value, posed: { position: origin, rotation: quarter } },
    ]),
  );
  const rigidAfter = evaluateHumanPersonCut(
    skinHumanBodySurface(positions, skin, joints, rigid),
    cut,
  ).slice(6);
  const rigidBefore = skinHumanBodySurface(
    restMidpoint,
    midpointSkin,
    joints,
    rigid,
  );
  TestValidator.predicate(
    "common rigid motion preserves the affine stencil",
    rigidAfter.every(
      (value, i) =>
        nclose(value, [-0.5, 0.5, 0][i], 1e-12) &&
        nclose(value, rigidBefore[i], 1e-12),
    ),
  );
  TestValidator.equals(
    "source positions remain owned by the caller",
    positions,
    [1, 0, 0, 0, 1, 0],
  );
  TestValidator.predicate(
    "the frozen cut remains unchanged",
    cut.margins[0] === -1 &&
      cut.margins[1] === 1 &&
      cut.intersections.length === 1 &&
      cut.intersections[0].a === 0 &&
      cut.intersections[0].b === 1 &&
      nclose(cut.intersections[0].t, 0.5, 1e-12) &&
      cut.indices.length === 0,
  );
};
