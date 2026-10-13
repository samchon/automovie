import type { IAutoMovieQuadraticRow } from "@automovie/engine";

import { createHumanBodyUnderwearLiftLinearizer } from "./createHumanBodyUnderwearLiftLinearizer";
import type { IHumanBodyUnderwearFittingLinearization } from "./IHumanBodyUnderwearFittingLinearization";
import type { IHumanBodyUnderwearSurfaceEvaluation } from "./IHumanBodyUnderwearSurfaceEvaluation";
import type { IHumanBodyUnderwearSurfaceFitInput } from "./IHumanBodyUnderwearSurfaceFitInput";

/**
 * Compile the complete field and actual-lift affine model of one material.
 *
 * Point displacements use rho-normalized coordinates. Each field condition owns one nonnegative slack; tied witnesses of the same located lift kind share one slack and contribute their worst actual value once to the L1 sum. The existing lift owner retains its analytic normal derivatives and exact path witnesses. The fitter supplies the refusal callback so an unavailable field retains its complete current native and trial history.
 *
 * Construction admits the same fixed lift inputs before fitting begins. The returned reader is called only after the fitter has initialized its refusal state. Neither affine feasibility nor the L1 sum accepts emitted geometry.
 *
 * @evidence contracts/common.md#principled-implementation Envelope distance gradients produce rho-normalized field rows, while actual lift witnesses produce signed rows and tied located conditions share one elastic slack and worst-value violation.
 * @evidence contracts/common.md#clear-and-simple-design The fixed lift linearizer prepares once; each current evaluation returns rows, slack groups, lift observations and one diagnostic violation sum for the owning fitter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonfinite original field readings invoke the fitter's complete refusal path; affine rows and the L1 merit remain proposals and diagnostics rather than acceptance of emitted geometry.
 * @evidence contracts/common.md#meaningful-documentation Normalized coordinates, grouped witness semantics, refusal timing and the forward evaluator's separate authority are stated.
 * @evidence contracts/performance.md#efficient-algorithms Each candidate reads V envelope points and walks lift rows and their sparse entries; nearest-query and analytic lift costs remain with their owners, and row/group storage scales with actual constraints.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed lift-input preparation is shared across candidates, and a located witness key reuses its slack index and worst value within the current linearization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains fixed input and lift preparation; returned sparse rows and observations belong to the fitter, per-candidate grouping maps expire, and no external handle or task is acquired.
 */
export function createHumanBodyUnderwearFittingLinearizer(
  input: IHumanBodyUnderwearSurfaceFitInput,
  fail: (reason: string, current: IHumanBodyUnderwearSurfaceEvaluation) => never,
): (current: IHumanBodyUnderwearSurfaceEvaluation) => IHumanBodyUnderwearFittingLinearization {
  const { points, envelope, rho }: typeof input = input;
  const count: number = points.length / 3;
  const linearizeLift: ReturnType<typeof createHumanBodyUnderwearLiftLinearizer> = createHumanBodyUnderwearLiftLinearizer(input);
  return (current: IHumanBodyUnderwearSurfaceEvaluation): IHumanBodyUnderwearFittingLinearization => {
    const lift: ReturnType<typeof linearizeLift> = linearizeLift(current);
    const nonlinear: IAutoMovieQuadraticRow[] = [];
    const elasticGroups: number[] = [];
    let elasticCount: number = 0;
    let violationSum: number = 0;
    for (let v: number = 0; v < count; v++) {
      const at: number[] = current.base.slice(v * 3, v * 3 + 3), reading: ReturnType<typeof envelope.read> = envelope.read(at);
      if (!Number.isFinite(reading.distance) || !reading.gradient.every(Number.isFinite))
        fail("Garment Phase I has no finite original field linearization", current);
      const value: number = (reading.distance - rho) / rho;
      violationSum += Math.max(0, value);
      if (reading.distance === 0) continue;
      let upper: number = -value;
      for (let k: number = 0; k < 3; k++)
        upper += reading.gradient[k] * (at[k] - points[v * 3 + k]) / rho;
      nonlinear.push({ indices: [v * 3, v * 3 + 1, v * 3 + 2],
        weights: reading.gradient, lower: null, upper });
      elasticGroups.push(elasticCount++);
    }
    const liftValues: Map<string, number> = new Map<string, number>();
    const liftGroups: Map<string, number> = new Map<string, number>();
    for (const row of lift.rows) {
      const key: string = row.kind + ":" + row.triangle + ":" + row.corner;
      liftValues.set(key, Math.min(liftValues.get(key) ?? Infinity, row.value));
      if (!liftGroups.has(key)) liftGroups.set(key, elasticCount++);
      let upper: number = row.value;
      const weights: number[] = row.gradient.map((value: number): number => -rho * value);
      for (let k: number = 0; k < row.indices.length; k++)
        upper += weights[k] * (current.base[row.indices[k]] - points[row.indices[k]]) / rho;
      nonlinear.push({ indices: row.indices, weights, lower: null, upper });
      elasticGroups.push(liftGroups.get(key)!);
    }
    for (const value of liftValues.values()) violationSum += Math.max(0, -value);
    return { rows: nonlinear, elasticGroups, elasticCount, lift, violationSum };
  };
}
