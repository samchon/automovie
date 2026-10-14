import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanFaceOralExportQualification } from "./IAutoMovieHumanFaceOralExportQualification";

/** Exact actual static geometry intervals and separate coarse oral qualification.
 *
 * @evidence contracts/common.md#principled-implementation Actual static primitive intervals admitted by the common reader and separately admitted oral qualification describe the same carrying asset; source-id binding is not source authenticity, anatomy or editable reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design Geometry and coarse source/clinical limits remain distinct canonical records rather than duplicated interval fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing qualification stays an unqualified legacy asset; metadata cannot manufacture source geometry or clinical validity.
 * @evidence contracts/common.md#meaningful-documentation Prose/members distinguish actual element-bound geometry from original source rights and clinical limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no accessor scan or qualification admission; the actual primitive reader owns both.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Canonical type composition creates no mutable primitive cache or equivalence key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader/caller owns cloned records; this declaration acquires no asset or IO handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralAssetCorrespondence {
  /** Accessor-bound generic source members, admitted by the common reader. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Original source rights/clinical limits, without reconstructing edit fields. */
  qualification: IAutoMovieHumanFaceOralExportQualification;
}
