import type { IAutoMovieRecoveryImageObservation } from "@automovie/interface/recovery";

import { assertRecoveryImageChart } from "./assertRecoveryImageChart";

/**
 * Admit measured image supports and prepare their common physical row chart.
 * Retain every original row inside the shared interval; interpolate other views
 * linearly only within their measured domains. This changes neither image bytes
 * nor the meaning of a recorded row. Cameras and rigidity remain supplied inputs.
 *
 * @evidence contracts/common.md#principled-implementation Shared byte/chart/row admission preserves integer pixel-cell observations and eight-connected intervals. The sorted union of common-domain row centres permits consistent physical support comparisons without matching sliding contour points or extrapolating ends.
 * @evidence contracts/common.md#clear-and-simple-design Both ellipse and general support hypotheses reuse one observation admission and interpolation owner; family equations and numerical fitting retain their separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No row deletion within the common interval, filled gap, altered chart, source mesh or camera estimate repairs unsupported input. Interpolation is qualified as comparison data rather than a newly measured pixel row.
 * @evidence contracts/common.md#meaningful-documentation States supplied-camera premises, pixel admission, union/common-domain policy, linear interpolation and unobserved ends.
 * @evidence contracts/performance.md#efficient-algorithms For V views and R total measured rows, validation and union sorting cost O(R log R); N common stations cost O(N V) interpolation and retained support. maxViews/maxRows bound the populations before assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work Camera trigonometry and interpolated supports are prepared once and serve all candidate spline spaces of one fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only call-owned direction/station/support arrays transfer synchronously; borrowed observations remain unchanged and no image, task, handle or global cache survives.
 */
export function prepareRecoveryImageSupports(
  observation: IAutoMovieRecoveryImageObservation,
  limits: { maxViews: number; maxRows: number },
): {
  lower: number;
  upper: number;
  directions: { c: number; s: number }[];
  stations: number[];
  supports: { lowerMm: number; upperMm: number }[][];
} {
  if (
    !observation ||
    observation.schema !== "automovie-recovery-image-support-v1" ||
    observation.method !== "fixed-background-channel-distance-v1" ||
    typeof observation.objectId !== "string" ||
    !observation.objectId.trim() ||
    typeof observation.frame !== "string" ||
    !observation.frame.trim() ||
    !["analytic", "photograph", "inconsistent-stress"].includes(
      observation.cohort,
    ) ||
    ![limits.maxViews, limits.maxRows].every(
      (n: number): boolean => Number.isSafeInteger(n) && n > 0,
    ) ||
    !Array.isArray(observation.views) ||
    observation.views.length < 3 ||
    observation.views.length > limits.maxViews
  )
    throw new Error(
      "invalid-image-support: versioned measured rows and finite budgets required",
    );
  const names: Set<string> = new Set();
  let rowCount: number = 0,
    lower: number = -Infinity,
    upper: number = Infinity;
  for (let index: number = 0; index < observation.views.length; index++) {
    const view: IAutoMovieRecoveryImageObservation["views"][number] =
      observation.views[index];
    if (
      !view ||
      typeof view.id !== "string" ||
      !view.id ||
      names.has(view.id) ||
      typeof view.sourceSha256 !== "string" ||
      !/^[a-f0-9]{64}$/i.test(view.sourceSha256) ||
      typeof view.pixelProvenance !== "string" ||
      !view.pixelProvenance ||
      !Number.isSafeInteger(view.width) ||
      view.width < 1 ||
      !Number.isSafeInteger(view.height) ||
      view.height < 1 ||
      !view.camera ||
      view.camera.type !== "horizontal-orthographic" ||
      view.camera.calibration !== "supplied" ||
      !Number.isFinite(view.camera.azimuthRadians) ||
      !Number.isFinite(view.camera.pixelPitchMm) ||
      view.camera.pixelPitchMm <= 0 ||
      !Array.isArray(view.camera.principalPointPx) ||
      view.camera.principalPointPx.length !== 2 ||
      !Number.isFinite(view.camera.principalPointPx[0]) ||
      !Number.isFinite(view.camera.principalPointPx[1]) ||
      view.quantizationMm !== view.camera.pixelPitchMm / 2 ||
      !Array.isArray(view.rows) ||
      view.rows.length < 4
    )
      throw new Error(
        `invalid-observation: supplied camera and dense support rows required at ${index}`,
      );
    rowCount += view.rows.length;
    if (!Number.isSafeInteger(rowCount) || rowCount > limits.maxRows)
      throw new Error("budget-exhausted: observed rows exceed maxRows");
    names.add(view.id);
    const chart: ReturnType<typeof assertRecoveryImageChart> =
      assertRecoveryImageChart(view);
    for (let row: number = 0; row < view.rows.length; row++) {
      const current: (typeof view.rows)[number] = view.rows[row];
      if (
        !current ||
        !Number.isFinite(current.yMm) ||
        !Number.isFinite(current.lowerMm) ||
        !Number.isFinite(current.upperMm) ||
        !(current.lowerMm < current.upperMm) ||
        (row > 0 && !(view.rows[row - 1].yMm < current.yMm))
      )
        throw new Error(
          "invalid-observation: finite, ordered, positive-width support rows required",
        );
      chart.assertRow(current, row > 0 ? view.rows[row - 1] : undefined);
    }
    lower = Math.max(lower, view.rows[0].yMm);
    upper = Math.min(upper, view.rows.at(-1)!.yMm);
  }
  if (!(lower < upper) || !Number.isFinite(upper - lower))
    throw new Error(
      "missing-common-support: views have no shared finite physical station interval",
    );
  const directions: { c: number; s: number }[] = observation.views.map(
    (
      view: IAutoMovieRecoveryImageObservation["views"][number],
    ): { c: number; s: number } => ({
      c: Math.cos(view.camera.azimuthRadians),
      s: Math.sin(view.camera.azimuthRadians),
    }),
  );
  const stations: number[] = [
    ...new Set(
      observation.views.flatMap(
        (view: IAutoMovieRecoveryImageObservation["views"][number]): number[] =>
          view.rows
            .filter(
              (row: (typeof view.rows)[number]): boolean =>
                row.yMm >= lower && row.yMm <= upper,
            )
            .map((row: (typeof view.rows)[number]): number => row.yMm),
      ),
    ),
  ].sort((a: number, b: number): number => a - b);
  if (stations.length < 4)
    throw new Error(
      "insufficient-common-support: four common-domain stations required",
    );
  const supports: { lowerMm: number; upperMm: number }[][] =
    observation.views.map(
      (
        view: IAutoMovieRecoveryImageObservation["views"][number],
      ): { lowerMm: number; upperMm: number }[] => {
        let cursor: number = 0;
        return stations.map(
          (station: number): { lowerMm: number; upperMm: number } => {
            while (
              cursor + 1 < view.rows.length &&
              view.rows[cursor + 1].yMm < station
            )
              cursor++;
            const a: (typeof view.rows)[number] = view.rows[cursor],
              b: (typeof view.rows)[number] =
                view.rows[Math.min(cursor + 1, view.rows.length - 1)];
            const t: number =
              a.yMm === b.yMm ? 0 : (station - a.yMm) / (b.yMm - a.yMm);
            return {
              lowerMm: a.lowerMm * (1 - t) + b.lowerMm * t,
              upperMm: a.upperMm * (1 - t) + b.upperMm * t,
            };
          },
        );
      },
    );
  return { lower, upper, directions, stations, supports };
}
