import { evaluateHumanSourcePosteriorOcclusion } from "./evaluateHumanSourcePosteriorOcclusion.ts";
import { searchHumanSourcePattern } from "./searchHumanSourcePattern.ts";
import type { IHumanSourcePosteriorOcclusionEvaluation } from "./structures/IHumanSourcePosteriorOcclusionEvaluation.ts";
import type { IHumanSourcePosteriorOcclusionProblem } from "./structures/IHumanSourcePosteriorOcclusionProblem.ts";
import type { IHumanSourcePosteriorOcclusionSearch } from "./structures/IHumanSourcePosteriorOcclusionSearch.ts";

/**
 * Search all paired source crown axes on a dyadic logarithmic-scale poll mesh.
 * Signed coordinate directions form a positive spanning set; accepted moves
 * immediately compose within a sweep and supply a coupled pattern trial.
 * The shared Hooke-Jeeves owner supplies exploratory and pattern moves.
 * Torczon's SIAM J. Optim. 7(1), 1997, DOI 10.1137/S1052623493250780 smooth
 * unconstrained convergence theorem does not certify these nonsmooth source
 * contact predicates or a global optimum.
 *
 * Feasibility is always the unchanged full-source evaluator. Before a feasible
 * point exists, actual squared metre violation orders candidates, with exact
 * overlap count breaking ties. The first fully feasible point ends this
 * bounded feasibility solve; no minimum source-change claim follows from it.
 * Failed source arithmetic is retained
 * as a rejected candidate, not weakened. A finite evaluation budget returns
 * the measured best result, which the authoring application refuses unless
 * it is actually feasible. Exact parameter-vector memoization avoids repeated
 * queries of the same immutable candidate.
 */
export function searchHumanSourcePosteriorOcclusion(problem: IHumanSourcePosteriorOcclusionProblem, maximumEvaluations: number): IHumanSourcePosteriorOcclusionSearch {
  if (!Number.isSafeInteger(maximumEvaluations) || maximumEvaluations < 1)
    throw new Error("Source occlusion search needs a positive finite evaluation budget.");
  const better = (candidate: IHumanSourcePosteriorOcclusionEvaluation, current: IHumanSourcePosteriorOcclusionEvaluation): boolean => {
    if (candidate.feasible !== current.feasible) return candidate.feasible;
    if (candidate.feasible) return candidate.objective < current.objective;
    const violation = candidate.penetrationSquaredMetres + candidate.excessSquaredMetres;
    const previous = current.penetrationSquaredMetres + current.excessSquaredMetres;
    if (violation !== previous) return violation < previous;
    if (candidate.overlaps.length !== current.overlaps.length) return candidate.overlaps.length < current.overlaps.length;
    return candidate.objective < current.objective;
  };
  const result = searchHumanSourcePattern<IHumanSourcePosteriorOcclusionEvaluation>({ initial: problem.parameters.map(() => 0), maximumEvaluations,
    admit: (parameters) => parameters.every((value) => Number.isFinite(value) && Number.isFinite(Math.exp(value)) && Math.exp(value) > 0),
    evaluate: (parameters) => evaluateHumanSourcePosteriorOcclusion(problem, parameters.map(Math.exp)), better,
    accepted: (evaluation) => evaluation.feasible,
    completed: (event) => console.log("[human-source] oral-evaluation " + JSON.stringify({ evaluations: event.evaluations, stage: event.stage,
      elapsedMilliseconds: event.elapsedMilliseconds, logScales: event.parameters, refusal: event.refusal,
      feasible: event.evaluation?.feasible, overlaps: event.evaluation?.overlaps.length,
      penetrationSquaredMetres: event.evaluation?.penetrationSquaredMetres, excessSquaredMetres: event.evaluation?.excessSquaredMetres })) });
  return { scales: result.parameters.map(Math.exp), evaluation: result.evaluation, evaluations: result.evaluations, mesh: result.mesh, arithmeticRefusals: result.refusals,
    termination: result.termination,
    qualification: "Finite source width/depth/height Hooke-Jeeves feasibility search over complete paired crowns with unchanged authored contacts and OB/OJ. Positive log scales are a mathematical source domain, not clinical ranges. First feasible admission is not a global optimum or clinical intercuspation claim." };
}
