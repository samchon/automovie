import { evaluateHumanSourceTongueRest } from "./evaluateHumanSourceTongueRest.ts";
import { evaluateHumanSourceTongueRestPositions } from "./evaluateHumanSourceTongueRestPositions.ts";
import { searchHumanSourcePattern } from "./searchHumanSourcePattern.ts";
import type { IHumanSourceTongueRestParameters } from "./structures/IHumanSourceTongueRestParameters.ts";
import type { IHumanSourceTongueRestEvaluation } from "./structures/IHumanSourceTongueRestEvaluation.ts";
import type { IHumanSourceTongueRestProblem } from "./structures/IHumanSourceTongueRestProblem.ts";
import type { IHumanSourceTongueRestSearch } from "./structures/IHumanSourceTongueRestSearch.ts";

/**
 * Search root-preserving source width, free-tip retraction and dorsal relief.
 * Search displacements are normalized by actual free-body extent and greatest
 * original palate-field room, respectively. Those are numerical search scales,
 * not invented clinical ranges. The same finite polling owner as occlusion
 * evaluates every candidate; actual contact and sampled lining conditions are
 * never replaced by merit or by a population mean. A sampled fit still owes
 * native-loop and full normal assembly admission.
 */
export function searchHumanSourceTongueRest(problem: IHumanSourceTongueRestProblem, maximumEvaluations: number): IHumanSourceTongueRestSearch {
  const freeLength = problem.maximumV - problem.rootEndV;
  const riseScale = Math.max(...problem.coordinateA.map((a, at) => problem.palate.apical(problem.coordinateU[at], problem.coordinateV[at]) - a));
  if (!(riseScale > 0) || !Number.isFinite(riseScale)) throw new Error("Source tongue has no actual positive palatal room for dorsal authoring.");
  const decode = (values: readonly number[]): IHumanSourceTongueRestParameters => ({ widthScale: values[0], tipRetractionMetres: values[1] * freeLength, dorsumRiseMetres: values[2] * riseScale });
  const result = searchHumanSourcePattern<IHumanSourceTongueRestEvaluation>({ initial: [1, 0, 0], maximumEvaluations,
    admit: (values) => values.length === 3 && values.every((value) => Number.isFinite(value) && value >= 0 && value <= 1) && values[0] > 0,
    evaluate: (values) => evaluateHumanSourceTongueRest(problem, evaluateHumanSourceTongueRestPositions(problem, decode(values))),
    better: (candidate, current) => {
      if (candidate.sampledFeasible !== current.sampledFeasible) return candidate.sampledFeasible;
      const a = candidate.penetrationSquaredMetres + candidate.excessSquaredMetres, b = current.penetrationSquaredMetres + current.excessSquaredMetres;
      if (a !== b) return a < b;
      return candidate.penetratingCrowns.length + candidate.crossingCrowns.length < current.penetratingCrowns.length + current.crossingCrowns.length;
    }, accepted: (evaluation) => evaluation.sampledFeasible,
    completed: (event) => console.log("[human-source] tongue-evaluation " + JSON.stringify({ evaluations: event.evaluations, stage: event.stage,
      elapsedMilliseconds: event.elapsedMilliseconds, normalizedParameters: event.parameters, refusal: event.refusal,
      sampledFeasible: event.evaluation?.sampledFeasible, penetrationSquaredMetres: event.evaluation?.penetrationSquaredMetres,
      excessSquaredMetres: event.evaluation?.excessSquaredMetres })) });
  return { parameters: decode(result.parameters), evaluation: result.evaluation, evaluations: result.evaluations, mesh: result.mesh, refusals: result.refusals, termination: result.termination };
}
