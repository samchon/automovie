import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePlanPhysicalContactTargets,
  IAutoMoviePoses,
  IAutoMovieSolvePhysicalArticulationTargets,
} from "@automovie/interface";

import { linearizePhysicalTargetRows } from "./linearizePhysicalTargetRows";
import { physicalContactTargetBones } from "./physicalContactTargetBones";
import { preparePhysicalContactTargetRows } from "./preparePhysicalContactTargetRows";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit one body's contact, support, floor and avoidance goals at its actual
 * root. An external receiver stays at the simultaneous actual placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fixed-root, actual receiver and shared geometric target behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Projects the same authored seed, prepares the body rows and fits the selected coordinates with the shared bounded optimizer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns pose dependencies and geometry. This function selects the single-body path and returns its established residual norms.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero-weight binding and empty-coordinate behavior remain part of the original fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepares geometry rows once and linearizes only moved dependencies. Reports named residuals once at the returned target.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares seed, rows and numerical operations with simultaneous coupling.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns the returned targets and norms. Prepared row closures remain local.
 */
export function planPhysicalContactTargets(
  input: IAutoMoviePlanPhysicalContactTargets.IInput,
): IAutoMoviePlanPhysicalContactTargets.IResult {
  const prepared: ReturnType<typeof preparePhysicalContactTargetRows> =
    preparePhysicalContactTargetRows(input);
  const bones: string[] = physicalContactTargetBones(input);
  if (!bones.length)
    return { targets: prepared.initial, residuals: Object.create(null) };
  const result: IAutoMovieSolvePhysicalArticulationTargets.IResult =
    solvePhysicalArticulationTargets({
      profile: input.profiles[input.body]!,
      targets: prepared.initial,
      bones,
      iterations: prepared.iterations,
      tolerance: prepared.tolerance,
      measure: (poses: IAutoMoviePoses): number[] =>
        prepared.rows.flatMap(
          (row: IAutoMovieLinearizePhysicalTargetRows.IRows): number[] =>
            row.measure(poses),
        ),
      linearize: (
        poses: IAutoMoviePoses,
      ): ((probe: IAutoMoviePoses, moved?: ReadonlySet<string>) => number[]) =>
        linearizePhysicalTargetRows(prepared.rows, poses),
    });
  return {
    targets: result.targets,
    residuals: Object.fromEntries(
      [...prepared.bindings, ...prepared.points].map(
        (entry: (typeof prepared.bindings)[number]): [string, number] => [
          entry.id,
          Math.hypot(...entry.rows.measure(result.targets)),
        ],
      ),
    ),
  };
}
