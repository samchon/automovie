import type { IAutoMovieRenderViewerSnapshot } from "./IAutoMovieRenderViewerSnapshot";
import type { IAutoMovieRenderViewerSubject } from "./IAutoMovieRenderViewerSubject";
import type { IAutoMovieRenderViewerSubjectPose } from "./IAutoMovieRenderViewerSubjectPose";

/**
 * Metadata and encoded image returned by one inspection capture, explicitly
 * marked outside delivery-frame evidence. Identity, pose and revision are
 * supplied labels, not independently verified source correspondence.
 */
export interface IAutoMovieRenderViewerSubjectView {
  /**
   * Supplied subject label; capture does not resolve this identity against the
   * scene.
   */
  subject: IAutoMovieRenderViewerSubject;

  /**
   * Planned viewpoint identity this pose came from, or `null` for a pose the
   * caller supplied directly.
   *
   * A `null` here is what separates a planned sample from an ad-hoc look, so a
   * coverage tally cannot silently count the latter as the former.
   */
  viewpoint: string | null;

  /** Pose the image was rendered from. */
  pose: IAutoMovieRenderViewerSubjectPose;

  /** Image the renderer returned for that pose. */
  image: IAutoMovieRenderViewerSnapshot;

  /**
   * Literal `false` in this record's contract.
   *
   * Inspection chooses the pose independently of authored delivery. A consumer
   * requiring literal `true` cannot accept this record without bypassing its
   * type contract.
   */
  deliveryEvidence: false;
}
