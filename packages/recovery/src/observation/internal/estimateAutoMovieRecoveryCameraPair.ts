import type {
  AutoMovieRecoveryOperator,
  IAutoMovieRecoveryCameraPairAdmissionOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryImageFeaturesMatchingOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { admitRecoveryCameraPair } from "./admitRecoveryCameraPair";
import { createRecoveryCameraEstimate } from "./createRecoveryCameraEstimate";
import { extractRecoveryImageFeatures } from "../../internal/extractRecoveryImageFeatures";
import { matchRecoveryImageFeatures } from "./matchRecoveryImageFeatures";

/**
 * Observe automatic image correspondences and estimate a calibrated relative
 * pose. Two unchanged RGB charts, corrected supplied intrinsics and a static
 * scene are caller premises. Integer coordinates denote pixel centres.
 * Harris/ANMS points, oriented gradient matching and calibrated consensus
 * require no manual point, mask, trained model or reference geometry.
 * Appearance repetition, occlusion and large viewpoint changes may leave no
 * observable camera and must be refused.
 *
 * A completed operation is partial: the artifact may accept a conditional
 * relative pose or record every camera refusal, and neither outcome recovers a
 * surface or physical scale. Cancelled, invalid and failed computations publish
 * no artifact. Cancellation is cooperative at progress checkpoints; a blocked
 * synchronous event loop cannot receive a later event-loop cancellation. Caller
 * callbacks may request cancellation but cannot change the admitted policy or
 * provenance.
 */
export function estimateAutoMovieRecoveryCameraPair(
  input: IAutoMovieRecoveryCameraPairInput,
  options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraPairEstimate> {
  const operator: AutoMovieRecoveryOperator = "calibrated-image-pair-v1";
  let admitted: boolean = false,
    callback: boolean = false;
  const cancellation: Error = new Error(
    "Camera observation cancelled at a cooperative checkpoint",
  );
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
    const prepared: ReturnType<IAutoMovieRecoveryCameraPairAdmissionOperation.Operation> =
      admitRecoveryCameraPair(input);
    const stable: IAutoMovieRecoveryCameraPairInput = {
      ...input,
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
      observer?.(phase, completed, total);
      callback = false;
      if (cancelled()) throw cancellation;
    };
    const features: ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[] =
      [];
    checkpoint("image-features", 0, 2);
    for (const view of stable.views) {
      features.push(
        extractRecoveryImageFeatures(view, stable.policy, stable.budget),
      );
      checkpoint("image-features", features.length, 2);
    }
    checkpoint("descriptor-matching", 0, 1);
    const matches: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation> =
      matchRecoveryImageFeatures(
        features[0]!.points,
        features[1]!.points,
        stable.policy.descriptorDistanceRatio,
        stable.budget.maxDescriptorPairs,
      );
    checkpoint("descriptor-matching", 1, 1);
    const value: IAutoMovieRecoveryCameraPairEstimate =
      createRecoveryCameraEstimate(
        stable,
        features,
        matches,
        prepared.charts,
        checkpoint,
      );
    checkpoint("observations-ready", 1, 1);
    return {
      operator,
      status: "partial",
      value,
      diagnostics: [
        value.status === "accepted-relative-pose"
          ? "Conditional calibrated relative pose accepted"
          : `Camera refused: ${value.refusalReasons.join(", ")}`,
        "Supplied intrinsics and scene rigidity are assertions; metric scale, unseen geometry and a recovered surface remain unobserved",
        "Deterministic sampling targets and local fit residuals do not establish physical correspondence truth or estimated covariance",
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
