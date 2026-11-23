import type * as THREE from "three";

import type { IAutoMovieViewerSnapshot } from "./IAutoMovieViewerSnapshot.js";
import type { IAutoMovieViewerSnapshotOptions } from "./IAutoMovieViewerSnapshotOptions.js";
import type { IAutoMovieViewerSnapshotRenderer } from "./IAutoMovieViewerSnapshotRenderer.js";

/**
 * Render synchronously through the supplied original host and immediately
 * encode its canvas as an inline image. PNG is the default request; actual
 * canvas fallback, taint and empty-canvas behavior remain native. This
 * low-level readout does not independently establish native renderer identity,
 * current-source hardware readiness or valid nonblank pixels.
 */
export const captureViewerSnapshot: (
  renderer: IAutoMovieViewerSnapshotRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options?: IAutoMovieViewerSnapshotOptions,
) => IAutoMovieViewerSnapshot = (
  renderer: IAutoMovieViewerSnapshotRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: IAutoMovieViewerSnapshotOptions = {},
): IAutoMovieViewerSnapshot => {
  const mimeType: string = options.mimeType ?? "image/png";
  renderer.render(scene, camera);
  return {
    width: renderer.domElement.width,
    height: renderer.domElement.height,
    mimeType,
    dataUrl: renderer.domElement.toDataURL(mimeType, options.quality),
  };
};
