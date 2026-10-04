import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularQualification } from "./IAutoMovieHumanBodyArticularQualification";

/**
 * A source-ID partition with mathematical candidate qualification.
 * Reference provenance describes the report supplied by the inspector, never
 * a registered personal centre, clinical certification or a whole bone surface.
 * No requested context or editable anatomical document is restored from this.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the common interval owner and separates the candidate qualification from geometry identity.
 * @evidence contracts/common.md#clear-and-simple-design One readback combines two independently owned primitive namespaces.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tissue or held-out error is inferred from the target sphere.
 * @evidence contracts/common.md#meaningful-documentation States reference-only provenance and the unavailable whole anatomy.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularAssetCorrespondence {
  /** Actual primitive element binding admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Body-specific metadata, with no duplicate interval formula. */
  qualification: IAutoMovieHumanBodyArticularQualification;
}
