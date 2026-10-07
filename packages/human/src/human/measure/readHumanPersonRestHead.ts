import type { IAutoMovieHumanHeadSkin } from "../../common/measure/IAutoMovieHumanHeadSkin";
import { evaluateHumanPersonRestSkin } from "../build/evaluateHumanPersonRestSkin";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * The head view of a person's skin at rest, for the head rules: the face
 * producer skin of `evaluateHumanPersonRestSkin` (shape only, no pose,
 * neutral expression), quantized to Float32 like every person measurement,
 * with the head view basis's named points and areas.
 *
 * @evidence contracts/common.md#principled-implementation The head rules read the same rest skin the stature and volume readings read.
 * @evidence contracts/common.md#clear-and-simple-design One rest evaluation and one quantization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The positions are the evaluator's own; nothing is re-posed or smoothed.
 * @evidence contracts/common.md#meaningful-documentation States the source of the skin, its state and its precision.
 * @evidence contracts/modeling.md#spatial-conventions Metres of the person frame at rest.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The skin carries no anatomical value of its own.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; its reading carries the points a render marks.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing; the rule's range is a report.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function readHumanPersonRestHead(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanHeadSkin {
  const face = compiled.generation.face;
  const rest = evaluateHumanPersonRestSkin(compiled, document);
  return {
    id: face.id,
    surface: compiled.faceProducerSkin,
    positions: rest.facePosed.map((value) => Math.fround(value)),
    indices: face.surfaces[compiled.faceProducerSkin].indices,
    skinLandmarks: face.skinLandmarks,
    skinRegions: face.skinRegions,
  };
}
