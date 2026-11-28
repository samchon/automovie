import { AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieDeliveryCropNdc } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `deliveryCropNdc` turns a normalized delivery crop (top-left origin, y down)
 * into normalized device coordinates (centre origin, y up): x ↦ 2x - 1, y ↦ 1 -
 * 2y, with its normalized width and height and whether it is the whole frame.
 *
 * Scenarios:
 *
 * 1. No crop is the whole frame, -1…1 both ways.
 * 2. The crop 0.25…0.75 across and 0.125…0.875 down is -0.5…0.5 across and
 *    0.75…-0.75 up, 0.5 wide and 0.75 tall.
 * 3. A crop whose right edge is left of its left edge is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios define opposite vertical origins, whole-frame default, an exact off-center window calculation and reversed-edge refusal.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls deliveryCropNdc for omitted and explicit coordinates and compares the returned edges and extents. It also requests a reversed crop to exercise refusal.
 * @evidence contracts/development/testing.md#independent-expectations Applying x = 2x - 1 and y = 1 - 2y maps horizontal edges 0.25 and 0.75 to -0.5 and 0.5, and vertical edges 0.125 and 0.875 to 0.75 and -0.75. The authored normalized extent is 0.5 by 0.75.
 */
export function test_engine_film_delivery_crop_ndc(): void {
  const whole: IAutoMovieDeliveryCropNdc = {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    width: 1,
    height: 1,
    whole: true,
  };
  TestValidator.equals(
    "each crop in device coordinates",
    [
      AutoMovieEngineFilm.deliveryCropNdc(undefined),
      AutoMovieEngineFilm.deliveryCropNdc({ left: 0.25, top: 0.125, right: 0.75, bottom: 0.875 }),
    ],
    [
      whole,
      {
        left: -0.5,
        right: 0.5,
        top: 0.75,
        bottom: -0.75,
        width: 0.5,
        height: 0.75,
        whole: false,
      },
    ],
  );
  TestValidator.predicate(
    "an unordered crop is refused",
    throwsError(
      () => AutoMovieEngineFilm.deliveryCropNdc({ left: 0.75, top: 0, right: 0.25, bottom: 1 }),
      "ordered",
    ),
  );
}
