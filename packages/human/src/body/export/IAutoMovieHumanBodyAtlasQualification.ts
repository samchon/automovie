import type { IAutoMovieHumanBodyAtlasPartQualification } from "./IAutoMovieHumanBodyAtlasPartQualification";

/**
 * Atlas inspection metadata joined to actual static geometry by source IDs.
 *
 * Selected atlas members carry this namespace; ordinary skin, clothing and face parts carry no atlas claim. Editable documents are saved separately.
 *
 * @evidence contracts/common.md#principled-implementation The versioned reference-atlas-inspection namespace carries selected source receipts in the actual primitive's member order.
 * @evidence contracts/common.md#clear-and-simple-design Atlas qualification stays beside generic source intervals while editable body documents retain their own serialization boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary skin/clothing/face members cannot acquire atlas claims, and reference replay is not a population estimator or clinical certificate.
 * @evidence contracts/common.md#meaningful-documentation Members give namespace version, reference-only qualification and ordered selected-part semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Atlas namespace typing performs no receipt matching, accessor inspection or population estimation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The namespace schema chooses no cross-export receipt cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type itself acquires no source resources, primitive writer or task.
 *
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
