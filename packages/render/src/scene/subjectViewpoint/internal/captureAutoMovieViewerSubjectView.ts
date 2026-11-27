import { captureViewerSnapshot } from "./captureViewerSnapshot.js";
import type { IAutoMovieViewerSubjectView } from "../../IAutoMovieViewerSubjectView.js";
import type { IAutoMovieViewerSubjectViewRequest } from "../../IAutoMovieViewerSubjectViewRequest.js";
import { applyAutoMovieViewerSubjectPose } from "./applyAutoMovieViewerSubjectPose.js";

/*
 * Apply pose, resolve populations, then synchronously draw/encode one
 * inspection image. Subject and pose are supplied labels and borrowed
 * references; equal labels do not guarantee equal scene pixels, source
 * freshness or actual hardware readiness.
 */
export function captureAutoMovieViewerSubjectView(
  request: IAutoMovieViewerSubjectViewRequest,
): IAutoMovieViewerSubjectView {
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
}
