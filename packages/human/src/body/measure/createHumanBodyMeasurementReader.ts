import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { resolveHumanBodyShapeShoulderRest } from "../basis/resolveHumanBodyShapeShoulderRest";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { readHumanBodyShapedMeasurement } from "./readHumanBodyShapedMeasurement";

/**
 * Compile one rest body for repeated measurement rules.
 *
 * The shared shoulder-rest, weight and shape evaluators produce owned rest skin/landmarks once, using the same shaped omitted-shoulder goals as the body builder. Callers treat the exposed arrays as read-only and keep the admitted basis unchanged; each rule reads this same numerical body through readHumanBodyShapedMeasurement. A different trial shape requires another reader. Measurements are in metres or null when a rule lacks a witness; geometry readings alone do not establish physiological or clinical validity.
 *
 * A multi-station rule shares one triangle index for its parallel cuts within that rule call. This reader caches the shaped geometry, not measurement results or station indices across separate rules. Existing anatomical and simple-shape solvers reuse it so readings from one trial do not silently mix different candidates.
 *
 * @evidence contracts/common.md#principled-implementation Existing corrective-weight and shape owners evaluate one unposed candidate, then every requested rule observes those same surfaces/landmarks through the shared measurement instrument.
 * @evidence contracts/common.md#clear-and-simple-design The reader exposes the owned shaped result and one rule callback while individual distance/extent/section algorithms remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers must preserve the admitted basis and borrowed exposed result; unavailable witnesses remain null and geometry readings cannot certify personal physiology or clinical anatomy.
 * @evidence contracts/common.md#meaningful-documentation The prose specifies rest geometry, metre/null results, read-only caller discipline, per-rule station reuse and lack of cross-rule measurement memoization.
 * @evidence contracts/performance.md#efficient-algorithms One weight/shape evaluation precedes repeated rule work; distance rules use landmarks and section/extent rules incur their actual mesh/triangle costs rather than rebuilding the trial body.
 * @evidence contracts/performance.md#reuse-equivalent-work Solvers share one candidate's shaped arrays across requested rules; parallel station indices are shared only inside their owning rule evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned callback retains the borrowed basis and owned shaped arrays until released, without retaining prior trial readers, external handles or tasks.
 */
export function createHumanBodyMeasurementReader(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): {
  shaped: ReturnType<typeof evaluateHumanBodyShape>;
  read: (rule: IAutoMovieHumanBodyMeasurement) => number | null;
} {
  const shaped: ReturnType<typeof evaluateHumanBodyShape> = evaluateHumanBodyShape(
    basis,
    humanBodyBasisWeights(basis, { shape }, resolveHumanBodyShapeShoulderRest(basis, shape)),
  );
  return {
    shaped,
    read: (rule: IAutoMovieHumanBodyMeasurement): number | null => readHumanBodyShapedMeasurement(basis, shaped, rule),
  };
}
