import type { IAutoMovieHumanPose } from "@automovie/human";
import type * as THREE from "three";

/**
 * Actual retained actor state entering the rescue; both feet address front-sole material points.
 * @evidence contracts/common.md#implementation-and-ownership The record carries actual placed root, clinical pose, right wrist, wand-tip direction and both actual forefoot witnesses from the accepted predecessor. It owns no fit or fabricated neutral reset.
 * @evidence contracts/common.md#authoring-interface Positions are world metres, yaw is radians and pose uses public Human clinical controls. Consumers must read these points from the accepted geometry/FK, not assume an old heel goal is a forefoot point.
 */
export interface DuelRescueEntry {
  position: THREE.Vector3;
  yaw: number;
  pose: IAutoMovieHumanPose;
  left: THREE.Vector3;
  right: THREE.Vector3;
  wrist: THREE.Vector3;
  wandTip: THREE.Vector3;
}

