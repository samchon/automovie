import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { IAutoMovieDrawScene } from "../IAutoMovieDrawScene.js";

/*
 * Read production diagnostics once from a settled scene and its delivery
 * camera.
 *
 * Call after the outer seek is ready, before inspection changes the scene. The
 * subject's raster determines the delivery projection regardless of the review
 * view. The offscreen capture and delivery hosts supply the actual raster audit
 * context; the Viewer never does.
 *
 * The sample offers the subject's synchronous `place` only when the placement
 * was its film-clock `seek`. A transition's outgoing shot placed by `seekShot`
 * lies on a clock `place` cannot reach, so its sample offers none, and a check
 * that would place other seconds and the drawn one again leaves the shot as
 * placed instead of putting the live entry there.
 * Parameter subject: Subject whose placement has completed.
 * Parameter seconds: Film second at which the subject was placed.
 * Parameter mode: Host that requested this observation.
 * Parameter auditRaster: Optional offscreen renderer and sample factor for a
 * capture or delivery.
 * Parameter byShot: Whether the subject was placed by `seekShot`; absent or false
 * for `seek`.
 * Returns: The producer's findings and coverage at the subject clock, or
 * undefined when diagnostics are absent.
 * If the producer returns another sample's time or frame.
 */
export function observeAutoMoviePlacedInspection(
  subject: IAutoMovieDrawScene,
  seconds: number,
  mode: IAutoMovieDrawScene.IPlacedSample["mode"],
  auditRaster?: IAutoMovieDrawScene.IPlacedSample["auditRaster"],
  byShot: boolean = false,
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
    index >= 0 && index / fps === seconds && seconds < durationSeconds
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
    ...(subject.place === undefined || byShot
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
