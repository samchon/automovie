import type { IAutoMovieHumanBodyPartResolution } from "./IAutoMovieHumanBodyPartResolution";
import type { IAutoMovieHumanBodyRegionPartsInput } from "./IAutoMovieHumanBodyRegionPartsInput";

/**
 * A region owner's answer for its own named parts.
 *
 * Each region returns only the parts it owns, each resolved with validation
 * or unavailable with its exact reason. `assembleHumanBodyGeneratedAnatomy`
 * refuses two regions answering one part.
 *
 * @evidence contracts/common.md#principled-implementation Each region owns the reasons for its own parts; the assembly only combines them.
 * @evidence contracts/common.md#clear-and-simple-design One function shape for every region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A region cannot answer for another region's part without the assembly refusing.
 * @evidence contracts/common.md#meaningful-documentation States the ownership and the duplicate refusal.
 * @evidence contracts/modeling.md#part-identity-and-grouping Answers are keyed by named part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Resolved parts own their geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display the answers.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each region resolver owns its reasons.
 * @evidenceExclude contracts/anatomy.md#permitted-range Each region resolver owns its admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRegionPartResolver = (
  input: IAutoMovieHumanBodyRegionPartsInput,
) => readonly IAutoMovieHumanBodyPartResolution[];
