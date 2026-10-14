import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Actual static accessor correspondence and acquired atlas qualification.
 *
 * @evidence contracts/common.md#principled-implementation Common actual source-part intervals accompany the selected atlas receipts and reference registration admitted by the atlas reader.
 * @evidence contracts/common.md#clear-and-simple-design Geometry correspondence and atlas-specific qualification stay separate in one read result without repeating accessor interval formulas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching an atlas receipt to an accessor interval establishes neither source authenticity nor personal anatomical resolution.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish resident primitive binding from acquired reference provenance and unavailable personal anatomy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The atlas pair schema performs no source filtering or accessor validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type implements no cache across mutable primitive reads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This read-result schema acquires no atlas source, accessor buffer or export task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasAssetCorrespondence {
  /** Common source-member partition admitted against actual accessors. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Selected atlas source provenance, with personal anatomy unavailable. */
  qualification: IAutoMovieHumanBodyAtlasQualification;
}
