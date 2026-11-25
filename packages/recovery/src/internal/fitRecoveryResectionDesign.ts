import {
  AutoMovieMatrix3,
  decomposeAutoMovieSingularMatrix,
} from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryResectionDesign,
  IAutoMovieRecoveryResectionDesignTrace,
} from "@automovie/interface";

/**
 * Initialize a calibrated nonplanar resection from at least six 3D/pixel pairs.
 * Isotropic centroid/RMS normalization in both charts conditions the original
 * 2N-by-12 DLT. The proper rotation is projected from its calibrated block,
 * then that same rotation reverses world centering in the translation. This
 * preserves origin/unit covariance even when the noisy block is not rigid. This
 * nonminimal initializer does not support planar or rank-unresolved designs.
 * The DLT/nonplanar distinction is described by OpenCV's official solvePnP
 * guide: https://docs.opencv.org/4.x/d5/d1f/calib3d_solvePnP.html An optional
 * fresh caller-owned trace receives computed stage evidence only; diagnostic
 * projective or pre-gate rigid coefficients never imply acceptance.
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
  if (!(radius3 > 0 && radius2 > 0))
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
  const centeredTranslation: number[] = [];
  for (let row: number = 0; row < 3; row++) {
    const value: number[] = [0, 0, 0, 0];
    for (let column: number = 0; column < 4; column++)
      for (let inner: number = 0; inner < 3; inner++)
        value[column] += unimage[row]![inner]! * p[4 * inner + column]!;
    centeredTranslation.push(value[3]!);
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
  if (determinant === 0)
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
  // In the centered chart, C/s is the camera coordinate of the world centroid.
  // After projecting A to sR, undo centering with R: t=C/s-R*c. Using the raw
  // projective A here would shift t by -(A/s)*offset rather than -R*offset when
  // the same noisy observations are expressed in another world-origin chart.
  const translationRow = (row: 0 | 1 | 2): number =>
    (sign * centeredTranslation[row]!) / scale -
    rotation
      .slice(3 * row, 3 * row + 3)
      .reduce(
        (sum: number, entry: number, column: number): number =>
          sum + entry * centroid[column]!,
        0,
      );
  const translation: [number, number, number] = [
    translationRow(0),
    translationRow(1),
    translationRow(2),
  ];
  if (trace) {
    trace.stage = "projection";
    trace.projectionError = projectionError;
    if (
      ![...rotation, ...translation].some(
        (value: number): boolean => value === Infinity || value === -Infinity,
      )
    )
      trace.projectedPose = {
        rotation: rotation.slice(),
        translation: [...translation],
      };
  }
  if (
    !(scale > 0) ||
    !(projectionError <= policy.maximumRotationProjectionError)
  )
    throw new Error("camera-resection: nonrigid projective rotation block");
  if (trace) trace.stage = "pose";
  if (trace) trace.stage = "complete";
  return {
    pose: { rotation, translation },
    designRatio,
    nullRatio,
    projectionError,
  };
}
