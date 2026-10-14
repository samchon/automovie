import type { IAutoMovieViewerSnapshot } from "../IAutoMovieViewerSnapshot.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * Metadata and encoded image returned by one inspection capture, explicitly marked outside delivery-frame evidence. Identity, pose and revision are supplied labels, not independently verified source correspondence.
 *
 * @evidence contracts/common.md#principled-implementation Carries subject, nullable plan id, pose and snapshot together; literal false prevents assignment to a delivery-evidence true contract without a type escape.
 * @evidence contracts/common.md#clear-and-simple-design Uses the existing snapshot representation rather than introducing another image or delivery artifact format.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A returned image does not certify current source, visible subject, hardware rendering or anatomical validity; those require actual observation.
 * @evidence contracts/common.md#meaningful-documentation Documents planned versus ad-hoc identity and the structural delivery-evidence boundary.
 * @evidence contracts/performance.md#efficient-algorithms This shape chooses no rendering strategy; synchronous draw/encoding and image-sized storage belong to the capture operation.
 * @evidence contracts/performance.md#reuse-equivalent-work Subject and pose references are borrowed and can be mutated later; the returned record is not an immutable provenance snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The consumer retains the encoded data URL and borrowed metadata references; the shape owns no browser or GPU lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectView {
  /**
   * Supplied subject label; capture does not resolve this identity against the scene.
   */
  subject: IAutoMovieViewerSubject;

  /**
   * Planned viewpoint identity this pose came from, or `null` for a pose the caller supplied directly.
   *
   * A `null` here is what separates a planned sample from an ad-hoc look, so a coverage tally cannot silently count the latter as the former.
   */
  viewpoint: string | null;

  /**
   * Pose the image was rendered from.
   */
  pose: IAutoMovieViewerSubjectPose;

  /**
   * Image the renderer returned for that pose.
   */
  image: IAutoMovieViewerSnapshot;

  /**
   * Literal `false` in this record's contract.
   *
   * Inspection chooses the pose independently of authored delivery. A consumer requiring literal `true` cannot accept this record without bypassing its type contract.
   */
  deliveryEvidence: false;
}
