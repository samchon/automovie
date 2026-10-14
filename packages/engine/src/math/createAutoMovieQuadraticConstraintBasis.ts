import { IAutoMovieQuadraticConstraintBasis } from "./IAutoMovieQuadraticConstraintBasis";
import { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";

/**
 * Factor a working transpose by column-pivoted Householder QR, without A*A'.
 * Only structural identities reduce rows: a nonzero free a*x_j=0 fixes x_j=0,
 * irrespective of a's magnitude/sign, and an all-zero zero endpoint is tautological.
 * Every other numerical rank ambiguity refuses rather than discarding a row.
 * Original coefficients/bounds are borrowed read-only; all factors are owned.
 * Gill and Wong (2014), sections 2-3, require an independent working basis:
 * https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf
 * Binary64 rank readings and affine reconstruction remain separate from the
 * refinement caller's unchanged full original-row KKT and geometry admission.
 *
 * @evidence contracts/common.md#principled-implementation Column-pivoted Householder QR factors normalized working normals without normal equations; only tautological rows and exact zero-singleton identities merge, while dimension-scaled rank ambiguity refuses.
 * @evidence contracts/common.md#clear-and-simple-design One record supplies range, nullspace, triangular factors and particular point together with working ordinals and multiplier divisors.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts General numerical dependencies are never silently discarded; nonrepresentable normalization or reconstruction reports a reason and leaves partial factors unusable.
 * @evidence contracts/common.md#meaningful-documentation States borrowed coefficients, owned factors, structural reductions and numerical rank refusal required by the working-set step.
 * @evidence contracts/performance.md#efficient-algorithms For N variables and K working rows, QR costs O(N times K squared); complete basis reconstruction costs O(N squared times K), with O(N squared plus K squared) dense storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The same reflectors reconstruct the particular point and all basis columns; a changed working set requires new factors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned factors belong to the caller; normalized columns and reflectors become unreachable on success or refusal, with no retained row cache.
 * @author Samchon
 */
export function createAutoMovieQuadraticConstraintBasis(
  rows: readonly IAutoMovieQuadraticRow[],
  bounds: readonly number[],
  free: readonly boolean[],
  variables: number,
): IAutoMovieQuadraticConstraintBasis {
  const result: IAutoMovieQuadraticConstraintBasis = {
    variables,
    rank: 0,
    refusal: null,
    rankThreshold: 0,
    order: [],
    divisors: [],
    triangular: [],
    range: [],
    nullspace: [],
    particular: [],
    equivalentFreeRows: [],
  };
  const fail: (reason: string) => IAutoMovieQuadraticConstraintBasis = (
    reason: string,
  ): IAutoMovieQuadraticConstraintBasis => {
    result.refusal = reason;
    return result;
  };
  if (
    bounds.length !== rows.length ||
    free.length !== rows.length ||
    !bounds.every(Number.isFinite)
  )
    return fail("working-basis-endpoints-incomplete");
  if (!Number.isSafeInteger(variables) || variables < 0)
    return fail("working-basis-dimension-not-representable");
  try {
    result.particular = new Array<number>(variables).fill(0);
    const columns: number[][] = [],
      ordinals: number[] = [],
      divisors: number[] = [];
    const endpoints: number[] = [],
      singleton: Map<number, number> = new Map<number, number>();
    for (let at: number = 0; at < rows.length; at++) {
      const row: IAutoMovieQuadraticRow = rows[at];
      const nonzero: number[] = row.indices.filter(
        (_: number, corner: number): boolean => row.weights[corner] !== 0,
      );
      if (nonzero.length === 0) {
        if (bounds[at] !== 0)
          return fail("working-zero-normal-has-nonzero-endpoint");
        continue;
      }
      const exactSingleton: boolean =
        free[at] && bounds[at] === 0 && nonzero.length === 1;
      const existing: number | undefined = exactSingleton
        ? singleton.get(nonzero[0])
        : undefined;
      if (existing !== undefined) {
        result.equivalentFreeRows[existing].push(at);
        continue;
      }
      const column: number[] = new Array<number>(variables).fill(0);
      let divisor: number = 0;
      if (exactSingleton) {
        divisor = row.weights[row.indices.indexOf(nonzero[0])];
        column[nonzero[0]] = 1;
        singleton.set(nonzero[0], result.equivalentFreeRows.length);
        result.equivalentFreeRows.push([at]);
      } else {
        for (const value of row.weights) divisor = Math.hypot(divisor, value);
        for (let corner: number = 0; corner < row.indices.length; corner++)
          column[row.indices[corner]] = row.weights[corner] / divisor;
        if (
          row.weights.some(
            (value: number, corner: number): boolean =>
              value !== 0 && column[row.indices[corner]] === 0,
          )
        )
          return fail(
            "working-normal-normalization-lost-a-nonzero-coefficient",
          );
      }
      const endpoint: number = bounds[at] / divisor;
      if (
        !column.every(Number.isFinite) ||
        !Number.isFinite(endpoint) ||
        (bounds[at] !== 0 && endpoint === 0)
      )
        return fail("working-normal-normalization-not-representable");
      columns.push(column);
      ordinals.push(at);
      divisors.push(divisor);
      endpoints.push(endpoint);
    }
    const count: number = columns.length;
    if (count > variables)
      return fail("working-basis-has-unresolved-dependent-rows");
    const norm: (values: readonly number[], start: number) => number = (
      values: readonly number[],
      start: number,
    ): number => {
      let value: number = 0;
      for (let at: number = start; at < values.length; at++)
        value = Math.hypot(value, values[at]);
      return value;
    };
    let originalMaximum: number = 0;
    for (const column of columns)
      originalMaximum = Math.max(originalMaximum, norm(column, 0));
    result.rankThreshold =
      Math.max(variables, count) * Number.EPSILON * originalMaximum;
    const reflectors: number[][] = [];
    for (let at: number = 0; at < count; at++) {
      let selected: number = at,
        magnitude: number = 0;
      for (let column: number = at; column < count; column++) {
        const value: number = norm(columns[column], at);
        if (value > magnitude) {
          selected = column;
          magnitude = value;
        }
      }
      if (!(magnitude > result.rankThreshold))
        return fail("working-basis-numerical-rank-unresolved");
      [columns[at], columns[selected]] = [columns[selected], columns[at]];
      [ordinals[at], ordinals[selected]] = [ordinals[selected], ordinals[at]];
      [divisors[at], divisors[selected]] = [divisors[selected], divisors[at]];
      [endpoints[at], endpoints[selected]] = [
        endpoints[selected],
        endpoints[at],
      ];
      const reflector: number[] = columns[at].slice(at);
      reflector[0] += reflector[0] >= 0 ? magnitude : -magnitude;
      const length: number = norm(reflector, 0);
      for (let row: number = 0; row < reflector.length; row++)
        reflector[row] /= length;
      for (let column: number = at; column < count; column++) {
        let dot: number = 0;
        for (let row: number = 0; row < reflector.length; row++)
          dot += reflector[row] * columns[column][at + row];
        for (let row: number = 0; row < reflector.length; row++)
          columns[column][at + row] -= 2 * dot * reflector[row];
      }
      reflectors.push(reflector);
      result.rank++;
    }
    const apply: (values: number[]) => number[] = (
      values: number[],
    ): number[] => {
      for (let at: number = count - 1; at >= 0; at--) {
        const reflector: number[] = reflectors[at];
        let dot: number = 0;
        for (let row: number = 0; row < reflector.length; row++)
          dot += reflector[row] * values[at + row];
        for (let row: number = 0; row < reflector.length; row++)
          values[at + row] -= 2 * dot * reflector[row];
      }
      return values;
    };
    result.order = ordinals;
    result.divisors = divisors;
    result.triangular = Array.from(
      { length: count },
      (_: unknown, row: number): number[] =>
        Array.from({ length: count }, (_: unknown, column: number): number =>
          column < row ? 0 : columns[column][row],
        ),
    );
    const coordinates: number[] = new Array<number>(variables).fill(0);
    for (let row: number = 0; row < count; row++) {
      let value: number = endpoints[row];
      for (let column: number = 0; column < row; column++)
        value -= result.triangular[column][row] * coordinates[column];
      coordinates[row] = value / result.triangular[row][row];
    }
    result.particular = apply(coordinates);
    for (let column: number = 0; column < variables; column++) {
      const vector: number[] = new Array<number>(variables).fill(0);
      vector[column] = 1;
      (column < count ? result.range : result.nullspace).push(apply(vector));
    }
    if (
      !result.particular.every(Number.isFinite) ||
      [...result.range, ...result.nullspace].some(
        (column: number[]): boolean => !column.every(Number.isFinite),
      )
    )
      return fail("working-basis-orthogonal-reconstruction-not-representable");
    return result;
  } catch (error: unknown) {
    return fail(
      "working-basis-representation-refused: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}
