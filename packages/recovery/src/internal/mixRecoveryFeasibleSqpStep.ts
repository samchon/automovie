import { adjacentAutoMovieFloat64 } from "@automovie/engine";
import type {
  IAutoMovieRecoveryFeasibleSqpStepMixingOperation,
  IAutoMovieRecoverySqpMix,
  IAutoMovieSimplexAtom,
} from "@automovie/interface";

/**
 * Try nominal physical mixing, then one original-row-supported coefficient. The
 * numerical branch is not the ideal cubic-rate mixture. Its operation- scaled
 * margin chooses a new vector, never an allowance on that vector's rows.
 */
export function mixRecoveryFeasibleSqpStep(
  rows: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[0],
  sqp: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[1],
  tilted: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[2],
  nominal: Parameters<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation>[3],
): ReturnType<IAutoMovieRecoveryFeasibleSqpStepMixingOperation.Operation> {
  const result: IAutoMovieRecoverySqpMix = {
    step: null,
    weight: nominal,
    numericalAttempted: false,
    numericalSupported: false,
  };
  const candidate: (weight: number) => number[] | null = (
    weight: number,
  ): number[] | null => {
    const step: number[] = sqp.map(
      (value: number, at: number): number =>
        (1 - weight) * value + weight * tilted[at]!,
    );
    if (step.some(overflowed)) return null;
    for (let at: number = 0; at < rows.length; at++) {
      const row: IAutoMovieSimplexAtom = rows[at]!;
      let slope: number = 0;
      for (let entry: number = 0; entry < row.indices.length; entry++)
        slope += row.values[entry]! * step[row.indices[entry]!]!;
      if (
        overflowed(slope) ||
        (at === 0
          ? !(slope < 0)
          : slope > row.offset || (row.offset === 0 && !(slope < 0)))
      )
        return null;
    }
    return step;
  };
  result.step = candidate(nominal);
  if (result.step !== null) return result;
  result.numericalAttempted = true;
  let lower: number = nominal,
    upper: number = 1;
  for (const row of rows) {
    let first: number = -row.offset,
      second: number = -row.offset;
    let magnitude: number = 2 * Math.abs(row.offset);
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const a: number = row.values[entry]! * sqp[row.indices[entry]!]!;
      const b: number = row.values[entry]! * tilted[row.indices[entry]!]!;
      first += a;
      second += b;
      magnitude = adjacentAutoMovieFloat64(
        magnitude + Math.abs(a) + Math.abs(b),
        true,
      );
    }
    const operations: number = 4 * row.indices.length + 16;
    const product: number = operations * (Number.EPSILON / 2);
    const gamma: number = adjacentAutoMovieFloat64(
      product / adjacentAutoMovieFloat64(1 - product, false),
      true,
    );
    const margin: number = adjacentAutoMovieFloat64(
      gamma * magnitude + operations * Number.MIN_VALUE,
      true,
    );
    const difference: number = second - first;
    if ([first, second, margin, difference].some(overflowed) || !(product < 1))
      return result;
    if (difference < 0) {
      if (first > -margin)
        lower = Math.max(
          lower,
          adjacentAutoMovieFloat64((first + margin) / -difference, true),
        );
    } else if (difference > 0)
      upper = Math.min(
        upper,
        adjacentAutoMovieFloat64((-margin - first) / difference, false),
      );
    else if (first > -margin) return result;
  }
  if (!(lower > nominal && lower < 1 && lower <= upper)) return result;
  result.weight = lower;
  result.step = candidate(lower);
  result.numericalSupported = result.step !== null;
  return result;
}

/** Whether a mixed step entry or slope overflowed binary64. */
function overflowed(value: number): boolean {
  return value === Infinity || value === -Infinity;
}
