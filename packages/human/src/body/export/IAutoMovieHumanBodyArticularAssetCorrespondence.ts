import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyArticularQualification } from "./IAutoMovieHumanBodyArticularQualification";

/**
 * A source-ID partition with mathematical candidate qualification.
 * Reference provenance describes the inspector's report, without a registered personal centre, clinical certification or whole bone surface. Requested context and editable anatomical documents are not restored from this record.
 *
 * @evidence contracts/common.md#principled-implementation Common actual primitive intervals accompany the body inspector's articular candidate qualification rather than duplicating accessor binding mathematics.
 * @evidence contracts/common.md#clear-and-simple-design The reader returns one geometry/qualification pair for consumers inspecting a carrying primitive.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate metadata cannot reconstruct personal centres, whole bones or editable anatomical documents and supplies no clinical certification.
 * @evidence contracts/common.md#meaningful-documentation Members identify actual primitive binding and candidate-specific qualification, with provenance and restoration limits stated above.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Correspondence typing performs no accessor validation or candidate construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pair schema declares no cache for repeated reads of mutable primitive metadata.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type owns no accessor buffers, export writer or inspection task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyArticularAssetCorrespondence {
  /** Actual primitive element binding admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Body-specific metadata, with no duplicate interval formula. */
  qualification: IAutoMovieHumanBodyArticularQualification;
}
