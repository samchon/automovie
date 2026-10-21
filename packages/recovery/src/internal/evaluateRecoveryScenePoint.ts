import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import type { IAutoMovieRecoveryCameraMapPolicy } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryScenePointEvaluation } from "../structures/internal/IAutoMovieRecoveryScenePointEvaluation";
import type { IAutoMovieRecoverySceneRay } from "../structures/internal/IAutoMovieRecoverySceneRay";
import type { createRecoveryCameraChart } from "./createRecoveryCameraChart";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";

/**
 * Qualify one point against its actual retained registered measurements.
 * At least one observed camera pair must supply an acute ray angle above the
 * point threshold. A point need not be visible in either original seed image.
 *
 * @evidence contracts/common.md#principled-implementation Every retained measurement independently supplies positive depth and Euclidean pixel residual. World-space centre-to-point directions determine the strongest actual acute supporting pair, whose indices accompany the diagnostic.
 * @evidence contracts/common.md#clear-and-simple-design The same point gate serves triangulation and post-joint qualification, separating observed support from seed-camera membership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unregistered pose, invented missing observation, depth clamp, seed ray for an unseen point or low-error-only depth inference supplies acceptance.
 * @evidence contracts/common.md#meaningful-documentation States all-observation gates, strongest acute supporting pair and null metrics. Optional synchronous observation receives each registered positive-depth projection's raw residual norm before final qualification; it can be nonfinite for invalid measurements, is not an acceptance notification, and must not mutate borrowed inputs. Observer errors propagate unchanged.
 * @evidence contracts/performance.md#efficient-algorithms A track with k observations needs O(k) projections and O(k^2) angle comparisons, plus at most k observer calls whose work the caller admits and charges. The camera owner's O(1) scalar reduction per observation is included in its existing evaluation charge before traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each complete projection supplies depth and one residual norm to the gate and optional numeric reduction, avoiding a duplicate projection or depth multiplication. Each centre-to-point unit vector is computed once for every pair comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar diagnostics and two view indices return. This evaluator retains neither observer nor projection history after return; any observer-owned retention belongs to its caller. The camera reduction retains two local scalars and discards them on later refusal. Local directions expire without input mutation or external resources.
 */
export function evaluateRecoveryScenePoint(
  point: readonly [number, number, number],
  observations: readonly IAutoMovieRecoveryMapObservation[],
  poses: readonly (IAutoMovieRecoveryMapPose | null)[],
  charts: readonly Pick<
    ReturnType<typeof createRecoveryCameraChart>,
    "matrix"
  >[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  observe?: (norm: number) => void,
): IAutoMovieRecoveryScenePointEvaluation {
  const reasons: Set<string> = new Set();
  const directions: IAutoMovieRecoverySceneRay[] = [];
  let maximumReprojectionPx: number = 0;
  let minimumDepth: number = Infinity;
  if (
    observations.length < 2 ||
    new Set(
      observations.map(
        (observation: IAutoMovieRecoveryMapObservation): number =>
          observation.viewIndex,
      ),
    ).size !== observations.length
  )
    reasons.add("insufficient-distinct-observations");
  for (const observation of observations) {
    const pose: IAutoMovieRecoveryMapPose | null | undefined =
      poses[observation.viewIndex];
    const chart: (typeof charts)[number] | undefined =
      charts[observation.viewIndex];
    if (!pose || !chart) {
      reasons.add("unregistered-observation");
      continue;
    }
    const projected: ReturnType<typeof projectRecoveryMapPoint> =
      projectRecoveryMapPoint(pose, point, chart.matrix);
    if (projected === null) {
      reasons.add("nonpositive-depth");
      continue;
    }
    minimumDepth = Math.min(minimumDepth, projected.depth);
    const normPx: number = Math.hypot(
      projected.pixel[0] - observation.pixel[0],
      projected.pixel[1] - observation.pixel[1],
    );
    maximumReprojectionPx = Math.max(maximumReprojectionPx, normPx);
    observe?.(normPx);
    const centre: [number, number, number] = AutoMovieMatrix3.apply(
      AutoMovieMatrix3.transpose(pose.rotation),
      pose.translation.map((value: number): number => -value),
    );
    const ray: number[] = point.map(
      (value: number, axis: number): number => value - centre[axis]!,
    );
    const norm: number = Math.hypot(...ray);
    if (!(norm > 0) || !Number.isFinite(norm)) {
      reasons.add("unresolved-ray");
      continue;
    }
    directions.push({
      view: observation.viewIndex,
      unit: ray.map((value: number): number => value / norm),
    });
  }
  let angle: number = -Infinity;
  let supportingViews: [number, number] | null = null;
  for (let first: number = 0; first < directions.length; first++)
    for (let second: number = first + 1; second < directions.length; second++) {
      const a: number[] = directions[first]!.unit,
        b: number[] = directions[second]!.unit;
      const cross: number = Math.hypot(
        a[1]! * b[2]! - a[2]! * b[1]!,
        a[2]! * b[0]! - a[0]! * b[2]!,
        a[0]! * b[1]! - a[1]! * b[0]!,
      );
      const acute: number =
        (Math.atan2(
          cross,
          Math.abs(
            a.reduce(
              (sum: number, value: number, axis: number): number =>
                sum + value * b[axis]!,
              0,
            ),
          ),
        ) *
          180) /
        Math.PI;
      if (acute > angle) {
        angle = acute;
        supportingViews = [directions[first]!.view, directions[second]!.view];
      }
    }
  if (!(maximumReprojectionPx <= policy.maximumReprojectionErrorPx))
    reasons.add("reprojection-error");
  if (!(angle >= policy.minimumPointParallaxDegrees))
    reasons.add("low-point-parallax");
  return {
    accepted: reasons.size === 0,
    reasons: [...reasons],
    maximumReprojectionPx:
      Number.isFinite(maximumReprojectionPx) &&
      !reasons.has("nonpositive-depth") &&
      !reasons.has("unregistered-observation")
        ? maximumReprojectionPx
        : null,
    minimumDepth: Number.isFinite(minimumDepth) ? minimumDepth : null,
    supportingViews,
    acuteParallaxDegrees: Number.isFinite(angle) ? angle : null,
  };
}
