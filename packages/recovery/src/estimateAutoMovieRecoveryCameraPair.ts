import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraPairEstimate } from "./IAutoMovieRecoveryCameraPairEstimate";
import type { IAutoMovieRecoveryOperation } from "./IAutoMovieRecoveryOperation";
import { admitRecoveryCameraPair } from "./internal/admitRecoveryCameraPair";
import { createRecoveryCameraEstimate } from "./internal/createRecoveryCameraEstimate";
import { extractRecoveryImageFeatures } from "./internal/extractRecoveryImageFeatures";
import { matchRecoveryImageFeatures } from "./internal/matchRecoveryImageFeatures";

/**
 * Observe automatic image correspondences and estimate a calibrated relative pose.
 * Two unchanged RGB charts, corrected supplied intrinsics and a static scene are
 * caller premises. Integer coordinates denote pixel centres. Harris/ANMS points,
 * oriented gradient matching and calibrated consensus require no manual point,
 * mask, trained model or reference geometry. Appearance repetition, occlusion and
 * large viewpoint changes may leave no observable camera and must be refused.
 *
 * A completed operation is partial: the artifact may accept a conditional
 * relative pose or record every camera refusal, and neither outcome recovers a
 * surface or physical scale. Cancelled, invalid and failed computations publish
 * no artifact. Cancellation is cooperative at progress checkpoints; a blocked
 * synchronous event loop cannot receive a later abort. Caller callbacks may
 * request cancellation but cannot change the admitted policy or provenance.
 *
 * @evidence contracts/common.md#principled-implementation Closed preallocation admission and representable supplied charts establish a conditional calibrated two-view problem. Automatic local appearance proposes material correspondences; original-design robust fitting, analytic five-coordinate refinement and independent pixel/depth/parallax/planar gates qualify only a relative unit-baseline camera, never hidden shape or correspondence truth.
 * @evidence contracts/common.md#clear-and-simple-design This resident public owner sequences acquisition-free observation, matching and numerical qualification. Interface owns input metadata, recovery owns camera policy/algorithms, engine owns reusable algebra, and Node/display hosts remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No file lookup, expected camera, hand correspondence, silhouette-point identity, mesh fallback, budget escalation or hidden completion supplies a pose. Invalid admission, callback failure and cancellation have distinct no-value terminal effects, while a completed camera refusal retains only its measured evidence.
 * @evidence contracts/common.md#meaningful-documentation States chart convention, calibration/rigidity assertions, matching limitations, partial evidence versus camera acceptance, unknown scale, synchronous cancellation and borrowed RGB immutability.
 * @evidence contracts/performance.md#efficient-algorithms For P pixels, C candidates, F/G selected features and T proposals, detection costs O(P+C^2), exact matching O(128FG), and bounded original-design consensus/refinement retain their documented costs. Explicit pixel/candidate/pair/trial/sweep/iteration limits precede their allocations or traversals.
 * @evidence contracts/performance.md#reuse-equivalent-work Each image is observed once, its gradients serve detection/descriptors, each descriptor pair serves both neighbour directions, and fixed supplied charts/matches serve all numerical gates. Policy, provenance and camera metadata are snapshotted before callbacks; mutable RGB remains borrowed under the caller's unchanged-buffer contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous owner holds bounded pixel pyramids, descriptors and proposal scratch until completion or throw. Only owned JSON evidence transfers to the caller; no RGB, descriptor, callback, abort listener, worker, file handle or global cache is retained on any terminal path.
 */
export function estimateAutoMovieRecoveryCameraPair(
  input: IAutoMovieRecoveryCameraPairInput,
  options: Pick<IAutoMovieRecoveryOperation.Options, "signal" | "onProgress"> = {},
): IAutoMovieRecoveryOperation.Result<IAutoMovieRecoveryCameraPairEstimate> {
  const schema: IAutoMovieRecoveryOperation.Result<unknown>["schema"] = "automovie-recovery-operation-v1";
  const operator: IAutoMovieRecoveryOperation.Result<unknown>["operator"] = "calibrated-image-pair-v1";
  let admitted: boolean = false, callback: boolean = false;
  const cancellation: Error = new Error("Camera observation cancelled at a cooperative checkpoint");
  try {
    if (!options || typeof options !== "object" || Array.isArray(options) ||
      Reflect.ownKeys(options).some((key: string | symbol): boolean => key !== "signal" && key !== "onProgress") ||
      (options.onProgress !== undefined && typeof options.onProgress !== "function") ||
      (options.signal !== undefined && (options.signal === null || typeof options.signal !== "object" ||
        Array.isArray(options.signal) || typeof options.signal.aborted !== "boolean")))
      throw new Error("invalid-camera-options: only signal and synchronous progress observer are supported");
    const signal: AbortSignal | undefined = options.signal;
    const observer: typeof options.onProgress = options.onProgress;
    if (signal?.aborted) throw cancellation;
    const prepared: ReturnType<typeof admitRecoveryCameraPair> = admitRecoveryCameraPair(input);
    const stable: IAutoMovieRecoveryCameraPairInput = { ...input, policy: { ...input.policy }, budget: { ...input.budget },
      views: input.views.map((view: typeof input.views[number]): typeof view => ({ ...view, camera: {
        ...view.camera, focalPx: [...view.camera.focalPx], principalPointPx: [...view.camera.principalPointPx],
      } })),
    };
    admitted = true;
    const checkpoint: (phase: string, completed: number, total: number) => void = (
      phase: string, completed: number, total: number,
    ): void => {
      if (signal?.aborted) throw cancellation;
      callback = true; observer?.(phase, completed, total); callback = false;
      if (signal?.aborted) throw cancellation;
    };
    const features: ReturnType<typeof extractRecoveryImageFeatures>[] = [];
    checkpoint("image-features", 0, 2);
    for (const view of stable.views) {
      features.push(extractRecoveryImageFeatures(view, stable.policy, stable.budget));
      checkpoint("image-features", features.length, 2);
    }
    checkpoint("descriptor-matching", 0, 1);
    const matches: ReturnType<typeof matchRecoveryImageFeatures> = matchRecoveryImageFeatures(
      features[0]!.points, features[1]!.points, stable.policy.descriptorDistanceRatio, stable.budget.maxDescriptorPairs);
    checkpoint("descriptor-matching", 1, 1);
    const value: IAutoMovieRecoveryCameraPairEstimate = createRecoveryCameraEstimate(stable, features, matches, prepared.charts, checkpoint);
    checkpoint("observations-ready", 1, 1);
    return { schema, operator, status: "partial", value, diagnostics: [
      value.status === "accepted-relative-pose" ? "Conditional calibrated relative pose accepted" : `Camera refused: ${value.refusalReasons.join(", ")}`,
      "Supplied intrinsics and scene rigidity are assertions; metric scale, unseen geometry and a recovered surface remain unobserved",
      "Deterministic sampling targets and local fit residuals do not establish physical correspondence truth or estimated covariance",
    ] };
  } catch (error: unknown) {
    if (error === cancellation && !callback)
      return { schema, operator, status: "cancelled", diagnostics: [cancellation.message] };
    return { schema, operator, status: admitted || callback ? "failed" : "refused",
      diagnostics: [error instanceof Error ? error.message : String(error)] };
  }
}
