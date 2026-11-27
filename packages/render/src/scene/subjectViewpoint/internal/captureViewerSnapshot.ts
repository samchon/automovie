import type * as THREE from "three";

import type { IAutoMovieRenderViewerSnapshot } from "../../IAutoMovieRenderViewerSnapshot";
import type { IAutoMovieRenderViewerSnapshotOptions } from "../../IAutoMovieRenderViewerSnapshotOptions";
import type { IAutoMovieRenderViewerSnapshotRenderer } from "../../IAutoMovieRenderViewerSnapshotRenderer";

/*
 * Render synchronously through the supplied original host and immediately
 * encode its canvas as an inline image. PNG is the default request; actual
 * canvas fallback, taint and empty-canvas behavior remain native. This
 * low-level readout does not independently establish native renderer identity,
 * current-source hardware readiness or valid nonblank pixels.
 */
export const captureViewerSnapshot: (
  renderer: IAutoMovieRenderViewerSnapshotRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options?: IAutoMovieRenderViewerSnapshotOptions,
) => IAutoMovieRenderViewerSnapshot = (
  renderer: IAutoMovieRenderViewerSnapshotRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: IAutoMovieRenderViewerSnapshotOptions = {},
): IAutoMovieRenderViewerSnapshot => {
  const mimeType: string = options.mimeType ?? "image/png";
  renderer.render(scene, camera);
  return {
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    mimeType,
    dataUrl: renderer.domElement.toDataURL(mimeType, options.quality),
  };
};
