import { adjacentAutoMovieFloat64 } from "@automovie/engine";
import type {
  IAutoMovieRecoveryFeasibleArithmetic,
  IAutoMovieSimplexAtom,
  IAutoMovieSimplexMinimum,
} from "@automovie/interface";

/**
 * Bound stored-dual reconstruction separately from actual returned-row error.
 * Stored Float64 inputs are exact here. Sequential multiply/add uses gamma(2m),
 * with an absolute subnormal term, before exact normalization by the weight
 * sum. All positive bounds and minimum-price endpoints are rounded outward.
 */
export function measureRecoveryFeasibleArithmetic(
  rows: readonly IAutoMovieSimplexAtom[],
  solution: IAutoMovieSimplexMinimum,
): IAutoMovieRecoveryFeasibleArithmetic {
  const up: (value: number) => number = (value: number): number =>
    adjacentAutoMovieFloat64(value, true);
  const down: (value: number) => number = (value: number): number =>
    adjacentAutoMovieFloat64(value, false);
  const gamma: (operations: number) => number = (
    operations: number,
  ): number => {
    const product: number = up(operations * (Number.EPSILON / 2));
    if (!(product < 0.5))
      throw new Error(
        "camera-feasible: bounded arithmetic operation count required",
      );
    return up(product / down(1 - product));
  };
  const underflow: (operations: number) => number = (
    operations: number,
  ): number =>
    up(
      up(operations * Number.MIN_VALUE) /
        down(1 - up(operations * (Number.EPSILON / 2))),
    );
  let lowerMass: number = 0,
    upperMass: number = 0,
    absolute: number = 0;
  for (let at: number = 0; at < rows.length; at++) {
    const weight: number = solution.weights[at]!;
    lowerMass = Math.max(0, down(lowerMass + weight));
    upperMass = up(upperMass + weight);
    let maximum: number = 0;
    for (const value of rows[at]!.values)
      maximum = Math.max(maximum, Math.abs(value));
    absolute = up(absolute + up(weight * maximum));
  }
  if (!(lowerMass > 0))
    throw new Error("camera-feasible: positive exact simplex mass required");
  const formation: number = up(
    up(gamma(2 * rows.length) * absolute) + underflow(2 * rows.length),
  );
  let maximumAggregate: number = 0;
  for (const value of solution.aggregate)
    maximumAggregate = Math.max(maximumAggregate, Math.abs(value));
  const massError: number = Math.max(
    up(Math.abs(lowerMass - 1)),
    up(Math.abs(upperMass - 1)),
  );
  const aggregate: number = up(
    up(formation + up(maximumAggregate * massError)) / lowerMass,
  );
  let minimumLower: number = Infinity,
    minimumUpper: number = Infinity;
  let weightedError: number = 0,
    weightedMagnitude: number = 0;
  for (let at: number = 0; at < rows.length; at++) {
    const row: IAutoMovieSimplexAtom = rows[at]!;
    let norm: number = 0,
      terms: number = Math.abs(row.offset),
      price: number = row.offset;
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const coefficient: number = row.values[entry]!;
      const product: number =
        coefficient * solution.aggregate[row.indices[entry]!]!;
      norm = up(norm + Math.abs(coefficient));
      terms = up(terms + up(Math.abs(product)));
      price += product;
    }
    const error: number = up(
      up(norm * aggregate) +
        up(
          up(gamma(2 * row.indices.length + 1) * terms) +
            underflow(2 * row.indices.length + 1),
        ),
    );
    minimumLower = Math.min(minimumLower, down(price - error));
    minimumUpper = Math.min(minimumUpper, up(price + error));
    weightedError = up(weightedError + up(solution.weights[at]! * error));
    const magnitude: number = up(
      Math.abs(price) + Math.abs(solution.minimumPrice),
    );
    weightedMagnitude = up(
      weightedMagnitude + up(solution.weights[at]! * magnitude),
    );
  }
  const minimumPrice: number = Math.max(
    up(Math.abs(solution.minimumPrice - minimumLower)),
    up(Math.abs(solution.minimumPrice - minimumUpper)),
  );
  const sumError: number = up(
    up(
      gamma(4 * rows.length + 2) *
        up(weightedMagnitude + solution.gapMassAllowance),
    ) + underflow(4 * rows.length + 2),
  );
  const inverseMassError: number = up(massError / lowerMass);
  const gap: number = up(
    up(up(sumError + weightedError) / lowerMass) +
      up(
        up(minimumPrice + up(solution.gap * inverseMassError)) +
          up(solution.gapMassAllowance / lowerMass),
      ),
  );
  return { aggregate, minimumPrice, gap };
}
