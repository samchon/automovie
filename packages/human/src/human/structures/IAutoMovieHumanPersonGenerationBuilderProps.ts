import type { IAutoMovieHumanPersonGeneration } from "./IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";

/**
 * What the one-skin person evaluator is compiled from: one source generation
 * and the face producer's optional occlusion bake.
 *
 * @evidence contracts/common.md#principled-implementation The evaluator needs exactly the generation and the face producer's existing option.
 * @evidence contracts/common.md#clear-and-simple-design Two named fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document value or tolerance is carried.
 * @evidence contracts/common.md#meaningful-documentation States both fields.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props are not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The generation states its own frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The generation owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props do not shape a person.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuilderProps {
  /** The source generation, read as one skin with a head/body partition. */
  generation: IAutoMovieHumanPersonGeneration;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;
}
