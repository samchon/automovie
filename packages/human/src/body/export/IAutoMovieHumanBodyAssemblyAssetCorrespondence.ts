import type { IAutoMovieHumanStaticPartCorrespondence } from "../../common/export/IAutoMovieHumanStaticPartCorrespondence";
import type { IAutoMovieHumanBodyAssemblyQualification } from "./IAutoMovieHumanBodyAssemblyQualification";

/**
 * Actual generic primitive intervals with their coarse anatomical member accounts.
 *
 * @evidence contracts/common.md#principled-implementation Common Float32 accessor correspondence accompanies the exact source/native assembly member qualification admitted by the body reader.
 * @evidence contracts/common.md#clear-and-simple-design Geometry binding and anatomical provenance remain two explicit fields rather than duplicating source intervals in tissue metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coarse source/member correspondence does not establish authentic acquisition, clinical segmentation or personal tissue resolution.
 * @evidence contracts/common.md#meaningful-documentation The fields identify actual ordered primitive intervals and the separate registered-source rights/qualification account.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pair schema validates no accessor or assembly member at runtime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Correspondence typing implements no cache across mutable export primitives.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no GLB buffers, source resource or assembly task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAssemblyAssetCorrespondence {
  /** Ordered vertex/index intervals admitted against the actual Float32 primitive accessors. */
  geometry: IAutoMovieHumanStaticPartCorrespondence;

  /** Source rights and registered coarse tissue accounts joined to those exact member IDs. */
  qualification: IAutoMovieHumanBodyAssemblyQualification;
}
