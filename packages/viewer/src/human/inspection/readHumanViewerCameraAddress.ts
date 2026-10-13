import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * Retain the actual display camera after an orbit gesture, so bookmarks and
 * source replacement restore the screen the user saw. Spherical angles use
 * +Y up and azimuth from +Z toward +X; distances and target are metres.
 *
 * @evidence contracts/common.md#principled-implementation Spherical coordinates are derived from the displayed camera and target rather than the requested view label.
 * @evidence contracts/common.md#clear-and-simple-design One conversion supplies actual orbit state to display serialization.
 * @evidence contracts/common.md#meaningful-documentation States axes, units and the bookmark consequence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Converts the actual observed camera/target into a copied address; requested view names and default poses do not stand in for the user's displayed orbit.
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
