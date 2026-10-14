import type { AutoMovieHumanFaceCanthusDefinition } from "./AutoMovieHumanFaceCanthusDefinition";

/**
 * One eye's medial and lateral canthus definitions.
 *
 * @evidence contracts/common.md#principled-implementation readHumanFaceCanthus selects each named corner from final posed upper/lower margins by its registered axis extreme or fixed resident vertex definition.
 * @evidence contracts/common.md#clear-and-simple-design Two canonical definition fields keep anatomical corner identity separate from the containing side and margin surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing periocular/empty extreme rows produce a named gap rather than a guessed camera-space point; definition metadata alone does not certify clinical endocanthion/exocanthion acquisition.
 * @evidence contracts/common.md#meaningful-documentation Medial/lateral anatomical names delegate the exact source-versus-extreme strategy to the discriminated definition owner.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pair performs no extreme search or vertex read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable definitions create no performed-corner cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No posed margin or source buffer is retained by the record.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularCanthi {
  /** The medial canthus (endocanthion) definition. */
  medial: AutoMovieHumanFaceCanthusDefinition;

  /** The lateral canthus (exocanthion) definition. */
  lateral: AutoMovieHumanFaceCanthusDefinition;
}
