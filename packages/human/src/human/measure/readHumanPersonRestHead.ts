import type { IAutoMovieHumanHeadSkin } from "../../common/measure/IAutoMovieHumanHeadSkin";
import { evaluateHumanPersonRestSkin } from "../build/evaluateHumanPersonRestSkin";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * The head view of a person's skin at rest, for the head rules: the face
 * producer skin of `evaluateHumanPersonRestSkin` (shape only, no pose,
 * neutral expression), quantized to Float32 like every person measurement,
 * with the head view basis's named points and areas.
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
