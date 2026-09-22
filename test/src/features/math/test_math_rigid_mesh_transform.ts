import { Quaternion } from "@automovie/engine/math/Quaternion";
import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Rigid registration must recover rotation direction, including a half turn.
 * Scenarios:
 * 1. An asymmetric tetrahedron follows analytic coordinate permutations and translation.
 * 2. Uniform contraction cannot change the recovered body's scale.
 * 3. Planar, collinear and collapsed correspondence retain a proper rigid solution.
 * 4. Reflection retains nonzero residual, and caller buffers are unchanged.
 * 5. Tiny and large coordinate units retain the same analytic rotation.
 */
export const test_math_rigid_mesh_transform = (): void => {
  const source = [0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3];
  const apply = (reference: number[], target: number[]): number[] => {
    const result = fitRigidMeshTransform({
      reference,
      target,
      vertices: reference.filter((_, i) => i % 3 === 0).map((_, i) => i),
    });
    const { referenceCenter: a, targetCenter: b } = result;
    return reference.flatMap((_, i) => {
      if (i % 3 !== 0) return [];
      const p = Quaternion.rotateVector(result.rotation, {
        x: reference[i] - a.x,
        y: reference[i + 1] - a.y,
        z: reference[i + 2] - a.z,
      });
      return [p.x + b.x, p.y + b.y, p.z + b.z];
    });
  };
  const snapshot = source.slice();
  const turns = [
    (x: number, y: number, z: number) => [x, y, z],
    (x: number, y: number, z: number) => [-y, x, z],
    (x: number, y: number, z: number) => [-x, -y, z],
    (x: number, y: number, z: number) => [x, -y, -z],
    (x: number, y: number, z: number) => [-x, y, -z],
    (x: number, y: number, z: number) => [z, x, y],
    (x: number, y: number, z: number) => [y, z, x],
  ];
  for (const turn of turns) {
    const target = source.flatMap((_, i) =>
      i % 3 === 0
        ? turn(source[i], source[i + 1], source[i + 2]).map((v, k) => v + k + 4)
        : [],
    );
    const saved = target.slice();
    TestValidator.predicate(
      "analytic proper motion",
      apply(source, target).every((v, i) => nclose(v, target[i], 1e-10)),
    );
    TestValidator.equals("target ownership", target, saved);
  }
  // Centered symmetric axes make the best rotation identity under contraction.
  const axes = [1, 0, 0, -1, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 3, 0, 0, -3];
  TestValidator.predicate(
    "no fitted scale",
    apply(
      axes,
      axes.map((v) => v * 0.5),
    ).every((v, i) => nclose(v, axes[i], 1e-10)),
  );
  TestValidator.predicate(
    "collapsed target keeps reference dimensions",
    apply(
      axes,
      axes.map(() => 0),
    ).every((v, i) => nclose(v, axes[i], 1e-10)),
  );
  for (const reference of [
    [0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 2, 0],
  ]) {
    const target = reference.map((v, i) => v + (i % 3) + 2);
    TestValidator.predicate(
      "rank-deficient translation",
      apply(reference, target).every((v, i) => nclose(v, target[i], 1e-10)),
    );
  }
  const mirror = source.map((v, i) => (i % 3 === 0 ? -v : v));
  TestValidator.predicate(
    "reflection is not a rigid rotation",
    apply(source, mirror).some((v, i) => Math.abs(v - mirror[i]) > 0.1),
  );
  TestValidator.equals("reference ownership", source, snapshot);
  for (const scale of [1e-150, 1e150]) {
    const reference = source.map((v) => v * scale);
    const target = source.flatMap((_, i) =>
      i % 3 === 0
        ? [-source[i + 1], source[i], source[i + 2]].map((v) => v * scale)
        : [],
    );
    TestValidator.predicate(
      "coordinate units preserve rotation",
      apply(reference, target).every((v, i) =>
        nclose(v / scale, target[i] / scale, 1e-10),
      ),
    );
  }
};
