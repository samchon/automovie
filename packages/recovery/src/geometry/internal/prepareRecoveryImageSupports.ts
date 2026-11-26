import type {
  IAutoMovieRecoveryImageChartAssertOperation,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryImageSupportsPreparationOperation,
} from "@automovie/interface";

import { assertRecoveryImageChart } from "./assertRecoveryImageChart";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";

/**
 * Admit measured image supports and prepare their common physical row chart.
 * Retain every original row inside the shared interval; interpolate other views
 * linearly only within their measured domains. This changes neither image bytes
 * nor the meaning of a recorded row. Cameras and rigidity remain supplied
 * inputs.
 */
export function prepareRecoveryImageSupports(
  observation: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[0],
  limits: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation> {
  if (
    !observation ||
    observation.method !== "fixed-background-channel-distance-v1" ||
    !observation.objectId.trim() ||
    !observation.frame.trim() ||
    !["analytic", "photograph", "inconsistent-stress"].includes(
      observation.cohort,
    ) ||
    !isRecoveryPositiveSafeInteger(limits.maxViews) ||
    !isRecoveryPositiveSafeInteger(limits.maxRows) ||
    observation.views.length < 3 ||
    observation.views.length > limits.maxViews
  )
    throw new Error(
      "invalid-image-support: measured rows and finite budgets required",
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
      !view.id ||
      names.has(view.id) ||
      !/^[a-f0-9]{64}$/i.test(view.sourceSha256) ||
      !view.pixelProvenance ||
      view.width < 1 ||
      view.height < 1 ||
      !view.camera ||
      view.camera.type !== "horizontal-orthographic" ||
      view.camera.calibration !== "supplied" ||
      view.camera.pixelPitchMm <= 0 ||
      view.camera.principalPointPx.length !== 2 ||
      view.quantizationMm !== view.camera.pixelPitchMm / 2 ||
      view.rows.length < 4
    )
      throw new Error(
        `invalid-observation: supplied camera and dense support rows required at ${index}`,
      );
    rowCount += view.rows.length;
    if (rowCount > limits.maxRows)
      throw new Error("budget-exhausted: observed rows exceed maxRows");
    names.add(view.id);
    const chart: ReturnType<IAutoMovieRecoveryImageChartAssertOperation.Operation> =
      assertRecoveryImageChart(view);
    for (let row: number = 0; row < view.rows.length; row++) {
      const current: (typeof view.rows)[number] = view.rows[row];
      if (
        !current ||
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
  if (!(lower < upper))
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
