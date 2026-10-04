import type { IAutoMovieJointPose, IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * Inputs of `resolveHumanBodyBuildPose`.
 *
 * The document's coupled joint rows and shaped landmarks drive one pose
 * resolution over the compiled basis. A source capability whose anchors do
 * not depend on the pose may pass the already prepared rig; otherwise the
 * resolver builds it from the landmarks. Every input is read only.
 *
 * @evidence contracts/common.md#principled-implementation One resolution consumes the document, its coupled rows and shaped landmarks; a shared rig is reused only when its anchors are pose-independent.
 * @evidence contracts/common.md#clear-and-simple-design One named record replaces the resolver's anonymous input type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input is changed and the optional rig never substitutes another document's anchors.
 * @evidence contracts/common.md#meaningful-documentation States each field's role, the optional rig condition and read-only use.
 * @evidence contracts/modeling.md#spatial-conventions Landmarks are metres in the Y-up body frame; joint rows are degrees.
 * @evidence contracts/modeling.md#parameter-channels The joint rows are the document's coupled clinical channels the resolver admits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input names existing bones and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The input builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder observes the posed body.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input carries document values whose sources the basis declares.
 * @evidenceExclude contracts/anatomy.md#permitted-range The resolver judges ranges against the basis.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal resolution input derived from an admitted document.
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
  rig?: ReturnType<typeof resolveHumanBodySkeleton>;
}
