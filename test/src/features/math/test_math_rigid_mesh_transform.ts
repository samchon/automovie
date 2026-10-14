import { Quaternion } from "@automovie/engine/math/Quaternion";
import { fitRigidMeshTransform } from "@automovie/engine/math/fitRigidMeshTransform";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";

import { nclose } from "../internal/predicates";

/**
 * Rigid registration must recover rotation direction, including a half turn.
 * Scenarios:
 * 1. An asymmetric tetrahedron follows analytic coordinate permutations and translation.
 * 2. Uniform contraction cannot change the recovered body's scale.
 * 3. Planar, collinear and collapsed correspondence retain a proper rigid solution.
 * 4. Reflection retains nonzero residual, and caller buffers are unchanged.
 * 5. Tiny and large coordinate units retain the same analytic rotation.
 *
 * @evidence contracts/testing.md#behavioral-verification Fits and reapplies the proper rigid transform, asserting analytic point coordinates, preserved dimensions under contraction/collapse, degenerate translations, reflection residual and unchanged buffers. A reversed rotation, fitted scale or caller mutation fails these observations.
 * @evidence contracts/testing.md#independent-expectations Signed coordinate permutations define the seven proper motions and their translations; symmetric axes must retain their original dimensions when scale is fixed. A reflection of the asymmetric tetrahedron cannot be matched by a proper rotation. Reapplication uses Quaternion.rotateVector and can share its convention defects with the fitter; the analytic target coordinates remain independent.
 * @evidence contracts/testing.md#distinguishing-cases Covers identity, quarter/half turns and cyclic permutations, contraction, collapsed targets, singleton/line/plane correspondences, a reflection and coordinate scales 1e-150/1e150. Malformed selections and unrepresentable centering belong to the admission entry; no physiological or rendered motion is observed.
 * @evidence contracts/testing.md#execution-ownership This discoverable synchronous unit owns all local correspondence cases and calls portable fitting and quaternion source without installing a consumer, building a native artifact or starting a process, browser or GPU.
 */
export function test_math_rigid_mesh_transform(): void {
  const source: number[] = [0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3];
  const apply: (reference: number[], target: number[]) => number[] = (reference: number[], target: number[]): number[] => {
    const result: ReturnType<typeof fitRigidMeshTransform> = fitRigidMeshTransform({
      reference,
      target,
      vertices: reference.filter((_: number, i: number): boolean => i % 3 === 0).map((_: number, i: number): number => i),
    });
    const { referenceCenter: a, targetCenter: b }: ReturnType<typeof fitRigidMeshTransform> = result;
    return reference.flatMap((_: number, i: number): number[] => {
      if (i % 3 !== 0) return [];
      const p: IAutoMovieVector3 = Quaternion.rotateVector(result.rotation, {
        x: reference[i] - a.x,
        y: reference[i + 1] - a.y,
        z: reference[i + 2] - a.z,
      });
      return [p.x + b.x, p.y + b.y, p.z + b.z];
    });
  };
  const snapshot: number[] = source.slice();
  const turns: ((x: number, y: number, z: number) => number[])[] = [
    (x: number, y: number, z: number): number[] => [x, y, z],
    (x: number, y: number, z: number): number[] => [-y, x, z],
    (x: number, y: number, z: number): number[] => [-x, -y, z],
    (x: number, y: number, z: number): number[] => [x, -y, -z],
    (x: number, y: number, z: number): number[] => [-x, y, -z],
    (x: number, y: number, z: number): number[] => [z, x, y],
    (x: number, y: number, z: number): number[] => [y, z, x],
  ];
  for (const turn of turns) {
    const target: number[] = source.flatMap((_: number, i: number): number[] =>
      i % 3 === 0
        ? turn(source[i], source[i + 1], source[i + 2]).map((v: number, k: number): number => v + k + 4)
        : [],
    );
    const saved: number[] = target.slice();
    TestValidator.predicate(
      "analytic proper motion",
      apply(source, target).every((v: number, i: number): boolean => nclose(v, target[i], 1e-10)),
    );
    TestValidator.predicate("target ownership", equalGeometryTestValues(target, saved));
  }
  // Centered symmetric axes make the best rotation identity under contraction.
  const axes: number[] = [1, 0, 0, -1, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 3, 0, 0, -3];
  TestValidator.predicate(
    "no fitted scale",
    apply(
      axes,
      axes.map((v: number): number => v * 0.5),
    ).every((v: number, i: number): boolean => nclose(v, axes[i], 1e-10)),
  );
  TestValidator.predicate(
    "collapsed target keeps reference dimensions",
    apply(
      axes,
      axes.map((): number => 0),
    ).every((v: number, i: number): boolean => nclose(v, axes[i], 1e-10)),
  );
  for (const reference of [
    [0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 2, 0],
  ]) {
    const target: number[] = reference.map((v: number, i: number): number => v + (i % 3) + 2);
    TestValidator.predicate(
      "rank-deficient translation",
      apply(reference, target).every((v: number, i: number): boolean => nclose(v, target[i], 1e-10)),
    );
  }
  const mirror: number[] = source.map((v: number, i: number): number => (i % 3 === 0 ? -v : v));
  TestValidator.predicate(
    "reflection is not a rigid rotation",
    apply(source, mirror).some((v: number, i: number): boolean => Math.abs(v - mirror[i]) > 0.1),
  );
  TestValidator.predicate("reference ownership", equalGeometryTestValues(source, snapshot));
  for (const scale of [1e-150, 1e150]) {
    const reference: number[] = source.map((v: number): number => v * scale);
    const target: number[] = source.flatMap((_: number, i: number): number[] =>
      i % 3 === 0
        ? [-source[i + 1], source[i], source[i + 2]].map((v: number): number => v * scale)
        : [],
    );
    TestValidator.predicate(
      "coordinate units preserve rotation",
      apply(reference, target).every((v: number, i: number): boolean =>
        nclose(v / scale, target[i] / scale, 1e-10),
      ),
    );
  }
}
