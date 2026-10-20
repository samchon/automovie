import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Finite row-major matrix actions preserve order and reject incomplete operands.
 *
 * Scenarios:
 * 1. Independent scalar products pin a nonsymmetric transpose, noncommuting composition and retained homogeneous coordinate.
 * 2. A cross-product matrix has the prescribed left-operand order and magnitude.
 * 3. Sparse, short, nonfinite and overflowing operands throw without altering the next valid call or borrowed inputs.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls all four actual matrix methods and observes numeric actions, composition order, borrowed-array stability and rejection of sparse arrays as well as ordinary malformed values. A hole is an absent coordinate, not a zero or a finite entry.
 * @evidence contracts/testing.md#independent-expectations Literal row-dot products give [8,17,30] for the nonsymmetric matrix acting on [2,-3,4], and [8,29,54] after the prescribed shear. The Cartesian cross product [1,2,3] cross [2,-3,4] is [17,2,-7]. Expected entries are scalar arithmetic, not another matrix method's output or a saved snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Exercises nonsymmetric row/column storage, noncommuting factors, unchanged third-coordinate magnitude, cross handedness, fully and partly sparse arrays, invalid dimensions, NaN, Infinity, finite-operand overflow and recovery after refusal. Camera and renderer coordinate conversions remain separate owners.
 * @evidence contracts/testing.md#execution-ownership The portable test_geometry_matrix3 entry owns tiny CPU arrays and synchronous assertions only; it starts no process or renderer, opens no source/data file and replaces no method or global.
 */
export function test_geometry_matrix3(): void {
  const left: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 10];
  const right: number[] = [1, 0, 2, 0, 1, -1, 0, 0, 1];
  const point: number[] = [2, -3, 4];
  const check: (
    actual: readonly number[],
    expected: readonly number[],
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, at: number): boolean =>
      nclose(value, expected[at]!, 0),
    );
  TestValidator.predicate(
    "row-major transpose and linear action retain independent scalar expectations",
    check(AutoMovieMatrix3.transpose(left), [1, 4, 7, 2, 5, 8, 3, 6, 10]) &&
      check(AutoMovieMatrix3.apply(left, point), [8, 17, 30]),
  );
  TestValidator.predicate(
    "composition order follows the declared row-major action",
    check(
      AutoMovieMatrix3.multiply(left, right),
      [1, 2, 3, 4, 5, 9, 7, 8, 16],
    ) &&
      check(
        AutoMovieMatrix3.apply(AutoMovieMatrix3.multiply(left, right), point),
        [8, 29, 54],
      ) &&
      check(
        AutoMovieMatrix3.multiply(right, left),
        [15, 18, 23, -3, -3, -4, 7, 8, 10],
      ),
  );
  TestValidator.predicate(
    "cross-product matrix preserves handedness and original vector magnitude",
    check(
      AutoMovieMatrix3.apply(AutoMovieMatrix3.skew([1, 2, 3]), point),
      [17, 2, -7],
    ),
  );
  const sparse: number[] = new Array<number>(9);
  sparse[0] = 1;
  sparse[4] = 1;
  sparse[8] = 1;
  const actions: (() => unknown)[] = [
    (): unknown => AutoMovieMatrix3.skew(new Array<number>(3)),
    (): unknown => AutoMovieMatrix3.transpose(sparse),
    (): unknown => AutoMovieMatrix3.multiply(sparse, right),
    (): unknown => AutoMovieMatrix3.apply(left, new Array<number>(3)),
    (): unknown => AutoMovieMatrix3.transpose([1, 2]),
    (): unknown => AutoMovieMatrix3.skew([1, NaN, 3]),
    (): unknown => AutoMovieMatrix3.apply(left, [1, Infinity, 3]),
    (): unknown =>
      AutoMovieMatrix3.multiply(
        [Number.MAX_VALUE, 0, 0, 0, 1, 0, 0, 0, 1],
        [2, 0, 0, 0, 1, 0, 0, 0, 1],
      ),
  ];
  const refused: boolean[] = actions.map((action: () => unknown): boolean => {
    try {
      action();
      return false;
    } catch (error: unknown) {
      return error instanceof Error;
    }
  });
  TestValidator.predicate(
    "every incomplete, nonfinite or unrepresentable operand refuses",
    refused.every(Boolean),
  );
  TestValidator.predicate(
    "refused calls preserve inputs and do not poison subsequent valid work",
    check(left, [1, 2, 3, 4, 5, 6, 7, 8, 10]) &&
      check(right, [1, 0, 2, 0, 1, -1, 0, 0, 1]) &&
      check(point, [2, -3, 4]) &&
      check(AutoMovieMatrix3.apply(left, point), [8, 17, 30]),
  );
}
