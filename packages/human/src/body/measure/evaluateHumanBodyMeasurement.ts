import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";

/**
 * Evaluate one measurement on a freshly shaped rest body. The simple tier's
 * projection uses `createHumanBodyMeasurementReader` when it reads several
 * rules on exactly the same shape; an inverse trial is a new shape and uses
 * this direct entry.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Computes a rule's value on the shaped surface, the number the editor prints and the simple tier solves against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Realizes the three rule kinds, the station walk and the null answers the specification lists.
 */
export function evaluateHumanBodyMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  return createHumanBodyMeasurementReader(basis, shape).read(rule);
}
