import { Matrix4 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

const close: (a: number[], b: number[], eps?: number) => boolean = (
  a: number[],
  b: number[],
  eps: number = 1e-6,
): boolean =>
  a.length === b.length &&
  a.every((v: number, i: number): boolean => nclose(v, b[i]!, eps));

/**
 * Column-major matrix algebra supplies identity, TRS composition and ordered matrix multiplication.
 *
 * Scenarios:
 *
 * 1. `identity()` is the 16-element identity, ones on the diagonal.
 * 2. Composing translation (1,2,3) + identity rotation + scale (2,2,2) places the
 *    scale on the diagonal and the translation in the last column: the
 *    glTF/`three.js` column-major layout.
 * 3. Composing a 90° rotation about +Y (with unit scale) turns the basis so the
 *    matrix maps +X to −Z (right-handed, Y-up): the third row of column 0 is
 *    −1.
 * 4. `multiply(identity, M) === M`: identity is the product's unit.
 * 5. A non-trivial product `T · S` (translate ∘ scale) scales the basis and keeps
 *    the translation, confirming row/column indexing is consistent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Matrix4.identity/compose/multiply and observes every coefficient for identity, translation/scale, quarter-turn Y rotation and ordered translation-times-scale products.
 * @evidence contracts/testing.md#independent-expectations Column-major affine algebra gives diagonal scales, a final translation column and positive-X mapping to negative-Z under a right-handed quarter-turn; the product expectation is literal arithmetic, not three.js output.
 * @evidence contracts/testing.md#distinguishing-cases Identity and nontrivial translation/scale/rotation distinguish operand order and row/column mistakes; decomposition, collapse, shear and arbitrary nonfinite input are outside these finite examples.
 * @evidence contracts/testing.md#execution-ownership The named test_resolve_matrix4 entry executes the real portable synchronous arithmetic directly and compares numbers with predicates, without creating a renderer matrix or native host.
 */
export function test_resolve_matrix4(): void {
  // 1. identity
  TestValidator.predicate(
    "identity matrix",
    close(Matrix4.identity(), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  );

  // 2. compose translation + scale, identity rotation
  const ts: number[] = Matrix4.compose(
    { x: 1, y: 2, z: 3 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 2, y: 2, z: 2 },
  );
  TestValidator.predicate(
    "compose places scale on diagonal, translation in last column",
    close(ts, [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 1, 2, 3, 1]),
  );

  // 3. compose a 90° rotation about +Y
  const s: number = Math.SQRT1_2;
  const rotY: number[] = Matrix4.compose(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: s, z: 0, w: s },
    { x: 1, y: 1, z: 1 },
  );
  TestValidator.predicate(
    "compose 90° about Y maps +X to −Z",
    close(rotY, [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
  );

  // 4. identity is the multiplicative unit
  TestValidator.predicate(
    "identity · M = M",
    close(Matrix4.multiply(Matrix4.identity(), ts), ts),
  );

  // 5. T · S product: translate after scale
  const t: number[] = Matrix4.compose(
    { x: 5, y: 0, z: 0 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 1, y: 1, z: 1 },
  );
  const scale: number[] = Matrix4.compose(
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 3, y: 3, z: 3 },
  );
  TestValidator.predicate(
    "T · S scales the basis and keeps the translation",
    close(
      Matrix4.multiply(t, scale),
      [3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 5, 0, 0, 1],
    ),
  );
}
