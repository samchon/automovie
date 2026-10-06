import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Actual static accessor correspondence and acquired atlas qualification.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the common actual accessor partition and preserves independently qualified atlas provenance.
 * @evidence contracts/common.md#clear-and-simple-design Two owned records are returned together.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A readback carrier.
 * @evidence contracts/common.md#meaningful-documentation Names the distinct geometry and provenance authorities.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasAssetCorrespondence {
  /** Common source-member partition admitted against actual accessors. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Selected atlas source provenance, with personal anatomy unavailable. */
  qualification: IAutoMovieHumanBodyAtlasQualification;
}
