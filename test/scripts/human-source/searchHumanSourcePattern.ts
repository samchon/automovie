import type { IHumanSourcePatternSearchInput } from "./structures/IHumanSourcePatternSearchInput.ts";
import type { IHumanSourcePatternSearchResult } from "./structures/IHumanSourcePatternSearchResult.ts";
import type { IHumanSourcePatternEvaluation } from "./structures/IHumanSourcePatternEvaluation.ts";

/**
 * Explore normalized source coordinates, then pursue their coupled movement.
 * Each improving coordinate is accepted before the next coordinate is read.
 * A successful sweep's aggregate displacement supplies one pattern trial;
 * an unsuccessful sweep reads every signed coordinate at one incumbent and
 * halves the dyadic mesh. These are the exploratory and pattern mechanisms
 * of Hooke and Jeeves, JACM 8(2), 1961, DOI 10.1145/321062.321069, also
 * described by Kaupe's Algorithm 178 and its Netlib implementation
 * https://www.netlib.org/opt/hooke.c. This implementation is independently
 * written around the source owner's admission and finite evaluation budget.
 *
 * Signed coordinate polls positively span the full parameter space. That
 * does not certify global feasibility, convergence for arbitrary nonsmooth
 * source contacts, or an optimum at a finite budget. The source owner supplies
 * domain admission, actual candidate evaluation and ordering, so no geometric
 * or clinical tolerance enters this numerical mechanism. Exact vectors share
 * evaluations. Numerical/source refusal is retained, never replaced by a
 * successful result. First actual admission or budget/representability
 * exhaustion returns evidence for the owning application to accept or refuse.
 */
export function searchHumanSourcePattern<T extends object>(input: IHumanSourcePatternSearchInput<T>): IHumanSourcePatternSearchResult<T> {
  if (!Number.isSafeInteger(input.maximumEvaluations) || input.maximumEvaluations < 1 || input.initial.length === 0 || !input.admit(input.initial))
    throw new Error("Source pattern search needs an admitted initial vector and positive evaluation budget.");
  const cache = new Map<string, T | null>(), refusals: string[] = [];
  let evaluations = 0;
  const evaluate = (parameters: number[], stage: IHumanSourcePatternEvaluation<T>["stage"]): T | null => {
    const key = JSON.stringify(parameters);
    if (cache.has(key)) return cache.get(key)!;
    if (evaluations === input.maximumEvaluations) return null;
    evaluations++;
    const start = performance.now();
    let result: T | null = null, refusal: string | null = null;
    try { result = input.evaluate(parameters); }
    catch (error) { refusal = error instanceof Error ? error.message : String(error); refusals.push(JSON.stringify({ parameters, refusal })); }
    cache.set(key, result);
    input.completed({ evaluations, parameters: [...parameters], stage, elapsedMilliseconds: performance.now() - start, evaluation: result, refusal });
    return result;
  };
  let parameters = [...input.initial];
  const original = evaluate(parameters, "initial");
  if (original === null) throw new Error("Initial source evaluation refused: " + JSON.stringify(refusals));
  let best: T = original;
  const signs = parameters.map(() => 1);
  let mesh = 0.25;
  let termination: IHumanSourcePatternSearchResult<T>["termination"] = "budget";
  while (evaluations < input.maximumEvaluations) {
    if (input.accepted(best)) { termination = "accepted"; break; }
    let improved = false, distinguishable = false;
    const origin = [...parameters];
    for (let axis = 0; axis < parameters.length && evaluations < input.maximumEvaluations; axis++) {
      for (const sign of [signs[axis], -signs[axis]]) {
        const candidate = [...parameters]; candidate[axis] += mesh * sign;
        if (candidate[axis] === parameters[axis]) continue;
        distinguishable = true;
        if (!input.admit(candidate)) continue;
        const result = evaluate(candidate, "explore");
        if (result !== null && input.better(result, best)) {
          best = result; parameters = candidate; signs[axis] = sign; improved = true; break;
        }
        if (evaluations === input.maximumEvaluations) break;
      }
      if (input.accepted(best)) break;
    }
    if (input.accepted(best)) { termination = "accepted"; break; }
    if (improved && evaluations < input.maximumEvaluations) {
      const pattern = parameters.map((value, axis) => value + (value - origin[axis]));
      if (input.admit(pattern) && pattern.some((value, axis) => value !== parameters[axis])) {
        const result = evaluate(pattern, "pattern");
        if (result !== null && input.better(result, best)) { best = result; parameters = pattern; }
      }
    } else if (!improved) {
      mesh /= 2;
      if (!distinguishable || mesh === 0) { termination = "representability"; break; }
    }
  }
  if (input.accepted(best)) termination = "accepted";
  return { parameters, evaluation: best, evaluations, mesh, refusals, termination };
}
