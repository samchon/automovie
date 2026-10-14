import { humanCaptureCameraPosition } from "@automovie/viewer/human/common/observation/humanCaptureCameraPosition";
import type * as THREE from "three";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";
import type { HumanViewerStage } from "./HumanViewerStage.js";
import { frameHumanViewerParts } from "./frameHumanViewerParts.js";

/**
 * Point the stage's camera where the address asks: around the named parts or a zoomed whole, at an explicit frame, or along a named view; then an explicit look, when given, replaces the camera position.
 *
 * @evidence contracts/common.md#principled-implementation Address selection chooses resident part bounds, whole named view or an explicit frame, then the canonical camera-position helper applies an explicit look override.
 * @evidence contracts/common.md#clear-and-simple-design Three frame/view branches followed by one optional look branch delegate actual camera mutation to the observation stage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Framing uses resident geometry without changing the numerical document, and explicit look remains a supplied camera request rather than an observed output reading.
 * @evidence contracts/common.md#meaningful-documentation The comment states framing precedence and the final explicit-look camera override.
 * @evidence contracts/performance.md#efficient-algorithms Selected-part or zoomed-whole framing delegates current mesh-subtree bounds, and an ordinary named view delegates current root bounds to observation; only an explicit sphere avoids geometry traversal before fixed camera conversion. Overlapping selected subtrees can repeat vertex visits in the delegated part owner.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A camera request is an owned stage effect and is not skipped because another address once used equal coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Stage/group/address are borrowed and only temporary frame tuples are created; the existing stage owns camera and viewport lifetime.
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
    const box: ReturnType<typeof frameHumanViewerParts> = frameHumanViewerParts(
      group,
      address.parts,
    );
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
    const [yaw, pitch, distance, x, y, z, fov]: NonNullable<
      HumanViewerAddress["look"]
    > = address.look;
    stage.observe.look({
      position: humanCaptureCameraPosition({
        yaw,
        pitch,
        distance,
        target: [x, y, z],
        fov,
      }),
      target: [x, y, z],
      fov,
    });
  }
}
