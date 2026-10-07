import type { AutoMovieHumanFaceCanthusDefinition } from "./AutoMovieHumanFaceCanthusDefinition";

/**
 * One eye's medial and lateral canthus definitions.
 *
 * @evidence contracts/common.md#principled-implementation Each canthus is a definition read on the final skin, not a stored position.
 * @evidence contracts/common.md#clear-and-simple-design Two named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Definitions state their own frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the two canthi of one eye.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The canthi are the common endpoints of the upper and lower margins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularCanthi {
  /** The medial canthus (endocanthion) definition. */
  medial: AutoMovieHumanFaceCanthusDefinition;

  /** The lateral canthus (exocanthion) definition. */
  lateral: AutoMovieHumanFaceCanthusDefinition;
}
