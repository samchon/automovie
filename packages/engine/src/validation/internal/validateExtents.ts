import type {
  IAutoMoviePrimitiveShape,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { invalidPrimitiveExtents } from "../../geometry/internal/invalidPrimitiveExtents";

/*
 * Record one range violation per dimension refused by primitive realization.
 */
export function validateExtents(
  shape: IAutoMoviePrimitiveShape,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  for (const [name, value] of invalidPrimitiveExtents(shape))
    collector.push(
      "range",
      `${path}.${name}`,
      `${name} must be a finite number > 0, but was ${value}`,
      value,
    );
}
