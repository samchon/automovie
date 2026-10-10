import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularQualification } from "./IAutoMovieHumanBodyArticularQualification";

/**
 * A source-ID partition with mathematical candidate qualification.
 * Reference provenance describes the report supplied by the inspector, never
 * a registered personal centre, clinical certification or a whole bone surface.
 * No requested context or editable anatomical document is restored from this.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularAssetCorrespondence {
  /** Actual primitive element binding admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Body-specific metadata, with no duplicate interval formula. */
  qualification: IAutoMovieHumanBodyArticularQualification;
}
