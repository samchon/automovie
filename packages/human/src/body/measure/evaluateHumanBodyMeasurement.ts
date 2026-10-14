import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";

/**
 * Evaluate one rule on a freshly shaped rest body, in metres or null.
 *
 * Each inverse trial needs a new candidate geometry and uses this direct entry. Consumers reading several rules on an unchanged shape retain createHumanBodyMeasurementReader instead. The admitted basis and shape remain caller-owned, and a geometry measurement does not certify clinical anatomy or physiology.
 *
 * @evidence contracts/common.md#principled-implementation One shared measurement reader evaluates the requested rest shape through existing weights, then reads the supplied rule on that exact candidate.
 * @evidence contracts/common.md#clear-and-simple-design This single-rule convenience delegates all shaping and instrument logic to the same reader used by repeated-rule callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing measurement witnesses remain null; a new trial cannot borrow geometry from another shape or claim biological validity from a numeric reading.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies metre/null output, admitted caller inputs and when to use a retained reader instead.
 * @evidence contracts/performance.md#efficient-algorithms Each call incurs one actual weight/shape evaluation and the rule's instrument cost; callers with several same-shape rules avoid repeated shaping through the compiled reader.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared weight and measurement owners prevent divergent direct/inverse readings, while changing trial shapes deliberately receive distinct readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transient reader and candidate arrays expire after the scalar/null result, retaining no prior geometry, handle or task.
 */
export function evaluateHumanBodyMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  return createHumanBodyMeasurementReader(basis, shape).read(rule);
}
