import type * as THREE from "three";

/** One drawn object of a scene with the path a pattern selects it by. */
export interface IAutoMovieRenderInspectionPath {
  /**
   * Names from the scene down to the object, joined by `/`. Two objects can
   * share one path.
   */
  path: string;

  /** The drawn object, borrowed from the scene. */
  object: THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite;
}
