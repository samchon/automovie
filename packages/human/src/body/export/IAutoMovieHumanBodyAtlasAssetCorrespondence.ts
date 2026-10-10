import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAtlasQualification } from "./IAutoMovieHumanBodyAtlasQualification";

/**
 * Actual static accessor correspondence and acquired atlas qualification.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasAssetCorrespondence {
  /** Common source-member partition admitted against actual accessors. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Selected atlas source provenance, with personal anatomy unavailable. */
  qualification: IAutoMovieHumanBodyAtlasQualification;
}
