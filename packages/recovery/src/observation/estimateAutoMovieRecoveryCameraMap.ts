import type {
  AutoMovieRecoveryOperator,
  IAutoMovieRecoveryCameraMapAdmissionOperation,
  IAutoMovieRecoveryCameraMapEstimate,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraSetObservationOperation,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryResult,
} from "@automovie/interface";

import { admitRecoveryCameraMap } from "../internal/admitRecoveryCameraMap";
import { createRecoveryCameraMap } from "../internal/createRecoveryCameraMap";
import { observeRecoveryCameraSet } from "../internal/observeRecoveryCameraSet";

/**
 * Observe three fixed calibrated RGB images and register a sparse camera triad.
 * The first two are the explicit seed; the third is resected against their
 * independently triangulated points before joint reprojection refinement.
 * Corrected supplied intrinsics and a rigid scene remain caller assertions.
 *
 * Completion is partial: inspect the value's accepted-sparse-map, seed-only or
 * refused state. Sparse points are fitting evidence, not an editable recovered
 * surface, physical scale, covariance or proof of material correspondence.
 * Cancellation is synchronous and cooperative between bounded observation,
 * matching, proposal and complete local-fit phases. A blocked event loop cannot
 * deliver a later event-loop cancellation. Keep borrowed RGB bytes stable until
 * return.
 */
export function estimateAutoMovieRecoveryCameraMap(
  input: IAutoMovieRecoveryCameraMapInput,
  options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraMapEstimate> {
  const operator: AutoMovieRecoveryOperator = "calibrated-three-camera-map-v1";
  const cancellation: Error = new Error(
    "Camera map cancelled at a cooperative checkpoint",
  );
  let admitted: boolean = false,
    callback: boolean = false;
  try {
    const probe: typeof options.cancelled = options.cancelled,
      observer: typeof options.onProgress = options.onProgress;
    const cancelled: () => boolean = (): boolean => {
      callback = true;
      const requested: boolean = probe?.() === true;
      callback = false;
      return requested;
    };
    if (cancelled()) throw cancellation;
    const charts: ReturnType<IAutoMovieRecoveryCameraMapAdmissionOperation.Operation> =
      admitRecoveryCameraMap(input);
    const stable: IAutoMovieRecoveryCameraMapInput = {
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
      observer?.(phase, completed, total);
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
          checkpoint(`map-${phase}`, completed, total),
      );
    const value: IAutoMovieRecoveryCameraMapEstimate = createRecoveryCameraMap(
      stable,
      observed.features,
      charts,
      observed.pairs,
      observed.descriptorComparisons,
      checkpoint,
    );
    checkpoint("camera-map-ready", 1, 1);
    return {
      operator,
      status: "partial",
      value,
      diagnostics: [
        value.status === "accepted-sparse-map"
          ? "Conditional three-camera sparse map accepted"
          : `Map incomplete: ${value.refusalReasons.join(", ")}`,
        "Supplied intrinsics and rigidity remain assertions; metric scale, covariance, material correspondence truth, unseen geometry and an editable surface remain unobserved",
        "Only seed-supported tracks are triangulated in this version; conflicting and unsupported tracks remain explicit",
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
