import { captureViewerSnapshot } from "../captureViewerSnapshot.js";
import type { IAutoMovieViewerSubjectView } from "./IAutoMovieViewerSubjectView.js";
import type { IAutoMovieViewerSubjectViewRequest } from "./IAutoMovieViewerSubjectViewRequest.js";
import { applyAutoMovieViewerSubjectPose } from "./applyAutoMovieViewerSubjectPose.js";

/**
 * Apply pose, resolve populations, then synchronously draw/encode one inspection image. Subject and pose are supplied labels and borrowed references; equal labels do not guarantee equal scene pixels, source freshness or actual hardware readiness.
 *
 * @evidence contracts/common.md#principled-implementation Orders native camera update before the required population callback and existing snapshot draw/encoding; caller owns an admitted pose, matching renderer/canvas and valid scene realization.
 * @evidence contracts/common.md#clear-and-simple-design Coordinates existing pose and snapshot owners without adding another render or provenance service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Literal deliveryEvidence=false distinguishes inspection from authored delivery; it neither resolves subject existence nor certifies pixels, and callback/draw failures propagate without rollback.
 * @evidence contracts/common.md#meaningful-documentation States ordering, label/reference limits, delivery distinction and retained camera/population mutation on failure.
 * @evidence contracts/performance.md#efficient-algorithms Cost is camera update plus actual population resolution, native draw and image-sized encoding; record assembly is fixed apart from the encoded snapshot.
 * @evidence contracts/performance.md#reuse-equivalent-work Every request executes its own mutable resolution/draw; equivalent subject/pose text cannot replace current scene, source, renderer and callback effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows scene/camera/renderer and transfers the encoded string to its caller; no browser/worker is acquired and the owner retains/retires all native resources.
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
