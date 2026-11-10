import type * as THREE from "three";

/**
 * Input of `rasterizeAutoMovieScene`: the scene graph and camera to draw and
 * the raster to draw them into.
 *
 * The camera is read as it is: callers that want the raster's aspect set
 * `PerspectiveCamera.aspect` and update its projection first, as the Viewer
 * does when it sizes its canvas.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment states what is drawn and who owns the camera's aspect; each member states its unit, range and default.
 * @evidence contracts/development/design.md#principled-representation The scene and camera are the same three.js objects the Viewer renders, so a film's own `seek` places them once for either drawing path.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Raster size, the two objects, an optional fallback background and an optional supersampling factor; lighting and materials come from the scene itself.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member selects a film, figure or capture command.
 */
export interface IRasterizeAutoMovieSceneProps {
  /** Scene graph to draw; its visible meshes, lines, points and lights are read. */
  scene: THREE.Object3D;

  /** Perspective or orthographic camera whose projection and world matrix are used as they are. */
  camera: THREE.Camera;

  /** Output width in pixels, a positive integer. */
  width: number;

  /** Output height in pixels, a positive integer. */
  height: number;

  /** sRGB hex colour behind everything when the scene has no colour background; default `0x202020`. */
  background?: number;

  /** Samples per pixel along each axis, an integer from 1 to 4; default 1. */
  supersample?: number;
}
