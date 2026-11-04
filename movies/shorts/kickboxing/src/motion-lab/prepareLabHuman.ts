import { AutoMovieHumanSkeleton, type IAutoMovieHumanParameters } from "@automovie/human";
import { createPersonParameters } from "../createPersonParameters";

/** Two immutable complete-input preparations cover independently authored body profiles. */
const cached: Map<string, { evaluate: AutoMovieHumanSkeleton.PoseEvaluator; milliseconds: number }> = new Map();
/** Count actual public preparation calls, not viewer selections or claimed cache hits. */
let builds: number = 0;
/** Count actual requests so tests and profiling can distinguish reuse from recalibration. */
let requests: number = 0;

/**
 * Reuse immutable anatomical preparation while each actor retains its own FK snapshots and drawing.
 *
 * @evidence contracts/common.md#implementation-and-ownership Complete serialized Human parameters, both exterior options and adapter construction version decide equivalence. Two prepared evaluators are retained; a third distinct input retires the oldest entry without altering actors already holding it. Public evaluations and returned parameters are independently owned.
 * @evidence contracts/common.md#authoring-interface Returns fresh parameter/diagnostic records and a borrowed public evaluator. The measured preparation cost includes Human calibration and skeleton/neck/foot preparation together; it does not claim isolated polygon cost. No dense Human skin or private package API is used.
 */
export function prepareLabHuman(input: IAutoMovieHumanParameters = createPersonParameters(1800, true)): { parameters: IAutoMovieHumanParameters; evaluate: AutoMovieHumanSkeleton.PoseEvaluator; diagnostics: { key: string; builds: number; requests: number; reused: boolean; anatomicalPreparationMs: number } } {
  const parameters: IAutoMovieHumanParameters = structuredClone(input);
  const key: string = JSON.stringify({ adapter: "original-polygon-public-skeleton-v1", parameters, options: { neckSurface: true, footSurface: true } });
  const reused: boolean = cached.has(key);
  requests++;
  if (!cached.has(key)) {
    const started: number = performance.now();
    const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(parameters, { neckSurface: true, footSurface: true });
    builds++;
    if (cached.size >= 2) cached.delete(cached.keys().next().value!);
    cached.set(key, { evaluate, milliseconds: performance.now() - started });
  }
  const prepared: { evaluate: AutoMovieHumanSkeleton.PoseEvaluator; milliseconds: number } = cached.get(key)!;
  return { parameters, evaluate: prepared.evaluate, diagnostics: { key, builds, requests, reused, anatomicalPreparationMs: prepared.milliseconds } };
}
