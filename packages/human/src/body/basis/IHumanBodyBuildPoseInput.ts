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
 * The document's coupled joint rows and shaped landmarks drive one pose
 * resolution over the compiled basis. A source capability whose anchors do
 * not depend on the pose may pass the already prepared rig; otherwise the
 * resolver builds it from the landmarks. Every input is read only.
 *
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
