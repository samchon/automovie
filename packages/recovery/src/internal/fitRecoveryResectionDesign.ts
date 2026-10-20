import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";
import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryResectionDesign } from "../structures/internal/IAutoMovieRecoveryResectionDesign";
import type { IAutoMovieRecoveryResectionDesignTrace } from "../structures/internal/IAutoMovieRecoveryResectionDesignTrace";

/**
 * Initialize a calibrated nonplanar resection from at least six 3D/pixel pairs.
 * Isotropic centroid/RMS normalization in both charts conditions the original
 * 2N-by-12 DLT, then both transforms are undone before proper-rotation projection.
 * This nonminimal initializer does not support planar or rank-unresolved designs.
 * The DLT/nonplanar distinction is described by OpenCV's official solvePnP guide:
 * https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html
 * An optional fresh caller-owned trace receives computed stage evidence only;
 * diagnostic projective or pre-gate rigid coefficients never imply acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Cross-product ray equations give a homogeneous projective design without forming its normal matrix. Independent 3D span, eleven resolved design directions, null separation and scaled proper-rotation discrepancy qualify the initializer before any pixel scoring.
 * @evidence contracts/common.md#clear-and-simple-design This recovery owner only initializes a world-to-camera pose; robust proposal selection and local pixel refinement remain separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No planar fallback, truth pose, singular-value floor, normalized translation or uncalibrated projective camera is exposed as a rigid pose. Failed rank or representability throws a declared resection refusal.
 * @evidence contracts/common.md#meaningful-documentation States isotropic normalization and reversal, original-design rank/null gates, row-major world-to-camera output, nonplanar support boundary and unknown metric scale.
 * @evidence contracts/performance.md#efficient-algorithms N pairs use bounded 12-column original-design SVD O(S*N*12^2), plus three-column span and rotation decompositions; explicit linear-entry limits precede designs.
 * @evidence contracts/performance.md#reuse-equivalent-work Centered points and calibrated rays serve normalization and the same design; one rotation-block factorization supplies scale, proper projection and discrepancy.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One owned pose and scalar diagnostics return; an optional fresh caller-owned trace retains at most twelve projective coefficients, one fixed-size projected pose and stage scalars. O(N) normalized coordinates and factors expire without image, cache or external resource; no trace history is retained here.
 */
