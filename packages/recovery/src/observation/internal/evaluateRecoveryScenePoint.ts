import { AutoMovieMatrix3 } from "@automovie/engine";
import type {
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPointProjectionOperation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryScenePointEvaluationOperation,
  IAutoMovieRecoverySceneRay,
} from "@automovie/interface";

import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";

/*
 * Qualify one point against its actual retained registered measurements. At
 * least one observed camera pair must supply an acute ray angle above the point
 * threshold. A point need not be visible in either original seed image.
 */
export function evaluateRecoveryScenePoint(
  point: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[0],
  observations: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[1],
  poses: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[2],
  charts: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[4],
  observe?: Parameters<IAutoMovieRecoveryScenePointEvaluationOperation.Operation>[5],
): ReturnType<IAutoMovieRecoveryScenePointEvaluationOperation.Operation> {
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
    const projected: ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> =
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
    if (!(norm > 0)) {
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
      maximumReprojectionPx !== Infinity &&
      !reasons.has("nonpositive-depth") &&
      !reasons.has("unregistered-observation")
        ? maximumReprojectionPx
        : null,
    minimumDepth: minimumDepth !== Infinity ? minimumDepth : null,
    supportingViews,
    acuteParallaxDegrees: angle !== -Infinity ? angle : null,
  };
}
