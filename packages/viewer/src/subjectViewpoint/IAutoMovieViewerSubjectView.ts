import type { IAutoMovieViewerSnapshot } from "../snapshot.js";
import type { IAutoMovieViewerSubject } from "./IAutoMovieViewerSubject.js";
import type { IAutoMovieViewerSubjectPose } from "./IAutoMovieViewerSubjectPose.js";

/**
 * One inspection observation: the subject, the pose it was seen from, and the
 * image that came back.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectView {
  /**
   * Subject that was looked at.
   */
  subject: IAutoMovieViewerSubject;

  /**
   * Planned viewpoint identity this pose came from, or `null` for a pose the
   * caller supplied directly.
   *
   * A `null` here is what separates a planned sample from an ad-hoc look, so a
   * coverage tally cannot silently count the latter as the former.
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
   * Always `false`, and typed as the literal so it can never be widened.
   *
   * The eye here is one the inspection chose, so the picture is evidence about
   * a thing and never about a delivered frame. A consumer that requires
   * delivery evidence cannot accept this record, and that refusal is
   * structural rather than a convention a caller may forget.
   */
  deliveryEvidence: false;
}
