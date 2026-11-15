import type * as THREE from "three";

/** One archetype's card as the object gallery draws it on the page's shared renderer. */
export interface IGalleryCard {
  /** What to draw. */
  scene: THREE.Scene;

  /** The camera, framed on the model. */
  camera: THREE.PerspectiveCamera;

  /**
   * Turn the model about the vertical.
   *
   * @param radians The heading.
   */
  turn(radians: number): void;

  /** Release the model's geometry and materials. */
  dispose(): void;
}
