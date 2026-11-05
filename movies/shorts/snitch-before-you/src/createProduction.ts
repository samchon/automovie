import * as THREE from "three";
import { createFlightScene } from "./createFlightScene";

/**
 * Create the current Human polygon motion scene through its actual shot owner.
 *
 * @evidence contracts/common.md#implementation-and-ownership Delegates the complete sixty-second scene, Human pose/contact evaluation and camera to createFlightScene; Viewer owns display and Render owns capture. Actual encoded delivery and its observation limits belong to the retained output receipts, not this constructor.
 * @evidence contracts/common.md#authoring-interface Returns the scene, portrait camera, exact-time seek and resource disposal. Seconds use the shared production clock; the current implemented range is recorded by the scene's diagnostics.
 */
export function createProduction(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  seek: (seconds: number) => void;
  dispose: () => void;
} {
  return createFlightScene();
}
