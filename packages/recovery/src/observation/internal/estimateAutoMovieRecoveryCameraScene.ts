import type {
  AutoMovieRecoveryOperator,
  IAutoMovieRecoveryCameraSceneAdmissionOperation,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraSetObservationOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { admitRecoveryCameraScene } from "./admitRecoveryCameraScene";
import { createRecoveryCameraScene } from "./createRecoveryCameraScene";
import { observeRecoveryCameraSet } from "./observeRecoveryCameraSet";

/*
 * Estimate one bounded sparse component from fixed calibrated RGB images. Views
 * zero/one are the explicit seed. Further images are selected by existing map
 * support, registered independently, then committed with new registered-view
 * points and a complete gauge-fixed joint fit. Failed transactions preserve the
 * last accepted component and remain in its bounded attempt/work ledger.
 *
 * Completion stays partial: accepted-sparse-component does not mean all images
 * registered, metric dimensions, material truth or an editable surface. Inspect
 * null poses, coverage and stopReason. Supplied corrected pinhole K and
 * rigidity remain caller assertions. Keep borrowed RGB bytes stable until
 * return. Cancellation/progress are synchronous cooperative checkpoints; a
 * blocked event loop cannot deliver a later event-loop cancellation. Observer
 * exceptions publish no value.
 */
export function estimateAutoMovieRecoveryCameraScene(
  input: IAutoMovieRecoveryCameraSceneInput,
  options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraSceneEstimate> {
  const operator: AutoMovieRecoveryOperator = "calibrated-camera-scene-v1";
  const cancellation: Error = new Error(
    "Camera scene cancelled at a cooperative checkpoint",
  );
  cancellation.name = "RecoverySceneCancellation";
  let admitted: boolean = false,
    callback: boolean = false;
  try {
    const probe: typeof options.cancelled = options.cancelled;
    const observer: typeof options.onProgress = options.onProgress;
    const cancelled: () => boolean = (): boolean => {
      callback = true;
      const requested: boolean = probe?.() === true;
      callback = false;
      return requested;
    };
    if (cancelled()) throw cancellation;
    const charts: ReturnType<IAutoMovieRecoveryCameraSceneAdmissionOperation.Operation> =
      admitRecoveryCameraScene(input);
    const stable: IAutoMovieRecoveryCameraSceneInput = {
      ...input,
      seedPolicy: { ...input.seedPolicy },
      seedBudget: { ...input.seedBudget },
      policy: { ...input.policy },
      budget: { ...input.budget },
      views: input.views.map(
        (view: (typeof input.views)[number]): typeof view => ({
          ...view,
          camera: {
            ...view.camera,
            focalPx: [...view.camera.focalPx],
            principalPointPx: [...view.camera.principalPointPx],
          },
        }),
      ),
    };
    admitted = true;
    const checkpoint: (
      phase: string,
      completed: number,
      total: number,
    ) => void = (phase: string, completed: number, total: number): void => {
      if (cancelled()) throw cancellation;
      callback = true;
      try {
        observer?.(phase, completed, total);
      } catch (error: unknown) {
        const failure: Error = new Error(
          error instanceof Error ? error.message : String(error),
        );
        failure.name = "RecoverySceneObserverFailure";
        throw failure;
      }
      callback = false;
      if (cancelled()) throw cancellation;
    };
    const observed: ReturnType<IAutoMovieRecoveryCameraSetObservationOperation.Operation> =
      observeRecoveryCameraSet(
        stable.views,
        stable.seedPolicy,
        stable.seedBudget,
        stable.budget.maxDescriptorPairs,
        (phase: string, completed: number, total: number): void =>
          checkpoint(`scene-${phase}`, completed, total),
      );
    const value: IAutoMovieRecoveryCameraSceneEstimate =
      createRecoveryCameraScene(
        stable,
        observed.features,
        charts,
        observed.pairs,
        observed.descriptorComparisons,
        checkpoint,
      );
    checkpoint("camera-scene-ready", 1, 1);
    return {
      operator,
      status: "partial",
      value,
      diagnostics: [
        `Conditional sparse component: ${value.registeredViews.length}/${stable.views.length} images; ${value.stopReason}`,
        "Supplied intrinsics and rigidity remain assertions; physical scale, material/landmark truth, unseen geometry and an editable surface remain unobserved",
        "Global conflicts are withheld before seed geometry; failed camera/point/observation transactions preserve the last qualified checkpoint",
      ],
    };
  } catch (error: unknown) {
    if (error === cancellation && !callback)
      return {
        operator,
        status: "cancelled",
        diagnostics: [cancellation.message],
      };
    return {
      operator,
      status: admitted || callback ? "failed" : "refused",
      diagnostics: [error instanceof Error ? error.message : String(error)],
    };
  }
}
