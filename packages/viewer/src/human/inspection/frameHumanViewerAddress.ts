import type * as THREE from "three";

import { humanCaptureCameraPosition } from "@automovie/viewer/human/common/observation/humanCaptureCameraPosition";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { frameHumanViewerParts } from "./frameHumanViewerParts.js";

/**
 * Point the stage's camera where the address asks: around the named parts or
 * a zoomed whole, at an explicit frame, or along a named view; then an
 * explicit look, when given, replaces the camera position.
 */
export function frameHumanViewerAddress(
  stage: HumanViewerStage,
  group: THREE.Group,
  address: HumanViewerAddress,
): void {
  if (
    address.frame === null &&
    (address.parts.length !== 0 || address.zoom !== 1)
  ) {
    const box = frameHumanViewerParts(group, address.parts);
    stage.observe.frame({
      center: box.center,
      radius: box.radius / address.zoom,
      view: address.view,
      pitch: address.pitch,
    });
  } else if (address.frame === null)
    stage.observe.view(address.view, { pitch: address.pitch });
  else
    stage.observe.frame({
      center: address.frame.slice(0, 3) as [number, number, number],
      radius: address.frame[3] / address.zoom,
      view: address.view,
      pitch: address.pitch,
    });
  if (address.look !== null) {
    const [yaw, pitch, distance, x, y, z, fov] = address.look;
    stage.observe.look({
      position: humanCaptureCameraPosition(
        { yaw, pitch, distance, target: [x, y, z], fov },
      ),
      target: [x, y, z],
      fov,
    });
  }
}