export function fitRecoveryResectionDesign(
  points: readonly (readonly [number, number, number])[],
  pixels: readonly (readonly [number, number])[],
  inverse: readonly number[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
  trace?: IAutoMovieRecoveryResectionDesignTrace,
): IAutoMovieRecoveryResectionDesign {
  if (trace) trace.stage = "admission";
  if (
    points.length < 6 ||
    points.length !== pixels.length ||
    24 * points.length > budget.maxLinearEntries ||
    budget.maxLinearEntries < 144
  )
    throw new Error(
      "camera-resection: paired nonplanar points and admitted linear entries required",
    );
  const options: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: budget.maxLinearEntries,
    maxSweeps: budget.maxSingularSweeps,
    orthogonalityTolerance: 1e-12,
  };
  if (trace) trace.stage = "normalization";
  const centroid: number[] = [0, 0, 0];
  const rays: [number, number][] = pixels.map(
    (pixel: readonly [number, number]): [number, number] => {
      const ray: [number, number, number] = AutoMovieMatrix3.apply(inverse, [
        ...pixel,
        1,
      ]);
      return [ray[0] / ray[2], ray[1] / ray[2]];
    },
  );
  for (const point of points)
    for (let at: number = 0; at < 3; at++)
      centroid[at] += point[at]! / points.length;
  const centre2: number[] = [0, 0];
  for (const ray of rays)
    for (let at: number = 0; at < 2; at++)
      centre2[at] += ray[at]! / rays.length;
  const centred: number[][] = points.map(
    (point: readonly [number, number, number]): number[] =>
      point.map((value: number, at: number): number => value - centroid[at]!),
  );
  const radius3: number = Math.sqrt(
    centred.reduce(
      (sum: number, point: number[]): number =>
        sum +
        point.reduce(
          (q: number, value: number): number => q + value * value,
          0,
        ),
      0,
    ) / points.length,
  );
  const radius2: number = Math.sqrt(
    rays.reduce(
      (sum: number, point: [number, number]): number =>
        sum + (point[0] - centre2[0]!) ** 2 + (point[1] - centre2[1]!) ** 2,
      0,
    ) / points.length,
  );
  if (
    !(radius3 > 0 && radius2 > 0) ||
    ![...centroid, ...centre2, radius3, radius2].every(Number.isFinite)
  )
    throw new Error("camera-resection: unresolved normalization");
  const scale3: number = Math.sqrt(3) / radius3,
    scale2: number = Math.SQRT2 / radius2;
  const normalized: number[][] = centred.map((point: number[]): number[] =>
    point.map((value: number): number => value * scale3),
  );
  if (trace) trace.stage = "span-factorization";
  const span: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(normalized, options);
  if (trace) {
    trace.stage = "span";
    trace.spanRatio = span.singularValues[2]! / span.singularValues[0]!;
  }
  if (
    !(
      span.singularValues[2]! / span.singularValues[0]! >=
      policy.minimumDesignSingularRatio
    )
  )
    throw new Error(
      "camera-resection: nonplanar three-dimensional span required",
    );
  const rows: number[][] = [];
  for (let at: number = 0; at < points.length; at++) {
    const x: number[] = [...normalized[at]!, 1];
    const u: number = (rays[at]![0] - centre2[0]!) * scale2,
      v: number = (rays[at]![1] - centre2[1]!) * scale2;
    rows.push([
      ...x,
      0,
      0,
      0,
      0,
      ...x.map((value: number): number => -u * value),
    ]);
    rows.push([
      0,
      0,
      0,
      0,
      ...x,
      ...x.map((value: number): number => -v * value),
    ]);
  }
  if (trace) trace.stage = "design-factorization";
  const factors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(rows, options);
  const designRatio: number =
      factors.singularValues[10]! / factors.singularValues[0]!,
    nullRatio: number =
      factors.singularValues[11]! / factors.singularValues[10]!;
  if (trace) {
    trace.stage = "design-rank";
    trace.designRatio = designRatio;
    trace.nullRatio = nullRatio;
  }
  if (
    !(designRatio >= policy.minimumDesignSingularRatio) ||
    !(nullRatio <= policy.maximumDltNullRatio)
  )
    throw new Error("camera-resection: unresolved projective design");
  const p: number[] = factors.rightColumns[11]!.slice();
  // P = T2^-1 * Pnormalized * T3. T3 is isotropic, retaining a rigid metric chart.
  const unimage: number[][] = [
    [1 / scale2, 0, centre2[0]!],
    [0, 1 / scale2, centre2[1]!],
    [0, 0, 1],
  ];
  const denormalized: number[] = [];
  for (let row: number = 0; row < 3; row++) {
    const value: number[] = [0, 0, 0, 0];
    for (let column: number = 0; column < 4; column++)
      for (let inner: number = 0; inner < 3; inner++)
        value[column] += unimage[row]![inner]! * p[4 * inner + column]!;
    denormalized.push(
      value[0]! * scale3,
      value[1]! * scale3,
      value[2]! * scale3,
      value[3]! -
        scale3 *
          value
            .slice(0, 3)
            .reduce(
              (sum: number, term: number, at: number): number =>
                sum + term * centroid[at]!,
              0,
            ),
    );
  }
  if (trace) {
    trace.stage = "rotation-block";
    trace.projective = denormalized.slice();
  }
  let block: number[] = [0, 1, 2, 4, 5, 6, 8, 9, 10].map(
    (at: number): number => denormalized[at]!,
  );
  const determinant: number =
    block[0]! * (block[4]! * block[8]! - block[5]! * block[7]!) -
    block[1]! * (block[3]! * block[8]! - block[5]! * block[6]!) +
    block[2]! * (block[3]! * block[7]! - block[4]! * block[6]!);
  if (determinant === 0 || !Number.isFinite(determinant))
    throw new Error("camera-resection: unresolved rotation block");
  const sign: number = determinant < 0 ? -1 : 1;
  block = block.map((value: number): number => sign * value);
  if (trace) {
    trace.stage = "rotation-factorization";
    trace.projectiveSign = sign;
  }
  const rotationFactors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(
      [block.slice(0, 3), block.slice(3, 6), block.slice(6, 9)],
      options,
    );
  if (trace) trace.stage = "rotation-rank";
  if (rotationFactors.numericalRank !== 3)
    throw new Error("camera-resection: unresolved rotation projection");
  const rotation: number[] = new Array<number>(9).fill(0);
  for (let row: number = 0; row < 3; row++)
    for (let column: number = 0; column < 3; column++)
      for (let inner: number = 0; inner < 3; inner++)
        rotation[3 * row + column] +=
          rotationFactors.leftColumns[inner]![row]! *
          rotationFactors.rightColumns[inner]![column]!;
  const scale: number = rotationFactors.singularValues.reduce(
    (sum: number, value: number): number => sum + value / 3,
    0,
  );
  const projectionError: number =
    Math.hypot(
      ...block.map(
        (value: number, at: number): number => value - scale * rotation[at]!,
      ),
    ) / Math.hypot(...block);
  if (trace) {
    trace.stage = "projection";
    trace.projectionError = projectionError;
    const diagnosticTranslation: [number, number, number] = [3, 7, 11].map(
      (at: number): number => (sign * denormalized[at]!) / scale,
    ) as [number, number, number];
    if ([...rotation, ...diagnosticTranslation].every(Number.isFinite))
      trace.projectedPose = {
        rotation: rotation.slice(),
        translation: diagnosticTranslation,
      };
  }
  if (
    !(scale > 0) ||
    !(projectionError <= policy.maximumRotationProjectionError)
  )
    throw new Error("camera-resection: nonrigid projective rotation block");
  const translation: [number, number, number] = [3, 7, 11].map(
    (at: number): number => (sign * denormalized[at]!) / scale,
  ) as [number, number, number];
  if (trace) trace.stage = "pose";
  if (![...rotation, ...translation].every(Number.isFinite))
    throw new Error("camera-resection: nonrepresentable pose");
  if (trace) trace.stage = "complete";
  return {
    pose: { rotation, translation },
    designRatio,
    nullRatio,
    projectionError,
  };
}
