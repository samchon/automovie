import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
} from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { solveRecoveryMapDesign } from "./solveRecoveryMapDesign";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";

/**
 * Refine one camera against a fixed existing 3D landmark population.
 * Supplied intrinsics and noisy triangulated points remain fixed, so this is a
 * conditional estimate before joint refinement. Soft-L1 weights use a complete
 * two-coordinate residual norm, with analytic SO3/additive-t derivatives.
 *
 * @evidence contracts/common.md#principled-implementation Undamped column-scaled original-design rank precedes each Levenberg step. A finite positive-depth trial is accepted only on lower actual robust pixel cost over the identical observation population; 1e-8 local gradient, step or relative-cost tolerances terminate a local fit.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-subset numerical owner separates conditional resection from matching, robust support selection and map/landmark refinement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point mutation, altered calibration, discarded residual, metric translation normalization, damped-rank claim or exhausted-iteration success supplies a pose. A trial behind a camera is rejected rather than clamped.
 * @evidence contracts/common.md#meaningful-documentation States vector-wise robust loss, local convergence only, unchanged fitting population, positive depth and the conditional noisy-map premise.
 * @evidence contracts/performance.md#efficient-algorithms For N fixed pairs and I bounded iterations, analytic six-column passes and original-design solves cost O(I*S*N*6^2) with O(N) scratch. Accepted and rejected trials share one iteration ceiling.
 * @evidence contracts/performance.md#reuse-equivalent-work Current projection rows provide robust weights, rank and the step; rejected trials retain the same current pose and residual population, with no image re-observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only an owned pose and scalar fit counters return. Temporary rows, callbacks and borrowed observations expire on every return or throw, with no cache or external resource.
 */
export function refineRecoveryResection(
  initial: IAutoMovieRecoveryMapPose,
  points: readonly (readonly [number, number, number])[],
  pixels: readonly (readonly [number, number])[],
  intrinsic: readonly number[],
  policy: IAutoMovieRecoveryCameraMapPolicy,
  budget: IAutoMovieRecoveryCameraMapBudget,
  checkpoint: () => void,
): {
  pose: IAutoMovieRecoveryMapPose;
  converged: boolean;
  iterations: number;
  acceptedSteps: number;
  initialCost: number;
  finalCost: number;
  minimumDesignRatio: number;
  termination: "gradient" | "step" | "cost" | "iteration-budget";
} {
  if (
    points.length < 6 ||
    points.length !== pixels.length ||
    (2 * points.length + 6) * 6 > budget.maxLinearEntries
  )
    throw new Error(
      "camera-resection: bounded fixed observation population required",
    );
  const evaluate: (
    pose: IAutoMovieRecoveryMapPose,
  ) => { cost: number; rows: number[][]; right: number[] } | null = (
    pose: IAutoMovieRecoveryMapPose,
  ): { cost: number; rows: number[][]; right: number[] } | null => {
    const rows: number[][] = [],
      right: number[] = [];
    let cost: number = 0;
    for (let at: number = 0; at < points.length; at++) {
      const value: ReturnType<typeof projectRecoveryMapPoint> =
        projectRecoveryMapPoint(pose, points[at]!, intrinsic);
      if (value === null) return null;
      const residual: number[] = [
        value.pixel[0] - pixels[at]![0],
        value.pixel[1] - pixels[at]![1],
      ];
      const norm: number = Math.hypot(...residual),
        hypotenuse: number = Math.hypot(1, norm / policy.lossScalePx),
        weight: number = 1 / Math.sqrt(hypotenuse);
      cost += norm * (norm / (hypotenuse + 1));
      for (let axis: number = 0; axis < 2; axis++) {
        rows.push(
          value.cameraJacobian[axis]!.map(
            (entry: number): number => entry * weight,
          ),
        );
        right.push(-residual[axis]! * weight);
      }
    }
    if (!Number.isFinite(cost))
      throw new Error("camera-resection: nonrepresentable robust objective");
    return { cost, rows, right };
  };
  let pose: IAutoMovieRecoveryMapPose = {
    rotation: initial.rotation.slice(),
    translation: [...initial.translation],
  };
  let current: ReturnType<typeof evaluate> = evaluate(pose);
  if (current === null)
    throw new Error("camera-resection: initial nonpositive landmark depth");
  const initialCost: number = current.cost;
  let damping: number = 1e-3,
    iterations: number = 0,
    acceptedSteps: number = 0,
    minimumDesignRatio: number = Infinity;
  let termination: "gradient" | "step" | "cost" | "iteration-budget" =
    "iteration-budget";
  for (; iterations < budget.maxRefinementIterations; iterations++) {
    checkpoint();
    const solved: ReturnType<typeof solveRecoveryMapDesign> =
      solveRecoveryMapDesign(
        current.rows,
        current.right,
        policy.minimumDesignSingularRatio,
        damping,
        budget,
      );
    minimumDesignRatio = Math.min(minimumDesignRatio, solved.designRatio);
    if (solved.gradient <= 1e-8) {
      termination = "gradient";
      break;
    }
    const trial: IAutoMovieRecoveryMapPose = stepRecoveryMapPose(
      pose,
      solved.step,
    );
    const measured: ReturnType<typeof evaluate> = evaluate(trial);
    if (measured !== null && measured.cost < current.cost) {
      const decrease: number = current.cost - measured.cost;
      pose = trial;
      current = measured;
      acceptedSteps++;
      damping /= 3;
      if (Math.hypot(...solved.step) <= 1e-8) {
        termination = "step";
        iterations++;
        break;
      }
      if (decrease <= 1e-8 * Math.max(1, current.cost)) {
        termination = "cost";
        iterations++;
        break;
      }
    } else damping *= 10;
    if (!(damping > 0) || !Number.isFinite(damping))
      throw new Error("camera-resection: exhausted representable damping");
  }
  return {
    pose,
    converged: termination !== "iteration-budget",
    iterations,
    acceptedSteps,
    initialCost,
    finalCost: current.cost,
    minimumDesignRatio,
    termination,
  };
}
