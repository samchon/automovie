import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * Inputs of `resolveHumanBodyBuildPose`.
 *
 * The document's coupled joint rows and shaped landmarks drive one pose resolution over the compiled basis. A source capability whose anchors do not depend on the pose may pass the already prepared rig; otherwise the resolver builds it from the landmarks. Every input is read only.
 *
 * @evidence contracts/common.md#principled-implementation Admitted document, coupled rows and shaped landmarks provide one pose's dependencies; an optional already prepared rig is valid only for pose-independent source anchors.
 * @evidence contracts/common.md#clear-and-simple-design One internal input separates borrowed source/document context from pose output and names the pre-pelvis preparation phase explicitly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prepared rigs cannot stand in for changed pose-dependent anchors and pre-pelvis preparation cannot masquerade as final performance.
 * @evidence contracts/common.md#meaningful-documentation Members explain compiled-basis ownership, admitted rows, meter landmarks, prepared-rig premise and phase omission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pose input typing performs no landmark-dependent rest-rig construction or joint solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The optional rig describes permissible reuse; resolveHumanBodyBuildPose owns actual equivalence and evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed pose inputs acquire no transform-map lifetime or anatomical FK resource.
 * @author Samchon
 */
export interface IHumanBodyBuildPoseInput {
  /** Compiled basis owning joints, ranges and couplings. */
  basis: IAutoMovieHumanBodyBasis;

  /** Admitted document being posed. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Coupled joint rows of the document. */
  poseRows: IAutoMovieJointPose[];

  /** Shaped landmarks of the document, by name, in metres. */
  landmarks: Record<string, IAutoMovieVector3>;

  /** Shared prepared rig for a source capability with pose-independent anchors. */
  rig?: IAutoMovieHumanBodySkeletonRig;

  /** Internal reference preparation omits the pelvis turn; final performance omits this field. */
  phase?: "pre-pelvis";
}
