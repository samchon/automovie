import type * as THREE from "three";

import { faceShapeFitView } from "../face-review/faceShapeFitCamera";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerStage } from "./HumanViewerStage";
import { frameHumanViewerParts } from "./frameHumanViewerParts";

/**
 * Point the stage's camera where the address asks: around the named parts or
 * a zoomed whole, at an explicit frame, or along a named view; then an
 * explicit look, when given, replaces the camera position.
 *
 * @evidence contracts/common.md#principled-implementation Every framing is computed from the drawn group and the address, never from document names.
 * @evidence contracts/common.md#meaningful-documentation States the precedence of the framing forms.
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
      position: faceShapeFitView(
        { yaw, pitch, distance, target: [x, y, z], fov },
        address.size,
      ).eye,
      target: [x, y, z],
      fov,
    });
  }
}
