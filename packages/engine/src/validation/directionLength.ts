import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Measure a direction whose norm can support validation and normalization.
 *
 * @param value The direction, which need not already have unit length.
 * @returns Its representable norm above the minimum, or null if unusable.
 */
export function directionLength(value: IAutoMovieVector3): number | null {
  const length: number = Vector3.length(value);
  return length > directionLength.MINIMUM && length < Infinity ? length : null;
}

/** The minimum magnitude that carries a direction in validation. */
export namespace directionLength {
  /** Directions at or below this norm are indistinguishable from zero. */
  export const MINIMUM: number = 1e-12;
}
