import type {
  IAutoMovieRecoveryMapDesignSolutionOperation,
  IAutoMovieRecoveryMapPointProjectionOperation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryResectionRefinementOperation,
} from "@automovie/interface";

import { projectRecoveryMapPoint } from "./projectRecoveryMapPoint";
import { solveRecoveryMapDesign } from "./solveRecoveryMapDesign";
import { stepRecoveryMapPose } from "./stepRecoveryMapPose";

/**
 * Refine one camera against a fixed existing 3D landmark population. Supplied
 * intrinsics and noisy triangulated points remain fixed, so this is a
 * conditional estimate before joint refinement. Soft-L1 weights use a complete
 * two-coordinate residual norm, with analytic SO3/additive-t derivatives.
 */
export function refineRecoveryResection(
  initial: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[0],
  points: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[1],
  pixels: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[2],
  intrinsic: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[3],
  policy: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[4],
  budget: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[5],
  checkpoint: Parameters<IAutoMovieRecoveryResectionRefinementOperation.Operation>[6],
): ReturnType<IAutoMovieRecoveryResectionRefinementOperation.Operation> {
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
      const value: ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> =
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
    const solved: ReturnType<IAutoMovieRecoveryMapDesignSolutionOperation.Operation> =
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
    if (!(damping > 0))
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
