import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

/**
 * Marks that share one frame, with the scene object that frame belongs to and the colour each is drawn in.
 *
 * @evidence contracts/development/design.md#principled-representation A mark's coordinates are in its anchor's local frame or in world space, so marks are grouped by the one object that carries their frame into the scene, `null` for world space. The colour is resolved per picture, so it travels beside the mark instead of replacing the mark's own default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `applyAutoMovieInspection` from selected marks and read by `buildAutoMovieInspectionMarks`; the anchor is borrowed from the scene.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The anchor is the resolved object, not its path, so two objects sharing a path cannot take each other's marks once resolved.
 * @evidence contracts/development/common.md#meaningful-documentation States what the set groups, what a null anchor means and why the colour travels beside each mark.
 */
export interface IAutoMovieInspectionMarkSet {
  /** The object whose local frame the marks' coordinates are in, or `null` for world coordinates. */
  anchor: THREE.Object3D | null;

  /** The marks with the sRGB hex colour each is drawn in, the flag colour already applied. */
  marks: { mark: IAutoMovieMark; color: number }[];
}
