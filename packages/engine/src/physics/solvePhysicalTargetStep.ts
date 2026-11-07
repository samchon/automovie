import { decomposeAutoMovieSingularMatrix } from "../math/decomposeAutoMovieSingularMatrix";

/**
 * Damped least-squares target update with an active set at box boundaries.
 * Re-solve on free columns when a bound coordinate requests outward travel;
 * clipping a complete unconstrained step can otherwise stall every coordinate.
 * SVD acts on the original design. Bounds constrain the search direction and
 * the nonlinear caller still owns backtracking and actual residual admission.
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
      decomposeAutoMovieSingularMatrix(design, {
        maxEntries: 65536,
        maxSweeps: 64,
        orthogonalityTolerance: 1e-10,
      });
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
