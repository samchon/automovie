import type * as THREE from "three";

/**
 * A named display light and its immutable-by-convention studio position copy.
 * Direction edits preserve the light's original distance and numerical model.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Retains the existing named inspection-light state or direction request without altering the body document.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view The viewport remains the owner of direction validation, studio reset and shadow invalidation.
 * @author Samchon
 */
export interface IConnectedBodyInspectionLight {
  /** The existing scene light whose position is updated. */
  light: THREE.DirectionalLight;
  /** Independently copied original position, in display metres. */
  rest: THREE.Vector3;
}
