import type {
  IAutoMovieRecoveryImageChartAssertOperation,
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { assertRecoveryImageChart } from "../../geometry/internal/assertRecoveryImageChart";
import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";

/*
 * Measure opaque row supports using a supplied fixed RGB background and
 * cameras. This deterministic threshold is suitable for controlled-background
 * captures; shadows, reflections and foreground colours close to the background
 * remain acquisition limitations. No morphology, hole filling or component
 * deletion changes the measured mask. Quantization reports assume correctly
 * classified binary pixels and do not certify segmentation, rigidity or
 * calibration.
 */
export function observeAutoMovieRecoveryImages(
  input: IAutoMovieRecoveryImageInput,
  options: IAutoMovieRecoveryOptions = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageObservation> {
  const operator: IAutoMovieRecoveryResult<unknown>["operator"] =
    "orthographic-images-v1";
  let cancellationRequested: boolean = false;
  let cancellationCallback: boolean = false;
  let callback: boolean = false;
  const cancelled: () => boolean = (): boolean => {
    cancellationCallback = true;
    const requested: boolean = options.cancelled?.() === true;
    cancellationCallback = false;
    cancellationRequested = requested;
    return cancellationRequested;
  };
  try {
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before image admission"],
      };

    // The caller's budget bounds the views, their pixels and the occupied
    // rows the scan retains.
    if (
      !input.budget ||
      !isRecoveryPositiveSafeInteger(input.budget.maxViews) ||
      !isRecoveryPositiveSafeInteger(input.budget.maxPixels) ||
      !isRecoveryPositiveSafeInteger(input.budget.maxRows)
    )
      throw new Error(
        "invalid-capture: positive safe-integer view, pixel and row budgets required",
      );
    if (input.views.length > input.budget.maxViews)
      throw new Error("invalid-capture: views exceed the view budget");
    let pixels: number = 0;
    for (const view of input.views) {
      if (
        !isRecoveryPositiveSafeInteger(view.width) ||
        !isRecoveryPositiveSafeInteger(view.height)
      )
        throw new Error(
          "invalid-capture: positive safe-integer image dimensions required",
        );
      const count: number = view.width * view.height;
      if (!Number.isSafeInteger(count))
        throw new Error(
          "invalid-capture: image pixel count is not a safe integer",
        );
      pixels += count;
      if (pixels > input.budget.maxPixels)
        throw new Error(
          "budget-exhausted: total image pixels exceed maxPixels",
        );
      assertRecoveryImageChart(view);
    }

    const red: number = input.background.rgb[0],
      green: number = input.background.rgb[1],
      blue: number = input.background.rgb[2],
      threshold: number = input.background.threshold;
    const redForeground: Uint8Array = new Uint8Array(256),
      greenForeground: Uint8Array = new Uint8Array(256),
      blueForeground: Uint8Array = new Uint8Array(256);
    for (let value: number = 0; value < 256; value++) {
      redForeground[value] = Math.abs(value - red) >= threshold ? 1 : 0;
      greenForeground[value] = Math.abs(value - green) >= threshold ? 1 : 0;
      blueForeground[value] = Math.abs(value - blue) >= threshold ? 1 : 0;
    }
    const views: IAutoMovieRecoveryImageObservation["views"] = [];
    let retained: number = 0;
    for (const view of input.views) {
      if (cancelled())
        return {
          operator,
          status: "cancelled",
          diagnostics: ["Cancelled between image scans"],
        };
      const rows: IAutoMovieRecoveryImageObservation["views"][number]["rows"] =
        [];
      const chart: ReturnType<IAutoMovieRecoveryImageChartAssertOperation.Operation> =
        assertRecoveryImageChart(view);
      let previousRow: number | undefined;
      for (let row: number = 0; row < view.height; row++) {
        let first: number = view.width,
          last: number = -1,
          count: number = 0;
        for (let column: number = 0; column < view.width; column++) {
          const at: number = 3 * (row * view.width + column);
          if (
            !redForeground[view.rgb8[at]] &&
            !greenForeground[view.rgb8[at + 1]] &&
            !blueForeground[view.rgb8[at + 2]]
          )
            continue;
          if (count === 0) first = column;
          last = column;
          count++;
        }
        if (count === 0) continue;
        if (
          row === 0 ||
          row + 1 === view.height ||
          first === 0 ||
          last + 1 === view.width
        )
          throw new Error(
            `clipped-foreground: ${view.id} touches an image border`,
          );
        if (
          last - first + 1 !== count ||
          (previousRow !== undefined && previousRow + 1 !== row)
        )
          throw new Error(
            `unsupported-support: ${view.id} has holes or disconnected foreground`,
          );
        if (++retained > input.budget.maxRows)
          throw new Error(
            "budget-exhausted: occupied support rows exceed maxRows",
          );
        const camera: typeof view.camera = view.camera;
        const pitch: number = camera.pixelPitchMm;
        const yMm: number = (camera.principalPointPx[1] - row - 0.5) * pitch;
        const lowerMm: number = (first - camera.principalPointPx[0]) * pitch;
        const upperMm: number = (last + 1 - camera.principalPointPx[0]) * pitch;
        const measured: (typeof rows)[number] = { yMm, lowerMm, upperMm };
        chart.assertRow(measured, rows.at(-1));
        rows.push(measured);
        previousRow = row;
      }
      if (rows.length < 4)
        throw new Error(
          `insufficient-support: ${view.id} needs at least four occupied rows`,
        );
      rows.reverse();
      views.push({
        id: view.id,
        sourceSha256: view.sourceSha256,
        pixelProvenance: view.pixelProvenance,
        width: view.width,
        height: view.height,
        camera: {
          ...view.camera,
          principalPointPx: [...view.camera.principalPointPx],
        },
        rows,
        quantizationMm: view.camera.pixelPitchMm / 2,
      });
      callback = true;
      options.onProgress?.("image-support", views.length, input.views.length);
      callback = false;
    }
    if (cancelled())
      return {
        operator,
        status: "cancelled",
        diagnostics: ["Cancelled before observation transfer"],
      };
    return {
      operator,
      status: "complete",
      diagnostics: [],
      value: {
        objectId: input.objectId,
        frame: input.frame,
        cohort: input.cohort,
        method: "fixed-background-channel-distance-v1",
        views,
      },
    };
  } catch (failure: unknown) {
    return {
      operator,
      status: cancellationRequested
        ? "cancelled"
        : cancellationCallback || callback
          ? "failed"
          : "refused",
      diagnostics: [
        failure instanceof Error ? failure.message : String(failure),
      ],
    };
  }
}
