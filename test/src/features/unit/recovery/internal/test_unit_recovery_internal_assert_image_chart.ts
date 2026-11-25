import { assertRecoveryImageChart } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertRecoveryImageChart` returns a row checker for a 10 by 10 chart with
 * pixel pitch 1 mm and principal point (5, 5): a row at y mm lies on pixel row r
 * = v0 - y / pitch - 1/2, and its limits on columns u0 + lower / pitch and u0 +
 * upper / pitch, all whole numbers inside the chart; rows after the first
 * step exactly one pixel and stay eight-connected.
 *
 * Scenarios:
 *
 * 1. y = 1.5 (r = 3), lower = -3 and upper = 2 (columns 2 to 7) is a valid first
 *    row; the next row y = 0.5 (r = 4) over columns 3 to 8 is connected to it.
 * 2. A lower limit of -3.3 is not a whole column and is refused.
 * 3. A row two pixels below the previous is refused.
 */
export function test_unit_recovery_internal_assert_image_chart(): void {
  const chart = assertRecoveryImageChart({
    width: 10,
    height: 10,
    camera: { pixelPitchMm: 1, principalPointPx: [5, 5] },
  });
  const first = { yMm: 1.5, lowerMm: -3, upperMm: 2 };
  chart.assertRow(first);
  chart.assertRow({ yMm: 0.5, lowerMm: -2, upperMm: 3 }, first);
  TestValidator.error("a fractional column", (): void =>
    chart.assertRow({ yMm: 1.5, lowerMm: -3.3, upperMm: 2 }),
  );
  TestValidator.error("a gap of two rows", (): void =>
    chart.assertRow({ yMm: -0.5, lowerMm: -2, upperMm: 3 }, first),
  );
}
