import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { readHumanBodyShapedMeasurement } from "./readHumanBodyShapedMeasurement";

/**
 * Compile one rest body for several measurement rules. Its shaped skin and
 * landmarks are owned by this reader; callers treat them as read-only. Every
 * reading observes that same numerical body. A different trial shape needs a
 * new reader, so mass, stature and tape reports cannot silently mix candidate
 * geometries.
 *
 * A rule with several stations shares one normal, so each surface is indexed
 * once for all its stations (`indexHumanBodySectionTriangles`) and every cut
 * reads only the triangles near its plane; the readings equal those of a
 * full walk of each station.
 *
 * @evidence contracts/common.md#principled-implementation The reader shapes the body once through the builder's own weights and evaluator, so every rule reads the same numerical skin; a height, a landmark distance and a station stack follow their stated definitions, and the station index only narrows the triangles each exact cut reads.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: one shaped rest body and the rules read from it. The cut, the index and the rule table are separate owners it calls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel, landmark or target value is special-cased; a rule is data from the table and an unanswerable rule answers null instead of a guess.
 * @evidence contracts/common.md#meaningful-documentation The comments state what the reader owns, its read-only contract, the rule kinds and the null answers, and why a stack is indexed.
 * @evidence contracts/modeling.md#spatial-conventions Every length is metres in the rest body's frame with +Z forward; a rule's segment and planes are built from landmarks in that frame and no other conversion occurs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads one whole rest body and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes a shape but defines no channel; the rule table names what each channel measures.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only lengths.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays; the simple tier that consumes it answers that chapter.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the rule table names the landmarks and the public definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity; the caller's inversion refuses what the body cannot reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function reads a body and is not an input through which a caller shapes one.
 */
export function createHumanBodyMeasurementReader(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): {
  shaped: ReturnType<typeof evaluateHumanBodyShape>;
  read: (rule: IAutoMovieHumanBodyMeasurement) => number | null;
} {
  const shaped = evaluateHumanBodyShape(
    basis,
    humanBodyBasisWeights(basis, { shape }),
  );
  return {
    shaped,
    read: (rule) => readHumanBodyShapedMeasurement(basis, shaped, rule),
  };
}
