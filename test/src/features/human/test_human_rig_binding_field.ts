import type { AutoMovieHumanoidBone, IAutoMovieMeshSkin } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanRigBinding as Binding } from "../../../../packages/human/src/skeleton/AutoMovieHumanRigBinding";
import { AutoMovieHumanWeightField as F } from "../../../../packages/human/src/skeleton/AutoMovieHumanWeightField";

/**
 * Mesh export reads the same field and declares its four-slot loss.
 *
 * @evidence contracts/testing.md#behavioral-verification Binds synthetic model-metre points by the production binder and compares unrounded hinge weights and jets with their closed-form cubic. Reads actual raw skin method, explicit top-four discarded mass, stable tie slots and rigid bone ownership. The former thousandth representation is red against the non-round expectation.
 * @evidence contracts/testing.md#independent-expectations The cubic polynomial and its derivative independently specify a two-bone hinge. Five equal gates at one half retain root mass 1/32 and give each child 31/160; selecting four children discards 9/40 total mass and exports one quarter each. These synthetic branch expectations do not establish anatomical ownership.
 * @evidence contracts/testing.md#distinguishing-cases A two-bone interior sample, six positive influences, equal-slot selection, rigid declared and absent bones, incomplete and non-finite triples, and raw DQ method admission. Whole-person binding and analytic surface derivatives require their separate tests.
 * @evidence contracts/testing.md#execution-ownership A portable synchronous pure unit with no person, process, browser or GPU.
 */
export function test_human_rig_binding_field(): void {
  const bones: AutoMovieHumanoidBone[] = ["hips", "spine", "chest", "neck", "head", "jaw"];
  const index: Map<AutoMovieHumanoidBone, number> = new Map(bones.map((bone: AutoMovieHumanoidBone, slot: number): [AutoMovieHumanoidBone, number] => [bone, slot]));
  const child: F.ILimb = limb(1);
  const root: F.ILimb = limb(0, [child]);
  const binding: Binding.IBinding = Binding.prepare(bones, index, { root, arms: [], chest: 2 });
  const point: F.Vector = [0.03, 0.012345, 0.02];
  const u: number = (point[1] / 0.1 + 1) / 2;
  const expected: number = 3 * u ** 2 - 2 * u ** 3;
  const skin: IAutoMovieMeshSkin = binding.bind(point);
  const actual: number = skin.weights[skin.boneIndices.indexOf(1)]!;
  const field: Binding.IField = binding.field(point);
  const influence: Binding.IInfluence = field.influences.find((row: Binding.IInfluence): boolean => row.bone === "spine")!;
  TestValidator.predicate("mesh export preserves the non-round field", Math.abs(actual - expected) < 1e-12 && Math.abs(actual - Math.round(expected * 1000) / 1000) > 1e-5);
  TestValidator.predicate("public field reads the same value and derivative", Math.abs(influence.weight - expected) < 1e-12 && Math.abs(influence.gradient[1] - 3 * u * (1 - u) / 0.1) < 1e-12);
  TestValidator.equals("raw binding declares production DQ", skin.method, "dual-quaternion");
  root.kids = [1, 2, 3, 4, 5].map((slot: number): F.ILimb => limb(slot));
  const overlap: Binding.IBinding = Binding.prepare(bones, index, { root, arms: [], chest: 2 });
  const observed: Binding.IField = overlap.field([0, 0, 0]);
  TestValidator.equals("full field retains all six influences", observed.influences.length, 6);
  TestValidator.predicate("four-slot loss is explicit", Math.abs(observed.discardedMass - 9 / 40) < 1e-12);
  const truncated: IAutoMovieMeshSkin = overlap.bind([0, 0, 0]);
  TestValidator.equals("equal masses select stable semantic slots", truncated.boneIndices, [1, 2, 3, 4]);
  TestValidator.equals("top four renormalize their own mass", truncated.weights, [0.25, 0.25, 0.25, 0.25]);
  const rigid: IAutoMovieMeshSkin = binding.bind(point, "jaw");
  TestValidator.equals("rigid declared bone remains exact", [rigid.boneIndices[0], rigid.weights[0]], [5, 1]);
  for (const run of [(): unknown => binding.bind([0, 0]), (): unknown => binding.bind([0, NaN, 0]), (): unknown => binding.bind([0, NaN, 0], "head"), (): unknown => binding.bind(point, "leftScapula")]) {
    let refused: boolean = false;
    try { run(); }
    catch { refused = true; }
    TestValidator.predicate("malformed positions and missing rigid bone are refused", refused);
  }
}

/** Synthetic child gate centred at zero; a root's own gate is not evaluated. */
function limb(slot: number, kids: F.ILimb[] = []): F.ILimb {
  return { slot, from: [0, 0, 0], to: [0, 1, 0], near: 0.05, far: 0.05, planes: [{ at: [0, 0, 0], normal: [0, 1, 0], half: 0.1 }], lips: null, midline: 0, clear: null, side: 0, rivals: [], own: [], contest: 0, kids };
}
