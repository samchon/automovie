import type { IAutoMovieRecoveryCameraMapPolicy } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapCurvatureBlocks } from "../structures/internal/IAutoMovieRecoveryMapCurvatureBlocks";
import type { IAutoMovieRecoveryMapLocalCurvature } from "../structures/internal/IAutoMovieRecoveryMapLocalCurvature";
import type { IAutoMovieRecoveryMapMetricScales } from "../structures/internal/IAutoMovieRecoveryMapMetricScales";
import type { IAutoMovieRecoveryMapState } from "../structures/internal/IAutoMovieRecoveryMapState";
import type { IAutoMovieRecoveryUntiltedEstimate } from "../structures/internal/IAutoMovieRecoveryUntiltedEstimate";
import { createRecoveryMapTangent } from "./createRecoveryMapTangent";
import { differentiateRecoveryMapProjection } from "./differentiateRecoveryMapProjection";
import { validateRecoveryMapMetricScales } from "./validateRecoveryMapMetricScales";

/**
 * Assemble lagged fixed-dual local curvature in original-design scaled units.
 *
 * @evidence contracts/common.md#principled-implementation Vector soft-L1 contributes J^T(I/h-ee^T/(ell^2 h^3))J+sum(e_a/h)P_a. Each original dimensionless disk adds2lambda/M^2 times J^T J+sum(e_a P_a). Local terms touch one pose and one point, preserving arrowhead structure; original delta I is added only in original D-scaled coordinates.
 * @evidence contracts/common.md#clear-and-simple-design This separately prepaid current-state geometry pass scatters one fixed-size observation record into camera/point blocks. The owner supplies an admitted fit-local dual copy and the same current weighted-GN scales.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No known optimum, E-sized fabricated dual array, Hessian-derived scaling, original-row replacement or nonlinear tolerance changes the curvature. Nonrepresentable optional arithmetic returns null; malformed owned dimensions throw.
 * @evidence contracts/common.md#meaningful-documentation Lambda stays fixed during differentiation and is zero outside its original selected IDs. The computed Hessian is a numerical local approximation, without a positive-definiteness, conditioning or exact Float derivative certificate.
 * @evidence contracts/performance.md#efficient-algorithms E fixed local charts cost O(E), with O(C^2+LC+L) initialization/scatter storage. Every operation belongs to the owner's full prepaid optional attempt; no extra actual trial, generic model or nonlinear evaluation is made.
 * @evidence contracts/performance.md#reuse-equivalent-work One ordered selected-ID cursor and one observation's projection/derivatives supply both loss and constraint terms; no cross-state geometry or observation Hessian history remains.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most C^2+3L(C+3) owned block entries coexist with one fixed9-coordinate record and shared readonly D. The caller admits simultaneous GN, optional blocks/rows and seed capacity before entry; null releases all partial blocks.
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
    !(damping >= 0) ||
    !Number.isFinite(damping)
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
      if (![h, inverse, disk, robust].every(Number.isFinite)) return null;
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
          if (!Number.isFinite(value)) return null;
          if (other < count) {
            camera[start + axis]![start + other]! += value;
            if (!Number.isFinite(camera[start + axis]![start + other]))
              return null;
          } else if (axis < count) {
            points[point]![other - count]![3 + start + axis]! += value;
            if (
              !Number.isFinite(points[point]![other - count]![3 + start + axis])
            )
              return null;
          } else {
            points[point]![axis - count]![other - count]! += value;
            if (!Number.isFinite(points[point]![axis - count]![other - count]))
              return null;
          }
        }
    }
  }
  if (row + 1 !== seed.rowCount || selected !== seed.selected.length)
    throw new Error(
      "camera-curvature: unchanged original row identity required",
    );
  return { camera, points };
}
