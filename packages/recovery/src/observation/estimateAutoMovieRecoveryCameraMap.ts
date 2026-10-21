import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";

import { admitRecoveryCameraMap } from "../internal/admitRecoveryCameraMap";
import { createRecoveryCameraMap } from "../internal/createRecoveryCameraMap";
import { observeRecoveryCameraSet } from "../internal/observeRecoveryCameraSet";
import type { IAutoMovieRecoveryCameraMapEstimate } from "../structures/image/IAutoMovieRecoveryCameraMapEstimate";
import type { IAutoMovieRecoveryOptions } from "../structures/operation/IAutoMovieRecoveryOptions";
import type { AutoMovieRecoveryOperator } from "../typings/AutoMovieRecoveryOperator";
import type { IAutoMovieRecoveryResult } from "../typings/IAutoMovieRecoveryResult";

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
 * deliver a later abort. Keep borrowed RGB bytes stable until return.
 *
 * @evidence contracts/common.md#principled-implementation Closed preallocation admission, once-per-image Harris observation and bidirectional ratio-qualified index tracks establish tentative appearance evidence. Existing complete pair qualification, pointwise triangulation, distinct existing-map resection and gauge-correct same-population joint refinement independently qualify only conditional sparse geometry.
 * @evidence contracts/common.md#clear-and-simple-design The acquisition-free resident owner sequences observation and delegates map geometry; interface owns inputs, recovery owns domain algorithms and Node owns filesystem publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source lookup, hand point, learned descriptor, filename pose prior, truth camera, metric normalization of third translation or hidden surface completion enters the operation. Invalid, cancelled, callback-failed and unexpected numerical operations publish no value.
 * @evidence contracts/common.md#meaningful-documentation States explicit seed ordering, supported three-view loop, calibrated rigidity premises, borrowed pixels, cooperative checkpoints, partial geometry and every terminal effect.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded image detections cost O(P+C^2); six streaming descriptor comparisons cost O(128*sum(2FiFj)) with aggregate work checked before traversal. Bounded seed consensus, resection and fixed-width sparse joint solves retain their independently declared limits.
 * @evidence contracts/performance.md#reuse-equivalent-work Each image is observed once and shared over every pair. Fixed features/charts/matches serve all geometry; metadata and numerical policy are snapshotted before observers can mutate caller records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded pyramids, descriptors, matches and numerical scratch expire synchronously on every terminal path. Only owned JSON sparse evidence transfers; no RGB, callback, abort listener, process, file or global cache remains.
 */
export function estimateAutoMovieRecoveryCameraMap(
  input: IAutoMovieRecoveryCameraMapInput,
  options: Pick<IAutoMovieRecoveryOptions, "signal" | "onProgress"> = {},
): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraMapEstimate> {
  const operator: AutoMovieRecoveryOperator = "calibrated-three-camera-map-v1";
  const cancellation: Error = new Error(
    "Camera map cancelled at a cooperative checkpoint",
  );
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
        "invalid-camera-map-options: only signal and synchronous progress observer supported",
      );
    const signal: AbortSignal | undefined = options.signal,
      observer: typeof options.onProgress = options.onProgress;
    if (signal?.aborted) throw cancellation;
    const charts: ReturnType<typeof admitRecoveryCameraMap> =
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
      if (signal?.aborted) throw cancellation;
      callback = true;
      observer?.(phase, completed, total);
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
