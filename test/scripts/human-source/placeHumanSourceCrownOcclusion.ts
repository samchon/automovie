import type { IHumanSourcePosteriorOcclusionProblem } from "./structures/IHumanSourcePosteriorOcclusionProblem.ts";
import { measureHumanSourceIncisorRelation } from "./measureHumanSourceIncisorRelation.ts";

/** Apply one rigid lower-arch placement after candidate crown geometry exists. */
export function placeHumanSourceCrownOcclusion(problem: IHumanSourcePosteriorOcclusionProblem, positions: readonly number[]): number[] {
  const relation = measureHumanSourceIncisorRelation(problem.face, positions, problem.direction, problem.forward);
  const translation = problem.direction.map((value, axis) =>
    (relation.overbiteMetres - problem.overbiteTargetMetres) * value - (problem.overjetTargetMetres - relation.overjetMetres) * problem.forward[axis]);
  const result = [...positions];
  for (const vertex of problem.mandibularVertices) for (let axis = 0; axis < 3; axis++) result[3 * vertex + axis] += translation[axis];
  if (!result.every(Number.isFinite)) throw new Error("Source crown placement exceeds finite coordinates.");
  return result;
}
