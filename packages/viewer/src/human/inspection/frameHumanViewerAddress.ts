import type * as THREE from "three";

import { humanCaptureCameraPosition } from "@automovie/viewer/human/common/observation/humanCaptureCameraPosition";
import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { frameHumanViewerParts } from "./frameHumanViewerParts.js";

/**
 * Point the stage's camera where the address asks: around the named parts or
 * a zoomed whole, at an explicit frame, or along a named view; then an
 * explicit look, when given, replaces the camera position.
 *
 * @evidence contracts/common.md#principled-implementation Every framing is computed from the drawn group and the address, never from document names.
 * @evidence contracts/common.md#meaningful-documentation States the precedence of the framing forms.
 * @evidence contracts/common.md#clear-and-simple-design One dispatcher owns address framing precedence while existing geometry bounds and capture-camera placement own their respective calculations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Consumes exact part names, explicit frame/look values and observed geometry through existing camera APIs; no document-specific centre or camera answer is supplied.
 * @evidence contracts/modeling.md#part-identity-and-grouping Forwards the exact existing mesh names to the part-bound owner while selecting camera framing; it creates no alternative subject partition.
 * @evidence contracts/modeling.md#parameter-channels Named view/pitch, positive inverse-distance zoom, explicit sphere and exact look remain independent display channels with the documented exact-look precedence.
 * @evidenceExclude contracts/modeling.md#emitted-geometry This camera adapter emits no mesh primitives; the numerical model and calibration owners determine geometry populations.
 * @evidence contracts/modeling.md#spatial-conventions Sphere centers, radii, target and distance use the displayed scene's metre frame; angular look values use degrees and the existing capture-camera placement owns their conversion.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Camera placement constructs no surface or join and preserves all input mesh boundaries.
 * @evidence contracts/modeling.md#rendered-observation The adapter owns placement of the displayed camera, while the viewport and capture owners observe the resulting view; it makes no anatomical or whole-model appearance claim.
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
