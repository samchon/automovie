import type * as THREE from "three";

/**
 * A named display light and its immutable-by-convention studio position copy.
 * Direction edits preserve the light's original distance and numerical model.
 *
 * @author Samchon
 */
export interface IConnectedBodyInspectionLight {
  /** The existing scene light whose position is updated. */
  light: THREE.DirectionalLight;

  /** Independently copied original position, in display metres. */
  rest: THREE.Vector3;
}
