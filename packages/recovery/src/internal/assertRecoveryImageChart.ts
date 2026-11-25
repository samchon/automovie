import type { IAutoMovieRecoveryImageChartAssertOperation } from "@automovie/interface";

/**
 * Admit the finite metric pixel chart and verify measured row/cell coordinates.
 * Adjacent occupied rows must form one eight-connected foreground component.
 * The relative binary64 bound covers arithmetic roundoff, not segmentation or
 * camera uncertainty. A chart whose frame offset overwhelms pixel increments
 * refuses instead of publishing aliased stations as calibrated measurements.
 */
export function assertRecoveryImageChart(
  view: Parameters<IAutoMovieRecoveryImageChartAssertOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryImageChartAssertOperation.Operation> {
  const pitch: number = view.camera.pixelPitchMm;
  const [u0, v0]: [number, number] = view.camera.principalPointPx;
  const scale: number = Math.max(
    1,
    Math.abs(u0),
    Math.abs(v0),
    view.width,
    view.height,
  );
  if (!(pitch * 0.001 > 0) || scale * 128 * Number.EPSILON >= 1)
    throw new Error(
      "ill-conditioned-pixel-chart: metric frame cannot preserve pixel increments",
    );
  const limits: number[] = [
    -u0 * pitch,
    (view.width - u0) * pitch,
    (v0 - view.height) * pitch,
    v0 * pitch,
  ];
  if (!(limits[0] < limits[1]) || !(limits[2] < limits[3]))
    throw new Error(
      "invalid-pixel-chart: image edges need distinct finite metric coordinates",
    );
  const epsilon: number = 64 * Number.EPSILON * scale;
  return {
    assertRow: (
      row: { yMm: number; lowerMm: number; upperMm: number },
      previous?: { yMm: number; lowerMm: number; upperMm: number },
    ): void => {
      const r: number = v0 - row.yMm / pitch - 0.5,
        left: number = u0 + row.lowerMm / pitch,
        right: number = u0 + row.upperMm / pitch;
      if (
        ![r, left, right].every(
          (value: number): boolean =>
            Math.abs(value - Math.round(value)) <= epsilon,
        ) ||
        Math.round(r) < 1 ||
        Math.round(r) > view.height - 2 ||
        Math.round(left) < 1 ||
        Math.round(right) > view.width - 1 ||
        !(Math.round(left) < Math.round(right)) ||
        (previous !== undefined &&
          (Math.abs(Math.abs((row.yMm - previous.yMm) / pitch) - 1) > epsilon ||
            Math.round(left) > Math.round(u0 + previous.upperMm / pitch) ||
            Math.round(right) < Math.round(u0 + previous.lowerMm / pitch)))
      )
        throw new Error(
          "invalid-pixel-support: occupied rows and cell limits must form one eight-connected component in the supplied pixel chart",
        );
    },
  };
}
