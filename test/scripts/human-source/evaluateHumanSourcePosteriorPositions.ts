import { createHumanSourceCrownAffineMatrix } from "./createHumanSourceCrownAffineMatrix.ts";
import { placeHumanSourceCrownOcclusion } from "./placeHumanSourceCrownOcclusion.ts";
import type { IHumanSourcePosteriorOcclusionProblem } from "./structures/IHumanSourcePosteriorOcclusionProblem.ts";

/**
 * Apply positive paired crown scales, then one exact authored incisor placement.
 *
 * Scales are positive offline source variables, not clinical intervals or
 * personal sculpt controls. The exact original frames determine each
 * candidate independently. Out-of-domain values refuse without clipping.
 */
export function evaluateHumanSourcePosteriorPositions(
  problem: IHumanSourcePosteriorOcclusionProblem,
  scales: readonly number[],
): number[] {
  if (
    scales.length !== problem.parameters.length ||
    scales.some((scale) => !Number.isFinite(scale) || scale <= 0)
  )
    throw new Error(
      "Source crown scales must be complete positive finite values.",
    );
  const candidate = [...problem.originalPositions];
  for (const frame of problem.frames) {
    const matrix = createHumanSourceCrownAffineMatrix(frame, scales);
    for (const vertex of frame.vertices)
      for (let row = 0; row < 3; row++) {
        // The difference form retains exact original values when scales are one.
        const displacement = [0, 1, 2].reduce(
          (sum, column) =>
            sum +
            (matrix[3 * row + column] - (row === column ? 1 : 0)) *
              (problem.originalPositions[3 * vertex + column] -
                frame.centreMetres[column]),
          0,
        );
        candidate[3 * vertex + row] += displacement;
        if (!Number.isFinite(candidate[3 * vertex + row]))
          throw new Error(
            "Source crown scaling produced a nonfinite coordinate.",
          );
      }
  }
  return placeHumanSourceCrownOcclusion(problem, candidate);
}
