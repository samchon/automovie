import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";

/**
 * Retain the actual display camera after an orbit gesture, so bookmarks and source replacement restore the screen the user saw. Spherical angles use +Y up and azimuth from +Z toward +X; distances and target are metres.
 *
 * @evidence contracts/common.md#principled-implementation Actual stage camera position/target/fov are projected to Y-up spherical look coordinates with metre distances.
 * @evidence contracts/common.md#clear-and-simple-design One observed camera and relative-position tuple extend the existing address without treating requested coordinates as output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Orbit changes are read from stage state and the original requested fields remain separate from the new observed look.
 * @evidence contracts/common.md#meaningful-documentation The comment defines azimuth/up direction and distance/target units used in bookmark restoration.
 * @evidence contracts/performance.md#efficient-algorithms Three offsets, hypot and angular conversion require fixed arithmetic rather than a geometry traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Unaffected address fields are shared while a fresh actual camera reading replaces any earlier bookmark look.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The borrowed stage/address acquire no orbit listener or camera lifetime; only the returned look tuple remains.
 */
export function readHumanViewerCameraAddress(
  address: HumanViewerAddress,
  stage: HumanViewerStage,
): HumanViewerAddress {
  const camera: ReturnType<HumanViewerStage["observe"]["camera"]> = stage.observe.camera();
  const [x, y, z]: number[] = camera.position.map((value: number, axis: number): number => value - camera.target[axis]);
  const distance: number = Math.hypot(x, y, z);
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
