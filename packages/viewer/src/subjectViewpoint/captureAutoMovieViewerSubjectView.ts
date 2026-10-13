import { captureViewerSnapshot } from "../snapshot.js";
import type { IAutoMovieViewerSubjectViewRequest } from "./IAutoMovieViewerSubjectViewRequest.js";
import type { IAutoMovieViewerSubjectView } from "./IAutoMovieViewerSubjectView.js";
import { applyAutoMovieViewerSubjectPose } from "./applyAutoMovieViewerSubjectPose.js";

/**
 * Pose in, image out, for one named subject.
 *
 * This is the call that makes the harness usable by something that cannot look
 * at a screen. An authoring agent names a subject and a pose and receives an
 * image; a reviewer names the same subject and the same pose and receives the
 * same image. That symmetry is the whole point, and the record it returns
 * carries the subject identity so a finding can travel as an id rather than as
 * a picture nobody can act on.
 *
 * The populations are resolved first and unconditionally. See
 * {@link IAutoMovieViewerSubjectViewRequest.resolveForCamera} for why that
 * argument is not optional.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-inspection-reach `captureAutoMovieViewerSubjectView` answers a named subject and a stated viewpoint with an observation artifact, which is what makes the instrument usable by a party that cannot look at a screen.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-inspection-reach Resolves a stable subject and viewpoint request into the actual viewer observation artifact.
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence `captureAutoMovieViewerSubjectView` produces one subject observation carrying the observed identity, the viewpoint it was taken from, and the artifact it produced.
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership `captureAutoMovieViewerSubjectView` renders through the inspection's own pose and marks the result as something no delivery review may consume.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-observation `captureAutoMovieViewerSubjectView` emits the subject observation record the inspection surface accumulates.
 * @author Samchon
 */
export const captureAutoMovieViewerSubjectView = (
  request: IAutoMovieViewerSubjectViewRequest,
): IAutoMovieViewerSubjectView => {
  applyAutoMovieViewerSubjectPose(request.camera, request.pose);
  request.resolveForCamera(request.camera, request.renderer.domElement.height);
  return {
    subject: request.subject,
    viewpoint: request.viewpoint ?? null,
    pose: request.pose,
    image: captureViewerSnapshot(
      request.renderer,
      request.scene,
      request.camera,
      request.snapshot,
    ),
    deliveryEvidence: false,
  };
};
