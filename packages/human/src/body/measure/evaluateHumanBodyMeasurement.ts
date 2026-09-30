import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";

/**
 * Evaluate one measurement on a freshly shaped rest body. The simple tier's
 * projection uses `createHumanBodyMeasurementReader` when it reads several
 * rules on exactly the same shape; an inverse trial is a new shape and uses
 * this direct entry.
 */
export function evaluateHumanBodyMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  return createHumanBodyMeasurementReader(basis, shape).read(rule);
}
