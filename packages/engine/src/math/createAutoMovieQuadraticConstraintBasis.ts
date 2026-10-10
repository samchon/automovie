import type { IAutoMovieQuadraticConstraintBasis } from "./IAutoMovieQuadraticConstraintBasis";
import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";

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
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves every original condition while making exact structural equivalences and numerical basis refusal explicit.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains working ordinals, equation divisors and free-dual transport instead of declaring a numerical rank reduction to be a geometry guarantee.
 * @author Samchon
 */
export function createAutoMovieQuadraticConstraintBasis(
  rows: readonly IAutoMovieQuadraticRow[],
  bounds: readonly number[],
  free: readonly boolean[],
  variables: number,
): IAutoMovieQuadraticConstraintBasis {
  const result: IAutoMovieQuadraticConstraintBasis = {
    variables, rank: 0, refusal: null, rankThreshold: 0, order: [], divisors: [],
    triangular: [], range: [], nullspace: [], particular: [],
    equivalentFreeRows: [],
  };
  const fail = (reason: string): IAutoMovieQuadraticConstraintBasis => {
    result.refusal = reason; return result;
  };
  if (bounds.length !== rows.length || free.length !== rows.length || !bounds.every(Number.isFinite))
    return fail("working-basis-endpoints-incomplete");
  if (!Number.isSafeInteger(variables) || variables < 0)
    return fail("working-basis-dimension-not-representable");
  try {
    result.particular = new Array<number>(variables).fill(0);
    const columns: number[][] = [], ordinals: number[] = [], divisors: number[] = [];
    const endpoints: number[] = [], singleton = new Map<number, number>();
    for (let at = 0; at < rows.length; at++) {
      const row = rows[at];
      const nonzero = row.indices.filter((_, corner) => row.weights[corner] !== 0);
      if (nonzero.length === 0) {
        if (bounds[at] !== 0) return fail("working-zero-normal-has-nonzero-endpoint");
        continue;
      }
      const exactSingleton = free[at] && bounds[at] === 0 && nonzero.length === 1;
      const existing = exactSingleton ? singleton.get(nonzero[0]) : undefined;
      if (existing !== undefined) {
        result.equivalentFreeRows[existing].push(at);
        continue;
      }
      const column = new Array<number>(variables).fill(0);
      let divisor = 0;
      if (exactSingleton) {
        divisor = row.weights[row.indices.indexOf(nonzero[0])];
        column[nonzero[0]] = 1;
        singleton.set(nonzero[0], result.equivalentFreeRows.length);
        result.equivalentFreeRows.push([at]);
      } else {
        for (const value of row.weights) divisor = Math.hypot(divisor, value);
        for (let corner = 0; corner < row.indices.length; corner++)
          column[row.indices[corner]] = row.weights[corner] / divisor;
        if (row.weights.some((value, corner) => value !== 0 && column[row.indices[corner]] === 0))
          return fail("working-normal-normalization-lost-a-nonzero-coefficient");
      }
      const endpoint = bounds[at] / divisor;
      if (!column.every(Number.isFinite) || !Number.isFinite(endpoint) ||
          bounds[at] !== 0 && endpoint === 0)
        return fail("working-normal-normalization-not-representable");
      columns.push(column); ordinals.push(at); divisors.push(divisor); endpoints.push(endpoint);
    }
    const count = columns.length;
    if (count > variables) return fail("working-basis-has-unresolved-dependent-rows");
    const norm = (values: readonly number[], start: number): number => {
      let value = 0;
      for (let at = start; at < values.length; at++) value = Math.hypot(value, values[at]);
      return value;
    };
    let originalMaximum = 0;
    for (const column of columns) originalMaximum = Math.max(originalMaximum, norm(column, 0));
    result.rankThreshold = Math.max(variables, count) * Number.EPSILON * originalMaximum;
    const reflectors: number[][] = [];
    for (let at = 0; at < count; at++) {
      let selected = at, magnitude = 0;
      for (let column = at; column < count; column++) {
        const value = norm(columns[column], at);
        if (value > magnitude) { selected = column; magnitude = value; }
      }
      if (!(magnitude > result.rankThreshold)) return fail("working-basis-numerical-rank-unresolved");
      [columns[at], columns[selected]] = [columns[selected], columns[at]];
      [ordinals[at], ordinals[selected]] = [ordinals[selected], ordinals[at]];
      [divisors[at], divisors[selected]] = [divisors[selected], divisors[at]];
      [endpoints[at], endpoints[selected]] = [endpoints[selected], endpoints[at]];
      const reflector = columns[at].slice(at);
      reflector[0] += reflector[0] >= 0 ? magnitude : -magnitude;
      const length = norm(reflector, 0);
      for (let row = 0; row < reflector.length; row++) reflector[row] /= length;
      for (let column = at; column < count; column++) {
        let dot = 0;
        for (let row = 0; row < reflector.length; row++) dot += reflector[row] * columns[column][at + row];
        for (let row = 0; row < reflector.length; row++) columns[column][at + row] -= 2 * dot * reflector[row];
      }
      reflectors.push(reflector); result.rank++;
    }
    const apply = (values: number[]): number[] => {
      for (let at = count - 1; at >= 0; at--) {
        const reflector = reflectors[at]; let dot = 0;
        for (let row = 0; row < reflector.length; row++) dot += reflector[row] * values[at + row];
        for (let row = 0; row < reflector.length; row++) values[at + row] -= 2 * dot * reflector[row];
      }
      return values;
    };
    result.order = ordinals; result.divisors = divisors;
    result.triangular = Array.from({ length: count }, (_, row) =>
      Array.from({ length: count }, (_, column) => column < row ? 0 : columns[column][row]));
    const coordinates = new Array<number>(variables).fill(0);
    for (let row = 0; row < count; row++) {
      let value = endpoints[row];
      for (let column = 0; column < row; column++) value -= result.triangular[column][row] * coordinates[column];
      coordinates[row] = value / result.triangular[row][row];
    }
    result.particular = apply(coordinates);
    for (let column = 0; column < variables; column++) {
      const vector = new Array<number>(variables).fill(0); vector[column] = 1;
      (column < count ? result.range : result.nullspace).push(apply(vector));
    }
    if (!result.particular.every(Number.isFinite) ||
        [...result.range, ...result.nullspace].some((column) => !column.every(Number.isFinite)))
      return fail("working-basis-orthogonal-reconstruction-not-representable");
    return result;
  } catch (error: unknown) {
    return fail("working-basis-representation-refused: " + (error instanceof Error ? error.message : String(error)));
  }
}
