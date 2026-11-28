import type { IAutoMovieRecoveryCameraMapAdmissionOperation } from "@automovie/interface";

import { assertRecoveryCameraMapControls } from "./assertRecoveryCameraMapControls";
import { assertRecoveryCameraSeedControls } from "./assertRecoveryCameraSeedControls";
import { prepareRecoveryCameraViewSet } from "./prepareRecoveryCameraViewSet";

/*
 * Admit the ordered map triad before observing its rasters. The first two
 * views have their own seed pixel budget within the three-view map allowance.
 */
export function admitRecoveryCameraMap(
  input: Parameters<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> {
  if (
    !input ||
    input.schema !== "automovie-recovery-camera-map-input-v1" ||
    !Array.isArray(input.views) ||
    input.views.length !== 3
  )
    throw new Error(
      "invalid-camera-map: a versioned three-view map is required",
    );
  assertRecoveryCameraSeedControls(input.seedPolicy, input.seedBudget);
  assertRecoveryCameraMapControls(input.policy, input.budget);
  return prepareRecoveryCameraViewSet(
    input,
    input.budget.maxPixels,
    input.seedBudget.maxPixels,
  ).charts;
}
