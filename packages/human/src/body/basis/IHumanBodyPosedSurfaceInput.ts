import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { skinHumanBodySurface } from "./skinHumanBodySurface";

/**
 * The actual shaped skin, bone transforms and matching rest/lean suppliers for one performed surface. No source or document is mutated.
 *
 * @evidence contracts/common.md#principled-implementation Carries shaped positions, transform map, rest positions and lean/document suppliers, preserving the original performed-surface input.
 * @evidence contracts/common.md#clear-and-simple-design This named record owns only the original performed-surface input; computations remain at the existing consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The optional rest array stays null when its evaluation is inactive; the lean callback belongs to the same document and source as shaped positions and transforms.
 * @evidence contracts/common.md#meaningful-documentation Native field documentation names the retained members, their ownership and unchanged source meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The source and consuming builder own the represented parts; this record transports their existing registration/evaluation.
 * @evidence contracts/modeling.md#parameter-channels The document retains its named authoring channels; source-order arrays and bone transforms are internal evaluation data rather than personal sculpting inputs.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The existing geometry/appearance consumer owns emitted populations.
 * @evidence contracts/modeling.md#spatial-conventions Shaped, rest and lean positions are XYZ metres in the body basis frame; transforms carry world rest/posed metre positions and unit quaternions in that same frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source and assembly owners retain actual boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming source/assembly owner observes the result.
 * @evidence contracts/anatomy.md#anatomical-source The shaped/rest/lean suppliers preserve the compiled skin and its conventional pose/sag qualification; their difference is not an independently acquired internal tissue measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing source/document admission remains authoritative; this carrier changes no value or bound.
 * @evidence contracts/anatomy.md#parametric-authority The document retains its named authoring channels; source-order arrays and bone transforms are internal evaluation data rather than personal sculpting inputs.
 * @author Samchon
 */
export interface IHumanBodyPosedSurfaceInput {
  /** Shaped source positions, metres. */
  shaped: number[];

  /** Existing rest-to-posed transform map. */
  transforms: Parameters<typeof skinHumanBodySurface>[3];

  /** Matching document-rest positions, or null when filtering/sag is inactive. */
  rest: number[] | null;

  /** Lazily evaluate the matching lean shape. */
  lean: () => number[];

  /** Existing admitted numerical document. */
  document: IAutoMovieHumanBodyBasisDocument;
}
