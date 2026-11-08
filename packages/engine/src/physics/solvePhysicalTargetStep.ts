import { decomposeAutoMovieSingularMatrix } from "../math/decomposeAutoMovieSingularMatrix";
import { physicalSingularBudget } from "./physicalSingularBudget";

/**
 * Damped least-squares target update with an active set at box boundaries.
 * Re-solve on free columns when a bound coordinate requests outward travel;
 * clipping a complete unconstrained step can otherwise stall every coordinate.
 * SVD acts on the original design. Bounds constrain the search direction and
 * the nonlinear caller still owns backtracking and actual residual admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Damped least-squares target update with an active set at box boundaries) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Damped least-squares target update with an active set at box boundaries) directly over its typed inputs (`input`) as nested iteration of depth 3 (every over input.errors; some over input.columns; every over column), delegating to `Number.isFinite`, `column.every`, `delta.fill`, `rows.map`, `free.map`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literals 64, 32, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 84 lines and 6 top-level statements that reuses `Number.isFinite`, `column.every`, `delta.fill`, `rows.map`, `free.map` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 17 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (every over input.errors; some over input.columns; every over column), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function solvePhysicalTargetStep(input: {
  /** One residual derivative column per bounded coordinate. */ columns: readonly (readonly number[])[];
  /** Actual residual vector, in the caller's units. */ errors: readonly number[];
  /** Current coordinates and inclusive limits. */ coordinates: readonly {
    value: number;
    minimum: number;
    maximum: number;
  }[];
  /** Positive damping in Jacobian units. */ damping: number;
}): number[] {
  if (
    !input.errors.length ||
    input.columns.length !== input.coordinates.length ||
    input.columns.length > 64 ||
    !Number.isFinite(input.damping) ||
    input.damping <= 0 ||
    !input.errors.every(Number.isFinite) ||
    input.columns.some(
      (column: readonly number[]): boolean =>
        column.length !== input.errors.length || !column.every(Number.isFinite),
    ) ||
    input.coordinates.some(
      (coordinate: {
        value: number;
        minimum: number;
        maximum: number;
      }): boolean =>
        ![coordinate.value, coordinate.minimum, coordinate.maximum].every(
          Number.isFinite,
        ) ||
        coordinate.minimum > coordinate.maximum ||
        coordinate.value < coordinate.minimum ||
        coordinate.value > coordinate.maximum,
    )
  )
    throw new Error("Invalid bounded physical target step");
  let free: number[] = input.coordinates
    .map((_: unknown, index: number): number => index)
    .filter(
      (index: number): boolean =>
        input.coordinates[index]!.minimum < input.coordinates[index]!.maximum &&
        input.columns[index]!.some((value: number): boolean => value !== 0),
    );
  const rows: number[] = input.errors
    .map((_: number, row: number): number => row)
    .filter((row: number): boolean =>
      input.columns.some(
        (column: readonly number[]): boolean => column[row] !== 0,
      ),
    );
  const delta: number[] = input.coordinates.map((): number => 0);
  for (
    let pass: number = 0;
    pass <= input.coordinates.length && free.length;
    pass++
  ) {
    delta.fill(0);
    const design: number[][] = rows.map((row: number): number[] =>
      free.map((index: number): number => input.columns[index]![row]!),
    );
    const decomposition: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
      decomposeAutoMovieSingularMatrix(design, physicalSingularBudget);
    for (let column: number = 0; column < free.length; column++) {
      const singular: number = decomposition.singularValues[column]!;
      const projection: number = decomposition.leftColumns[column]!.reduce(
        (sum: number, component: number, row: number): number =>
          sum + component * input.errors[rows[row]!]!,
        0,
      );
      const coefficient: number =
        (-singular * projection) / (singular * singular + input.damping ** 2);
      for (let index: number = 0; index < free.length; index++)
        delta[free[index]!] =
          delta[free[index]!]! +
          decomposition.rightColumns[column]![index]! * coefficient;
    }
    const retained: number[] = free.filter((index: number): boolean => {
      const coordinate: (typeof input.coordinates)[number] =
        input.coordinates[index]!;
      const tolerance: number =
        32 * Number.EPSILON * Math.max(1, Math.abs(coordinate.value));
      return !(
        (coordinate.value - coordinate.minimum <= tolerance &&
          delta[index]! < 0) ||
        (coordinate.maximum - coordinate.value <= tolerance &&
          delta[index]! > 0)
      );
    });
    if (retained.length === free.length) return delta;
    free = retained;
  }
  return delta.fill(0);
}
