import type * as THREE from "three";

/**
 * One drawn object of a scene with the path a pattern selects it by.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs the object three.js draws with its path in the scene graph, the one identity both a selection pattern and a printed listing use.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; counts and bounds are read from the object when a caller wants them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The object is borrowed from the scene, not copied or wrapped, so a selection acts on what is drawn.
 * @evidence contracts/development/common.md#meaningful-documentation States what the path is made of, that paths can repeat and who owns the object.
 */
export interface IAutoMovieInspectionPath {
  /**
   * Names from the scene down to the object, joined by `/`. Two objects can share one path.
   */
  path: string;

  /**
   * The drawn object, borrowed from the scene.
   */
  object: THREE.Mesh | THREE.Line | THREE.Points | THREE.Sprite;
}
