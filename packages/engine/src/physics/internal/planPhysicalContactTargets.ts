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

/*
 * Fit one body's contact, support, floor and avoidance goals at its actual
 * root. An external receiver stays at the simultaneous actual placement.
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
