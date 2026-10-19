import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";

/**
 * Admit the finite metric pixel chart and verify measured row/cell coordinates.
 * The relative binary64 bound covers arithmetic roundoff, not segmentation or
 * camera uncertainty. A chart whose frame offset overwhelms pixel increments
 * refuses instead of publishing aliased stations as calibrated measurements.
 *
 * @evidence contracts/common.md#principled-implementation Finite distinct image-edge bounds and a pixel-to-frame scale test precede inverse mapping of row centres and support-cell edges. Round-trip integer/chart bounds and adjacent-row spacing preserve the fixed-background observation schema.
 * @evidence contracts/common.md#clear-and-simple-design Observation and saved-observation fitting share one numerical chart admission owner rather than applying different camera/pixel conventions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate rounding changes observations, missing row is interpolated into a claimed measured row or epsilon denominator repairs a collapsed chart.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, pixel centres/edges, conditional roundoff tolerance, contiguous support and refusal for unrepresentable frame gauges.
 * @evidence contracts/performance.md#efficient-algorithms Setup and each row check use fixed-count arithmetic without a pixel scan or per-image buffer.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned closure reuses its camera scalars and roundoff bound for all rows of that view only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A constant-size borrowed-camera closure survives for one synchronous operation; no image, handle, global cache or task is retained.
 */
export function assertRecoveryImageChart(
  view: Pick<
    IAutoMovieRecoveryImageInput["views"][number],
    "width" | "height" | "camera"
  >,
): {
  assertRow: (
    row: { yMm: number; lowerMm: number; upperMm: number },
    previousY?: number,
  ) => void;
} {
  const pitch: number = view.camera.pixelPitchMm;
  const [u0, v0]: [number, number] = view.camera.principalPointPx;
  const scale: number = Math.max(
    1, Math.abs(u0), Math.abs(v0), view.width, view.height,
  );
  if (
    !(pitch * 0.001 > 0) ||
    !Number.isFinite(pitch * 0.001) ||
    scale * 128 * Number.EPSILON >= 1
  )
    throw new Error(
      "ill-conditioned-pixel-chart: metric frame cannot preserve pixel increments",
    );
  const limits: number[] = [
    -u0 * pitch,
    (view.width - u0) * pitch,
    (v0 - view.height) * pitch,
    v0 * pitch,
  ];
  if (
    !limits.every(Number.isFinite) ||
    !(limits[0] < limits[1]) ||
    !(limits[2] < limits[3])
  )
    throw new Error(
      "invalid-pixel-chart: image edges need distinct finite metric coordinates",
    );
  const epsilon: number = 64 * Number.EPSILON * scale;
  return {
    assertRow: (
      row: { yMm: number; lowerMm: number; upperMm: number },
      previousY?: number,
    ): void => {
      const r: number = v0 - row.yMm / pitch - 0.5,
        left: number = u0 + row.lowerMm / pitch,
        right: number = u0 + row.upperMm / pitch;
      if (
        ![r, left, right].every(
          (value: number): boolean =>
            Number.isFinite(value) &&
            Math.abs(value - Math.round(value)) <= epsilon,
        ) ||
        Math.round(r) < 1 ||
        Math.round(r) > view.height - 2 ||
        Math.round(left) < 1 ||
        Math.round(right) > view.width - 1 ||
        !(Math.round(left) < Math.round(right)) ||
        (previousY !== undefined &&
          Math.abs(Math.abs((row.yMm - previousY) / pitch) - 1) > epsilon)
      )
        throw new Error(
          "invalid-pixel-support: occupied rows and cell limits must match the contiguous supplied pixel chart",
        );
    },
  };
}
