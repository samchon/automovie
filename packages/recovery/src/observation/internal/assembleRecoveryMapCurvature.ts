import type {
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapCurvatureBlocks,
  IAutoMovieRecoveryMapLocalCurvature,
  IAutoMovieRecoveryMapMetricScales,
  IAutoMovieRecoveryMapState,
  IAutoMovieRecoveryUntiltedEstimate,
} from "@automovie/interface";

import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { differentiateRecoveryMapProjection } from "./differentiateRecoveryMapProjection";
import { validateRecoveryMapMetricScales } from "./validateRecoveryMapMetricScales";

/*
 * Assemble lagged fixed-dual local curvature in original-design scaled units.
 */
export function assembleRecoveryMapCurvature(
  state: IAutoMovieRecoveryMapState,
  intrinsics: readonly (readonly number[])[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  seed: IAutoMovieRecoveryUntiltedEstimate,
  scales: IAutoMovieRecoveryMapMetricScales,
  damping: number,
): IAutoMovieRecoveryMapCurvatureBlocks | null {
  const cameraWidth: number = scales.cameraScales.length;
  if (
    cameraWidth !== 6 * state.poses.length - 7 ||
    scales.pointScales.length !== state.landmarks.length ||
    seed.width !== cameraWidth + 3 * state.landmarks.length ||
    !(damping >= 0)
  )
    throw new Error(
      "camera-curvature: matching current scales and original population required",
    );
  validateRecoveryMapMetricScales(scales.cameraScales, scales.pointScales);
  const camera: number[][] = Array.from(
    { length: cameraWidth },
    (_: unknown, axis: number): number[] =>
      Array.from(
        { length: cameraWidth },
        (_: unknown, other: number): number => (axis === other ? damping : 0),
      ),
  );
  const points: number[][][] = Array.from(
    { length: state.landmarks.length },
    (): number[][] =>
      Array.from({ length: 3 }, (_: unknown, axis: number): number[] =>
        Array.from(
          { length: cameraWidth + 3 },
          (_: unknown, other: number): number => (axis === other ? damping : 0),
        ),
      ),
  );
  const tangent: [number, number, number][] = createRecoveryMapTangent(
    state.poses[1]!.translation,
  );
  let row: number = 0,
    selected: number = 0;
  for (let point: number = 0; point < state.landmarks.length; point++) {
    const landmark: (typeof state.landmarks)[number] = state.landmarks[point]!;
    for (const observation of landmark.observations) {
      row++;
      const lambda: number =
        seed.selected[selected] === row ? seed.multipliers[selected++]! : 0;
      const view: number = observation.viewIndex;
      const local: IAutoMovieRecoveryMapLocalCurvature | null =
        differentiateRecoveryMapProjection(
          state.poses[view]!,
          landmark.point,
          intrinsics[view]!,
          view === 0 ? [] : view === 1 ? tangent : null,
        );
      if (local === null) return null;
      const count: number = local.jacobian[0]!.length - 3;
      const start: number = view === 1 ? 0 : 5 + 6 * (view - 2);
      const residual: number[] = [
        local.pixel[0] - observation.pixel[0],
        local.pixel[1] - observation.pixel[1],
      ];
      const h: number = Math.hypot(
        1,
        Math.hypot(...residual) / policy.lossScalePx,
      );
      const inverse: number = 1 / h;
      const disk: number =
        (2 * lambda) /
        policy.maximumReprojectionErrorPx /
        policy.maximumReprojectionErrorPx;
      const robust: number =
        (inverse / policy.lossScalePx / policy.lossScalePx) * inverse * inverse;
      if (h === Infinity || disk === Infinity || robust === Infinity)
        return null;
      for (let axis: number = 0; axis < count + 3; axis++)
        for (let other: number = axis; other < count + 3; other++) {
          let value: number = 0,
            firstResidual: number = 0,
            secondResidual: number = 0;
          for (let pixelAxis: number = 0; pixelAxis < 2; pixelAxis++) {
            const first: number = local.jacobian[pixelAxis]![axis]!;
            const second: number = local.jacobian[pixelAxis]![other]!;
            value +=
              (inverse + disk) * first * second +
              (inverse + disk) *
                residual[pixelAxis]! *
                local.hessians[pixelAxis]![axis]![other]!;
            firstResidual += residual[pixelAxis]! * first;
            secondResidual += residual[pixelAxis]! * second;
          }
          value -= robust * firstResidual * secondResidual;
          const firstScale: number =
            axis < count
              ? scales.cameraScales[start + axis]!
              : scales.pointScales[point]![axis - count]!;
          const secondScale: number =
            other < count
              ? scales.cameraScales[start + other]!
              : scales.pointScales[point]![other - count]!;
          value = value / firstScale / secondScale;
          if (value === Infinity || value === -Infinity) return null;
          let total: number;
          if (other < count)
            total = camera[start + axis]![start + other]! += value;
          else if (axis < count)
            total = points[point]![other - count]![3 + start + axis]! += value;
          else total = points[point]![axis - count]![other - count]! += value;
          if (total === Infinity || total === -Infinity) return null;
        }
    }
  }
  if (row + 1 !== seed.rowCount || selected !== seed.selected.length)
    throw new Error(
      "camera-curvature: unchanged original row identity required",
    );
  return { camera, points };
}
