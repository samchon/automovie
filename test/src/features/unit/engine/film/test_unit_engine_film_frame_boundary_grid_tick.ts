import { productionFrameBoundaryToGridTick } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `productionFrameBoundaryToGridTick` puts a frame boundary on a destination
 * clock exactly: frame × denominator × ticks / numerator, rounded down, up, or
 * to nearest with halves up.
 *
 * Scenarios:
 *
 * 1. Frame 1 of NTSC 30000/1001 on a 48 kHz clock is 1001 × 48000 / 30000 = 1601.6
 *    ticks: floor 1601, ceiling 1602, nearest 1602.
 * 2. Frame 1 at 2 fps on a 3 Hz clock is 1.5 ticks: nearest rounds the half up to
 *    2, floor gives 1.
 * 3. Frame 0 is tick 0.
 * 4. A negative frame and a zero clock are refused.
 */
export function test_unit_engine_film_frame_boundary_grid_tick(): void {
  const ntsc = { numerator: 30000, denominator: 1001 };
  const two = { numerator: 2, denominator: 1 };
  TestValidator.equals(
    "each boundary's tick",
    [
      productionFrameBoundaryToGridTick({
        frame: 1,
        frameRate: ntsc,
        ticksPerSecond: 48000,
        rounding: "floor",
      }),
      productionFrameBoundaryToGridTick({
        frame: 1,
        frameRate: ntsc,
        ticksPerSecond: 48000,
        rounding: "ceiling",
      }),
      productionFrameBoundaryToGridTick({
        frame: 1,
        frameRate: ntsc,
        ticksPerSecond: 48000,
        rounding: "nearest",
      }),
      productionFrameBoundaryToGridTick({
        frame: 1,
        frameRate: two,
        ticksPerSecond: 3,
        rounding: "nearest",
      }),
      productionFrameBoundaryToGridTick({
        frame: 1,
        frameRate: two,
        ticksPerSecond: 3,
        rounding: "floor",
      }),
      productionFrameBoundaryToGridTick({
        frame: 0,
        frameRate: ntsc,
        ticksPerSecond: 48000,
        rounding: "ceiling",
      }),
    ],
    [1601, 1602, 1602, 2, 1, 0],
  );
  TestValidator.predicate(
    "a negative frame and a zero clock are refused",
    throwsError(
      () =>
        productionFrameBoundaryToGridTick({
          frame: -1,
          frameRate: two,
          ticksPerSecond: 3,
          rounding: "floor",
        }),
      "nonnegative",
    ) &&
      throwsError(
        () =>
          productionFrameBoundaryToGridTick({
            frame: 1,
            frameRate: two,
            ticksPerSecond: 0,
            rounding: "floor",
          }),
        "positive safe integer",
      ),
  );
}
