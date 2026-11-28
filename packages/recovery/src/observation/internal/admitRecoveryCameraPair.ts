import type { IAutoMovieRecoveryCameraPairAdmissionOperation } from "@automovie/interface";

import { assertRecoveryCameraSeedControls } from "./assertRecoveryCameraSeedControls";
import { prepareRecoveryCameraViewSet } from "./prepareRecoveryCameraViewSet";

/*
 * Admit exactly one calibrated pair and return its ordered charts and total
 * pixel population before feature extraction.
 */
export function admitRecoveryCameraPair(
  input: Parameters<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> {
  if (
    !input ||
    input.schema !== "automovie-recovery-camera-pair-v1" ||
    !Array.isArray(input.views) ||
    input.views.length !== 2
  )
    throw new Error(
      "invalid-camera-input: a versioned two-view pair is required",
    );
  assertRecoveryCameraSeedControls(input.policy, input.budget);
  const { charts, pixels }: ReturnType<typeof prepareRecoveryCameraViewSet> =
    prepareRecoveryCameraViewSet(
      input,
      input.budget.maxPixels,
      input.budget.maxPixels,
    );
  return { charts: [charts[0]!, charts[1]!], pixels };
}
