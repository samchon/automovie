import type { IAutoMovieRecoveryCameraSceneAdmissionOperation } from "@automovie/interface";

import { isRecoveryPositiveSafeInteger } from "../../internal/isRecoveryPositiveSafeInteger";
import { assertRecoveryCameraMapControls } from "./assertRecoveryCameraMapControls";
import { assertRecoveryCameraSeedControls } from "./assertRecoveryCameraSeedControls";
import { prepareRecoveryCameraViewSet } from "./prepareRecoveryCameraViewSet";

/*
 * Admit the complete variable-size view set before feature extraction. The
 * first two views retain their seed budget, and later views stay in input order
 * for incremental registration.
 */
export function admitRecoveryCameraScene(
  input: Parameters<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation>[0],
): ReturnType<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation> {
  if (
    !input ||
    input.schema !== "automovie-recovery-camera-scene-input-v1" ||
    !Array.isArray(input.views) ||
    input.views.length < 3
  )
    throw new Error(
      "invalid-camera-scene: a versioned set of at least three views is required",
    );
  const budget: typeof input.budget = input.budget;
  if (
    !budget ||
    ![
      budget.maxViews,
      budget.maxCameraAttempts,
      budget.maxTotalResectionTrials,
      budget.maxTriangulations,
      budget.maxJointFits,
      budget.maxLinearWork,
      budget.maxResidentLinearEntries,
    ].every(isRecoveryPositiveSafeInteger) ||
    budget.maxViews < 3
  )
    throw new Error(
      "invalid-camera-scene: invalid view or incremental work budget",
    );
  if (input.views.length > budget.maxViews)
    throw new Error("invalid-camera-scene: views exceed the view budget");
  assertRecoveryCameraSeedControls(input.seedPolicy, input.seedBudget);
  assertRecoveryCameraMapControls(input.policy, budget);
  return prepareRecoveryCameraViewSet(
    input,
    budget.maxPixels,
    input.seedBudget.maxPixels,
  ).charts;
}
