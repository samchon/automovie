import type { IAutoMovieQuadraticRow } from "@automovie/engine";

import { createHumanBodyUnderwearLiftLinearizer } from "./createHumanBodyUnderwearLiftLinearizer";
import type { IHumanBodyUnderwearFittingLinearization } from "./IHumanBodyUnderwearFittingLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";

/**
 * Compile the complete field and actual-lift affine model of one material.
 *
 * Point displacements use rho-normalized coordinates. Each field condition
 * owns one nonnegative slack; tied witnesses of the same located lift kind
 * share one slack and contribute their worst actual value once to the L1 sum.
 * The existing lift owner retains its analytic normal derivatives and exact
 * path witnesses. The fitter supplies the refusal callback so an unavailable
 * field retains its complete current native and trial history.
 *
 * Construction admits the same fixed lift inputs before fitting begins. The
 * returned reader is called only after the fitter has initialized its refusal
 * state. Neither affine feasibility nor the L1 sum accepts emitted geometry.
 */
export function createHumanBodyUnderwearFittingLinearizer(
  input: IHumanBodyUnderwearSurfaceFitInput,
  fail: (reason: string, current: IHumanBodyUnderwearSurfaceEvaluation) => never,
): (current: IHumanBodyUnderwearSurfaceEvaluation) => IHumanBodyUnderwearFittingLinearization {
  const { points, envelope, rho } = input;
  const count = points.length / 3;
  const linearizeLift = createHumanBodyUnderwearLiftLinearizer(input);
  return (current) => {
    const lift = linearizeLift(current);
    const nonlinear: IAutoMovieQuadraticRow[] = [];
    const elasticGroups: number[] = [];
    let elasticCount = 0;
    let violationSum = 0;
    for (let v = 0; v < count; v++) {
      const at = current.base.slice(v * 3, v * 3 + 3), reading = envelope.read(at);
      if (!Number.isFinite(reading.distance) || !reading.gradient.every(Number.isFinite))
        fail("Garment Phase I has no finite original field linearization", current);
      const value = (reading.distance - rho) / rho;
      violationSum += Math.max(0, value);
      if (reading.distance === 0) continue;
      let upper = -value;
      for (let k = 0; k < 3; k++)
        upper += reading.gradient[k] * (at[k] - points[v * 3 + k]) / rho;
      nonlinear.push({ indices: [v * 3, v * 3 + 1, v * 3 + 2],
        weights: reading.gradient, lower: null, upper });
      elasticGroups.push(elasticCount++);
    }
    const liftValues = new Map<string, number>();
    const liftGroups = new Map<string, number>();
    for (const row of lift.rows) {
      const key = row.kind + ":" + row.triangle + ":" + row.corner;
      liftValues.set(key, Math.min(liftValues.get(key) ?? Infinity, row.value));
      if (!liftGroups.has(key)) liftGroups.set(key, elasticCount++);
      let upper = row.value;
      const weights = row.gradient.map((value) => -rho * value);
      for (let k = 0; k < row.indices.length; k++)
        upper += weights[k] * (current.base[row.indices[k]] - points[row.indices[k]]) / rho;
      nonlinear.push({ indices: row.indices, weights, lower: null, upper });
      elasticGroups.push(liftGroups.get(key)!);
    }
    for (const value of liftValues.values()) violationSum += Math.max(0, -value);
    return { rows: nonlinear, elasticGroups, elasticCount, lift, violationSum };
  };
}
