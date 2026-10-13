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
