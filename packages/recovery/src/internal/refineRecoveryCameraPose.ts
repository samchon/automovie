import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieRecoveryCameraPoseRefinementOperation,
  IAutoMovieRecoveryEpipolarErrorsMeasurementOperation,
  IAutoMovieRecoveryPoseModelCreationOperation,
  IAutoMovieRecoveryPoseResidualsLinearizeOperation,
} from "@automovie/interface";

import { createRecoveryPoseModel } from "./createRecoveryPoseModel";
import { linearizeRecoveryPoseResiduals } from "./linearizeRecoveryPoseResiduals";
import { measureRecoveryEpipolarErrors } from "../geometry/internal/measureRecoveryEpipolarErrors";
import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/**
 * Bounded local calibrated-pose least squares on a fixed correspondence subset.
 * Soft-L1 loss has caller-supplied pixel scale. A column-scaled original
 * Jacobian is rank-checked before a damped augmented least-squares step is
 * solved by SVD; damping cannot repair an unobservable local parameter
 * direction. Accepted steps update SO3 and the unit translation sphere.
 * Termination is local only.
 */
export function refineRecoveryCameraPose(
  initial: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[0],
  firstPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[1],
  secondPoints: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[2],
  first: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[3],
  second: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[4],
  policy: Parameters<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>[5],
): ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation> {
  if (
    firstPoints.length !== secondPoints.length ||
    firstPoints.length < 8 ||
    !(policy.lossScalePx > 0)
  )
    throw new Error(
      "camera-refinement: fixed paired subset and positive loss scale required",
    );
  let pose: { rotation: number[]; translation: [number, number, number] } = {
    rotation: initial.rotation.slice(),
    translation: [...initial.translation],
  };
  const costOf: (residuals: readonly number[]) => number = (
    residuals: readonly number[],
  ): number => {
    let sum: number = 0;
    for (const residual of residuals) {
      const absolute: number = Math.abs(residual);
      // Rationalizing sqrt(1+z^2)-1 preserves the small-residual loss.
      sum +=
        absolute *
        (absolute / (Math.hypot(1, residual / policy.lossScalePx) + 1));
    }
    return sum;
  };
  let model: ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation> =
    createRecoveryPoseModel(pose, first, second);
  let linear: ReturnType<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation> =
    linearizeRecoveryPoseResiduals(model, firstPoints, secondPoints);
  let cost: number = costOf(linear.residuals);
  const initialCost: number = cost;
  let damping: number = 1e-3;
  let iterations: number = 0,
    acceptedSteps: number = 0,
    minimumLocalDesignRatio: number = Infinity;
  let termination: ReturnType<IAutoMovieRecoveryCameraPoseRefinementOperation.Operation>["termination"] =
    "iteration-budget";
  let prepared: {
    rows: number[][];
    right: number[];
    scales: number[];
    gradient: number;
  } | null = null;
  const options: Parameters<typeof AutoMovieEngineMath.decomposeSingularMatrix>[1] = {
    maxEntries: Math.max(25, 5 * (firstPoints.length + 5)),
    maxSweeps: policy.maxSweeps,
    orthogonalityTolerance: 1e-12,
  };
  for (; iterations < policy.maxIterations; iterations++) {
    if (prepared === null) {
      const weighted: number[][] = [],
        right: number[] = [],
        scales: number[] = new Array<number>(5).fill(0);
      for (let at: number = 0; at < linear.residuals.length; at++) {
        const weight: number =
          1 /
          Math.sqrt(Math.hypot(1, linear.residuals[at]! / policy.lossScalePx));
        const row: number[] = linear.jacobian[at]!.map(
          (value: number): number => value * weight,
        );
        weighted.push(row);
        right.push(-linear.residuals[at]! * weight);
        for (let column: number = 0; column < 5; column++)
          scales[column] = Math.hypot(scales[column]!, row[column]!);
      }
      if (scales.some((scale: number): boolean => !(scale > 0)))
        throw new Error(
          "camera-refinement: unresolved local parameter direction",
        );
      const rows: number[][] = weighted.map((row: number[]): number[] =>
        row.map(
          (value: number, column: number): number => value / scales[column]!,
        ),
      );
      const rank: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
        AutoMovieEngineMath.decomposeSingularMatrix(rows, options);
      const ratio: number = rank.singularValues[4]! / rank.singularValues[0]!;
      if (rank.singularValues[0] === 0 || ratio < policy.minimumDesignRatio)
        throw new Error("camera-refinement: rank-degenerate local pose design");
      minimumLocalDesignRatio = Math.min(minimumLocalDesignRatio, ratio);
      let gradient: number = 0;
      for (let column: number = 0; column < 5; column++) {
        let component: number = 0;
        for (let at: number = 0; at < rows.length; at++)
          component += rows[at]![column]! * right[at]!;
        gradient = Math.max(gradient, Math.abs(component));
      }
      prepared = { rows, right, scales, gradient };
    }
    if (prepared.gradient <= 1e-8) {
      termination = "gradient";
      break;
    }
    const rootDamping: number = Math.sqrt(damping);
    const augmented: number[][] = prepared.rows.slice();
    for (let row: number = 0; row < 5; row++)
      augmented.push(
        Array.from({ length: 5 }, (_: unknown, column: number): number =>
          row === column ? rootDamping : 0,
        ),
      );
    const factors: ReturnType<typeof AutoMovieEngineMath.decomposeSingularMatrix> =
      AutoMovieEngineMath.decomposeSingularMatrix(augmented, options);
    const scaledStep: number[] = new Array<number>(5).fill(0);
    for (let component: number = 0; component < 5; component++) {
      let projection: number = 0;
      for (let row: number = 0; row < prepared.right.length; row++)
        projection +=
          factors.leftColumns[component]![row]! * prepared.right[row]!;
      const coefficient: number =
        projection / factors.singularValues[component]!;
      for (let column: number = 0; column < 5; column++)
        scaledStep[column] +=
          factors.rightColumns[component]![column]! * coefficient;
    }
    const step: number[] = scaledStep.map(
      (value: number, at: number): number => value / prepared!.scales[at]!,
    );
    const candidate: typeof pose = stepRecoveryRelativePose(
      pose,
      model.tangent,
      step,
    );
    const candidateModel: ReturnType<IAutoMovieRecoveryPoseModelCreationOperation.Operation> =
      createRecoveryPoseModel(candidate, first, second);
    const errors: ReturnType<IAutoMovieRecoveryEpipolarErrorsMeasurementOperation.Operation> =
      measureRecoveryEpipolarErrors(
        candidateModel.matrix,
        firstPoints,
        secondPoints,
      );
    if (
      errors.some((error: (typeof errors)[number]): boolean => error === null)
    )
      throw new Error("camera-refinement: undefined trial pixel objective");
    const nextCost: number = costOf(
      errors.map(
        (error: (typeof errors)[number]): number => error!.signedSampsonPx,
      ),
    );
    if (nextCost < cost) {
      const decrease: number = cost - nextCost;
      pose = candidate;
      model = candidateModel;
      cost = nextCost;
      acceptedSteps++;
      damping /= 3;
      if (!(damping > 0))
        throw new Error(
          "camera-refinement: damping is no longer representable",
        );
      if (Math.hypot(...step) <= 1e-8) {
        termination = "step";
        iterations++;
        break;
      }
      if (decrease <= 1e-8 * Math.max(1, cost)) {
        termination = "cost";
        iterations++;
        break;
      }
      linear = linearizeRecoveryPoseResiduals(model, firstPoints, secondPoints);
      prepared = null;
    } else {
      damping *= 10;
    }
  }
  return {
    ...pose,
    fundamental: model.matrix,
    converged: termination !== "iteration-budget",
    termination,
    iterations,
    acceptedSteps,
    initialCost,
    finalCost: cost,
    minimumLocalDesignRatio,
  };
}
