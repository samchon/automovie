import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * Retain the actual display camera after an orbit gesture, so bookmarks and
 * source replacement restore the screen the user saw. Spherical angles use
 * +Y up and azimuth from +Z toward +X; distances and target are metres.
 */
export function readHumanViewerCameraAddress(
  address: HumanViewerAddress,
  stage: HumanViewerStage,
): HumanViewerAddress {
  const camera = stage.observe.camera();
  const [x, y, z] = camera.position.map((value, axis) => value - camera.target[axis]);
  const distance = Math.hypot(x, y, z);
  return {
    ...address,
    look: [
      Math.atan2(x, z) * 180 / Math.PI,
      Math.atan2(y, Math.hypot(x, z)) * 180 / Math.PI,
      distance,
      ...camera.target,
      camera.fov,
    ],
  };
}
