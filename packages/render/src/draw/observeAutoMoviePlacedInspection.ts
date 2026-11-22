import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * Read production diagnostics once from a settled scene and its delivery camera.
 *
 * Call after the outer seek is ready, before inspection changes the scene. The
 * subject's raster determines the delivery projection regardless of the review
 * view. The offscreen capture and delivery hosts supply the actual raster
 * audit context; the Viewer never does.
 *
 * @param subject Subject whose placement has completed.
 * @param seconds Film second at which the subject was placed.
 * @param mode Host that requested this observation.
 * @param auditRaster Optional offscreen renderer and sample factor for a capture or delivery.
 * @returns The producer's findings and coverage at the subject clock, or undefined when diagnostics are absent.
 * @throws {Error} If the producer returns another sample's time or frame.
 * @evidence contracts/development/common.md#meaningful-documentation Names the required placement, projection, optional audit context and return clock.
 * @evidence contracts/development/implementation.md#principled-implementation Refreshes current world transforms and the canonical delivery projection before reading the already placed scene. An output index is attached only when its scheduled second exactly equals the placed second.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the provider, prepare its placed inputs, call it once and verify its clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No second seek, review camera, mask, overlay or rounded frame index supplies evidence.
 * @evidence contracts/development/implementation.md#efficient-algorithms One world matrix update and one producer call for an opted-in subject. Ordinary subjects return immediately.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer reads the one scene and camera already placed by the current draw.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the subject and optional renderer for the call and retains only the returned data.
 */
export function observeAutoMoviePlacedInspection(
  subject: IAutoMovieDrawScene,
  seconds: number,
  mode: IAutoMovieDrawScene.IPlacedSample["mode"],
  auditRaster?: IAutoMovieDrawScene.IPlacedSample["auditRaster"],
): IAutoMovieInspectionDiagnostics | undefined {
  if (subject.inspectPlaced === undefined) return undefined;
  const { scene, camera, width, height, fps, durationSeconds } = subject;
  const aspect: number = width / height;
  if (camera.aspect !== aspect) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  scene.updateMatrixWorld();
  camera.updateWorldMatrix(true, false);

  const index: number = Math.round(seconds * fps);
  const outputFrame: number | undefined =
    Number.isSafeInteger(index) &&
    index >= 0 &&
    index / fps === seconds &&
    seconds < durationSeconds
      ? index
      : undefined;
  const time: IAutoMovieInspectionDiagnostics.ITime = {
    filmSeconds: seconds,
    ...(outputFrame === undefined ? {} : { outputFrame }),
  };
  const packet: IAutoMovieInspectionDiagnostics = subject.inspectPlaced({
    time,
    scene,
    camera,
    width,
    height,
    mode,
    ...(subject.place === undefined
      ? {}
      : {
          place: (at: number): void => {
            subject.place!(at);
            scene.updateMatrixWorld();
            camera.updateWorldMatrix(true, false);
          },
        }),
    ...(mode === "viewer" || auditRaster === undefined ? {} : { auditRaster }),
  });
  if (
    packet.time.filmSeconds !== time.filmSeconds ||
    (packet.time.outputFrame !== undefined &&
      packet.time.outputFrame !== outputFrame)
  )
    throw new Error(
      `Inspection diagnostics do not match the placed sample at ${seconds} s.`,
    );
  return outputFrame === undefined
    ? packet
    : { ...packet, time: { ...packet.time, outputFrame } };
}
