import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface/recovery";

import { admitRecoveryCameraScene } from "../internal/admitRecoveryCameraScene";
import { createRecoveryCameraScene } from "../internal/createRecoveryCameraScene";
import { observeRecoveryCameraSet } from "../internal/observeRecoveryCameraSet";
import type { IAutoMovieRecoveryCameraSceneEstimate } from "../structures/image/IAutoMovieRecoveryCameraSceneEstimate";
import type { IAutoMovieRecoveryOptions } from "../structures/operation/IAutoMovieRecoveryOptions";
import type { AutoMovieRecoveryOperator } from "../typings/AutoMovieRecoveryOperator";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

/**
 * Estimate one bounded sparse component from fixed calibrated RGB images.
 * Views zero/one are the explicit seed. Further images are selected by existing
 * map support, registered independently, then committed with new registered-view
 * points and a complete gauge-fixed joint fit. Failed transactions preserve the
 * last accepted component and remain in its bounded attempt/work ledger.
 *
 * Completion stays partial: accepted-sparse-component does not mean all images
 * registered, metric dimensions, material truth or an editable surface. Inspect
 * null poses, coverage and stopReason. Supplied corrected pinhole K and rigidity
 * remain caller assertions. Keep borrowed RGB bytes stable until return.
 * Cancellation/progress are synchronous cooperative checkpoints; a blocked
 * event loop cannot deliver a later abort. Observer exceptions publish no value.
 *
 * @evidence contracts/common.md#principled-implementation Closed image/work admission, once-observed classical features and bidirectional global tracks precede complete seed and incremental point/camera geometry. Only whole qualified transactions update one common similarity gauge.
 * @evidence contracts/common.md#clear-and-simple-design This acquisition-free resident owner snapshots metadata and coordinates shared observations with the scene workflow; Node owns file acquisition/publication separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored correspondence, truth pose, filename trajectory, learned completion, changed threshold or source mesh supplies geometry. Invalid/cancelled/observer-failed/unexpected operations return no value.
 * @evidence contracts/common.md#meaningful-documentation States seed order, partial coverage, rollback, unknown scale, supplied premises, borrowed pixels and synchronous terminal effects.
 * @evidence contracts/performance.md#efficient-algorithms N detections and O(N^2) directed exhaustive matching are admitted by actual comparison counts. Global linkage is shared once; scene attempts, proposals, point designs and variable-width QR/SVD have aggregate and per-fit ceilings, without promising large-scene speed.
 * @evidence contracts/performance.md#reuse-equivalent-work Stable image metadata and policy are detached before callbacks; features/matches/charts serve every registration without reacquisition. Only an accepted revision changes geometric candidate support.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Image pyramids and descriptors expire synchronously with the operation; proposals/factors expire on refusal. Only detached JSON transfers, with no RGB, callback, listener, process or mutable global cache.
 */
export function estimateAutoMovieRecoveryCameraScene(
  input: IAutoMovieRecoveryCameraSceneInput,
  options: Pick<IAutoMovieRecoveryOptions, "signal" | "onProgress"> = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraSceneEstimate> {
  const operator: AutoMovieRecoveryOperator = "calibrated-camera-scene-v1";
  const cancellation: Error = new Error(
    "Camera scene cancelled at a cooperative checkpoint",
  );
  cancellation.name = "RecoverySceneCancellation";
  let admitted: boolean = false,
    callback: boolean = false;
  try {
    if (
      !options ||
      typeof options !== "object" ||
      Array.isArray(options) ||
      Reflect.ownKeys(options).some(
        (key: string | symbol): boolean =>
          key !== "signal" && key !== "onProgress",
      ) ||
      (options.onProgress !== undefined &&
        typeof options.onProgress !== "function") ||
      (options.signal !== undefined &&
        (options.signal === null ||
          typeof options.signal !== "object" ||
          Array.isArray(options.signal) ||
          typeof options.signal.aborted !== "boolean"))
    )
      throw new Error(
        "invalid-camera-scene-options: only signal and synchronous progress supported",
      );
    const signal: AbortSignal | undefined = options.signal;
    const observer: typeof options.onProgress = options.onProgress;
    if (signal?.aborted) throw cancellation;
    const charts: ReturnType<typeof admitRecoveryCameraScene> =
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
      if (signal?.aborted) throw cancellation;
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
      if (signal?.aborted) throw cancellation;
    };
    const observed: ReturnType<typeof observeRecoveryCameraSet> =
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
