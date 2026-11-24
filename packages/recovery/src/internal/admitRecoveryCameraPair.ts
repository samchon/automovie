import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairAdmissionOperation,
} from "@automovie/interface";

import { createRecoveryCameraChart } from "./createRecoveryCameraChart";

/** One view's supplied pixel chart, constructed for the numerical phases. */
type Chart = ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>;

/**
 * Prepare the resident pair before any image-sized allocation: the caller's
 * pixel budget bounds its two views, and their supplied pixel charts are
 * constructed once for the later numerical phases. Calibration, provenance,
 * rigidity and the declared policy and budget remain caller assertions.
 */
export function admitRecoveryCameraPair(
  input: Parameters<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> {
  let pixels: number = 0;
  const charts: Chart[] = [];
  for (const view of input.views) {
    pixels += view.width * view.height;
    if (!Number.isSafeInteger(pixels) || pixels > input.budget.maxPixels)
      throw new Error(
        "invalid-camera-input: exact RGB population exceeds dimensions or pixel budget",
      );
    charts.push(createRecoveryCameraChart(view));
  }
  return { charts: [charts[0]!, charts[1]!], pixels };
}