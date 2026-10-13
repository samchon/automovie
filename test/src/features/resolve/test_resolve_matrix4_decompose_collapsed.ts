import { Matrix4, Quaternion } from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose, qunit } from "../internal/predicates";

const finiteVec = (v: IAutoMovieVector3): boolean =>
  Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z);
const finiteQuat = (q: IAutoMovieQuaternion): boolean =>
  Number.isFinite(q.x) &&
  Number.isFinite(q.y) &&
  Number.isFinite(q.z) &&
  Number.isFinite(q.w);

/**
 * `Matrix4.decompose` on a **collapsed axis** (scale 0: a hidden part, a
 * folded joint) completes the missing basis direction from the surviving
 * columns instead of dividing `0 / 0 = NaN` into the quaternion and every
 * descendant world matrix (#719), so the rotation is a finite unit quaternion
 * and composing the result again rebuilds every surviving column under any
 * rotation, not only the identity.
 *
 * Scenarios:
 *
 * 1. Each axis collapsed in turn (identity rotation, other scales nonzero):
 *    rotation and scale are finite, the collapsed scale is exactly 0, and the
 *    surviving scales are recovered exactly.
 * 2. All three axes collapsed (zero matrix rotation block): still finite.
 * 3. A genuine small nonzero scale (1e-3) round-trips exactly.
 * 4. Under a generic rotation, each single collapsed axis and each pair of
 *    collapsed axes decompose to a unit rotation whose recomposition equals
 *    the original matrix.
 * 5. A nonzero scale far below `Number.EPSILON` (1e-20) under the same
 *    rotation recovers that rotation and scale.
 */
export const test_resolve_matrix4_decompose_collapsed = (): void => {
  const t = { x: 1, y: 2, z: 3 };
  const identity = { x: 0, y: 0, z: 0, w: 1 };

  const axes: Array<[string, IAutoMovieVector3, "x" | "y" | "z"]> = [
    ["x collapsed", { x: 0, y: 2, z: 3 }, "x"],
    ["y collapsed", { x: 2, y: 0, z: 3 }, "y"],
    ["z collapsed", { x: 2, y: 3, z: 0 }, "z"],
  ];
  for (const [title, scale, zero] of axes) {
    const d = Matrix4.decompose(Matrix4.compose(t, identity, scale));
    TestValidator.predicate(
      `${title}: rotation finite`,
      finiteQuat(d.rotation),
    );
    TestValidator.predicate(`${title}: scale finite`, finiteVec(d.scale));
    // the collapsed axis reads exactly 0 (raw length), not the EPSILON floor
    TestValidator.equals(`${title}: collapsed scale is 0`, d.scale[zero], 0);
    TestValidator.predicate(`${title}: position finite`, finiteVec(d.position));
  }

  // 2. Fully collapsed: the whole rotation block is zero; still finite.
  const allZero = Matrix4.decompose(
    Matrix4.compose(t, identity, { x: 0, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "all collapsed: rotation finite",
    finiteQuat(allZero.rotation),
  );
  TestValidator.predicate(
    "all collapsed: scale finite",
    finiteVec(allZero.scale),
  );
  TestValidator.equals("all collapsed: scale is 0,0,0", allZero.scale, {
    x: 0,
    y: 0,
    z: 0,
  });

  // 3. A real small scale round-trips exactly.
  const tiny = { x: 1e-3, y: 1e-3, z: 1e-3 };
  const rt = Matrix4.decompose(Matrix4.compose(t, identity, tiny));
  TestValidator.predicate("tiny scale x", nclose(rt.scale.x, 1e-3, 1e-9));
  TestValidator.predicate("tiny scale y", nclose(rt.scale.y, 1e-3, 1e-9));
  TestValidator.predicate("tiny scale z", nclose(rt.scale.z, 1e-3, 1e-9));
  TestValidator.predicate(
    "tiny scale rotation is identity",
    nclose(rt.rotation.w, 1, 1e-9),
  );

  // 4. Collapsed axes under a generic rotation rebuild the original matrix.
  const turned: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 2, z: 3 },
    70,
  );
  const scales: Array<[string, IAutoMovieVector3]> = [
    ["rotated x collapsed", { x: 0, y: 2, z: 3 }],
    ["rotated y collapsed", { x: 2, y: 0, z: 3 }],
    ["rotated z collapsed", { x: 2, y: 3, z: 0 }],
    ["rotated x only", { x: 2, y: 0, z: 0 }],
    ["rotated y only", { x: 0, y: 2, z: 0 }],
    ["rotated z only", { x: 0, y: 0, z: 2 }],
  ];
  for (const [title, scale] of scales) {
    const original: number[] = Matrix4.compose(t, turned, scale);
    const d = Matrix4.decompose(original);
    TestValidator.predicate(`${title}: unit rotation`, qunit(d.rotation, 1e-12));
    const rebuilt: number[] = Matrix4.compose(d.position, d.rotation, d.scale);
    TestValidator.predicate(
      `${title}: recomposition matches`,
      rebuilt.every((value: number, at: number): boolean =>
        nclose(value, original[at]!, 1e-12),
      ),
    );
  }

  // 5. A scale far below Number.EPSILON is still a direction, not a collapse.
  const minute: IAutoMovieVector3 = { x: 1e-20, y: 1e-20, z: 1e-20 };
  const small = Matrix4.decompose(Matrix4.compose(t, turned, minute));
  TestValidator.predicate(
    "minute scale rotation is recovered",
    qclose(small.rotation, turned, 1e-12),
  );
  TestValidator.predicate(
    "minute scale is recovered",
    nclose(small.scale.x / 1e-20, 1, 1e-12),
  );
};
