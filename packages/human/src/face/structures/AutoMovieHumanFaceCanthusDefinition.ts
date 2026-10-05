import type { IAutoMovieHumanFaceCanthusExtreme } from "./IAutoMovieHumanFaceCanthusExtreme";
import type { IAutoMovieHumanFaceCanthusVertex } from "./IAutoMovieHumanFaceCanthusVertex";

/**
 * How a canthus is registered: an extreme of the joined margin rows along a
 * head-frame axis, or one fixed skin vertex where no extreme definition
 * exists.
 *
 * @evidence contracts/common.md#principled-implementation The extreme form follows edits; the vertex form is the stated fallback.
 * @evidence contracts/common.md#clear-and-simple-design A discriminated union of two named forms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States both forms and when each applies.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Each form states its frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Defines one canthus.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The canthus is a common endpoint of both margins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records each entry's origin.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 */
export type AutoMovieHumanFaceCanthusDefinition =
  | IAutoMovieHumanFaceCanthusExtreme
  | IAutoMovieHumanFaceCanthusVertex;
