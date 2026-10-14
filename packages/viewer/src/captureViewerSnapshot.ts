import type * as THREE from "three";

import type { IAutoMovieViewerSnapshot } from "./IAutoMovieViewerSnapshot.js";
import type { IAutoMovieViewerSnapshotOptions } from "./IAutoMovieViewerSnapshotOptions.js";
import type { IAutoMovieViewerSnapshotRenderer } from "./IAutoMovieViewerSnapshotRenderer.js";

/**
 * Render synchronously through the supplied original host and immediately encode its canvas as an inline image. PNG is the default request; actual canvas fallback, taint and empty-canvas behavior remain native. This low-level readout does not independently establish native renderer identity, current-source hardware readiness or valid nonblank pixels.
 *
 * @evidence contracts/common.md#principled-implementation Defaults requested MIME to PNG, executes the original synchronous host draw and immediately reads its canvas extent/data URL with forwarded quality.
 * @evidence contracts/common.md#clear-and-simple-design A low-level structural host adapter separates original draw/encode from browser acquisition and stronger current-source/hardware/delivery gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native renderer replacement, fake pixels or image parse certifies this readout; encoder fallback/taint/empty-canvas failure remain native behavior and caller owns source/pixel admission.
 * @evidence contracts/common.md#meaningful-documentation Documents original draw-before-read, requested-versus-encoded MIME, borrowed host lifetime and absence of independent hardware/source verification.
 * @evidence contracts/performance.md#efficient-algorithms Coordinator reads are fixed around actual draw plus pixel/format-dependent synchronous encoding and proportional data-URL storage, with no duplicate image decode.
 * @evidence contracts/performance.md#reuse-equivalent-work Every requested snapshot executes its own original draw/encode effect; equal scene/camera/options do not establish unchanged pixels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The renderer/scene/camera remain borrowed and no browser/context is acquired; returned string belongs to the consumer, while native host shutdown stays with its original owner.
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
