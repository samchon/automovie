import type { IAutoMovieHumanBodyAtlasPartQualification } from "./IAutoMovieHumanBodyAtlasPartQualification";

/**
 * Atlas inspection metadata joined to actual static geometry by source IDs.
 *
 * Only selected atlas members carry this namespace; ordinary skin, clothing
 * and face parts carry no atlas claim. Editable documents are saved separately.
 *
 * @evidence contracts/common.md#principled-implementation A separate versioned atlas namespace retains provenance without reinterpreting articular target-sphere metadata.
 * @evidence contracts/common.md#clear-and-simple-design One ordered part population supplies whole-export and per-primitive qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source receipt is reference-only and no document or clinical validation is reconstructed.
 * @evidence contracts/common.md#meaningful-documentation Names selected-member scope and separate document authority.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasQualification {
  /** Atlas namespace version, independent of generic interval metadata. */
  version: 1;

  /** Reference replay is not a population estimator or clinical certificate. */
  qualification: "reference-atlas-inspection";

  /** Selected source members in their primitive's actual member order. */
  parts: IAutoMovieHumanBodyAtlasPartQualification[];
}
