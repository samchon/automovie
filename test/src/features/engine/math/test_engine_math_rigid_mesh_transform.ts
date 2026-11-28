import { AutoMovieEngineQuaternion, AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";

/**
 * Allow 24 four-way Jacobi sweeps of unit-scaled covariance, each with six
 * rotations and up to 32 rounded operations per rotation. Fixture coordinates
 * stay within 8 units after scale normalization.
 */
const FIT_ROUNDING: number = 8 * 24 * 6 * 32 * Number.EPSILON;

/**
 * Rigid registration must recover rotation direction, including a half turn.
 * Scenarios:
 *
 * 1. An asymmetric tetrahedron follows analytic coordinate permutations and
 *    translation.
 * 2. Uniform contraction cannot change the recovered body's scale.
 * 3. Planar, collinear and collapsed correspondence retain a proper rigid
 *    solution.
 * 4. Reflection retains nonzero residual, and caller buffers are unchanged.
 * 5. Tiny and large coordinate units retain the same analytic rotation.
 * 6. A large translation of integer points leaves the centered covariance and
 *    recovered quarter turn unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers proper rigid fits across coordinate scales, rank deficiency, translation, ownership and reflection or scale limits.
 * @evidence contracts/development/testing.md#behavioral-verification Calls fitRigidMeshTransform on corresponding point buffers and applies the returned centered rigid transformation. It compares snapshots and probes isotropic scaling and a large translated target.
 * @evidence contracts/development/testing.md#independent-expectations Coordinate permutations and signs are analytic rotations. Centered symmetric axes expose prohibited scale, and a reflection cannot match a proper rotation. Explicit translations and a known quarter-turn quaternion remain references under rank deficiency and rescaling.
 */
export function test_engine_math_rigid_mesh_transform(): void {
  const source: number[] = [0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3];
  const apply: (reference: number[], target: number[]) => number[] = (
    reference: number[],
    target: number[],
  ): number[] => {
    const result: ReturnType<typeof AutoMovieEngineMath.fitRigidMeshTransform> =
      AutoMovieEngineMath.fitRigidMeshTransform({
        reference,
        target,
        vertices: reference
          .filter((_: number, i: number): boolean => i % 3 === 0)
          .map((_: number, i: number): number => i),
      });
    const {
      referenceCenter: a,
      targetCenter: b,
    }: ReturnType<typeof AutoMovieEngineMath.fitRigidMeshTransform> = result;
    return reference.flatMap((_: number, i: number): number[] => {
      if (i % 3 !== 0) return [];
      const p: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(result.rotation, {
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
        ? turn(source[i], source[i + 1], source[i + 2]).map(
            (v: number, k: number): number => v + k + 4,
          )
        : [],
    );
    const saved: number[] = target.slice();
    TestValidator.predicate(
      "analytic proper motion",
      apply(source, target).every((v: number, i: number): boolean =>
        nclose(v, target[i], FIT_ROUNDING),
      ),
    );
    TestValidator.equals("target ownership", target, saved);
  }
  // Centered symmetric axes make the best rotation identity under contraction.
  const axes: number[] = [
    1, 0, 0, -1, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 3, 0, 0, -3,
  ];
  TestValidator.predicate(
    "no fitted scale",
    apply(
      axes,
      axes.map((v: number): number => v * 0.5),
    ).every((v: number, i: number): boolean =>
      nclose(v, axes[i], FIT_ROUNDING),
    ),
  );
  TestValidator.predicate(
    "collapsed target keeps reference dimensions",
    apply(
      axes,
      axes.map((): number => 0),
    ).every((v: number, i: number): boolean =>
      nclose(v, axes[i], FIT_ROUNDING),
    ),
  );
  for (const reference of [
    [0, 0, 0],
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 2, 0],
  ]) {
    const target: number[] = reference.map(
      (v: number, i: number): number => v + (i % 3) + 2,
    );
    TestValidator.predicate(
      "rank-deficient translation",
      apply(reference, target).every((v: number, i: number): boolean =>
        nclose(v, target[i], FIT_ROUNDING),
      ),
    );
  }
  const mirror: number[] = source.map((v: number, i: number): number =>
    i % 3 === 0 ? -v : v,
  );
  TestValidator.predicate(
    "reflection is not a rigid rotation",
    apply(source, mirror).some(
      (v: number, i: number): boolean => !nclose(v, mirror[i], FIT_ROUNDING),
    ),
  );
  TestValidator.equals("reference ownership", source, snapshot);
  for (const scale of [1e-150, 1e150]) {
    const reference: number[] = source.map((v: number): number => v * scale);
    const target: number[] = source.flatMap((_: number, i: number): number[] =>
      i % 3 === 0
        ? [-source[i + 1], source[i], source[i + 2]].map(
            (v: number): number => v * scale,
          )
        : [],
    );
    TestValidator.predicate(
      "coordinate units preserve rotation",
      apply(reference, target).every((v: number, i: number): boolean =>
        nclose(v / scale, target[i] / scale, FIT_ROUNDING),
      ),
    );
  }
  const offset: number = 2 ** 49;
  const far: number[] = [
    offset,
    offset,
    offset,
    offset,
    offset + 1,
    offset,
    offset - 2,
    offset,
    offset,
    offset,
    offset,
    offset + 3,
  ];
  TestValidator.predicate(
    "centering suppresses translation before covariance products",
    qclose(
      AutoMovieEngineMath.fitRigidMeshTransform({
        reference: source,
        target: far,
        vertices: [0, 1, 2, 3],
      }).rotation,
      { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
      FIT_ROUNDING,
    ),
  );
}
