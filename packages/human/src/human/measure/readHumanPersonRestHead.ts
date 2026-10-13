import type { IAutoMovieHumanHeadSkin } from "../../common/measure/IAutoMovieHumanHeadSkin";
import { evaluateHumanPersonRestSkin } from "../build/evaluateHumanPersonRestSkin";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Project the source-rest evaluator's posed head skin to Float32 positions with the original head-view indices and named landmark/area metadata. Source shape and neutral expression are evaluated, and shape-dependent body shoulder-rest transforms still apply. Full contact/closure production is omitted; source-rest equality with the final neutral model is a consumer comparison, not this projection's guarantee.
 *
 * Positions use the common performed metre/Y-up/Z-forward frame. The wrapper and quantized coordinates are owned; indices/landmarks/regions remain borrowed from the unchanged compiled generation. Rule registration retains its source qualification rather than becoming a new clinical measurement authority.
 *
 * @evidence contracts/common.md#principled-implementation Existing source-rest skin and exact original head-view topology/metadata expose the actual performed head to the registered instruments at Float32 precision.
 * @evidence contracts/common.md#clear-and-simple-design This projection owns coordinate quantization and head-view selection only; shape/skin formation and instrument acquisition have dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No full-neutral contact/closure equivalence or clinical frame qualification is inferred from the shortcut, and named source acquisition remains explicit.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/performed-rest frame, Float32 precision, omitted-stage scope and borrowed metadata ownership.
 * @evidence contracts/performance.md#efficient-algorithms Rest evaluation pays its actual anatomy/skin work, followed by one O(head coordinates) quantization and a fixed wrapper allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing compiled source topology and named measurement metadata are reused without reconstructing correspondence or another face build.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns its coordinate copy and borrows fixed metadata; intermediate formed body/head buffers expire except output, with no independent task or cache.
 */
export function readHumanPersonRestHead(
  compiled: IAutoMovieHumanPersonCompiledGeneration,
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanHeadSkin {
  const face: IAutoMovieHumanPersonCompiledGeneration["generation"]["face"] = compiled.generation.face;
  const rest: ReturnType<typeof evaluateHumanPersonRestSkin> = evaluateHumanPersonRestSkin(compiled, document);
  return {
    id: face.id,
    surface: compiled.faceProducerSkin,
    positions: rest.facePosed.map((value: number): number => Math.fround(value)),
    indices: face.surfaces[compiled.faceProducerSkin].indices,
    skinLandmarks: face.skinLandmarks,
    skinRegions: face.skinRegions,
  };
}
