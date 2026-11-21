import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type * as THREE from "three";

/**
 * What one review picture draws over the scene, and how it is drawn.
 *
 * @evidence contracts/development/design.md#principled-representation The scene, the placed diagnostics, the caller's render and the drawn raster and stroke.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what the overlay needs to place and draw its cubes once.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent diagnostics draw the scene alone.
 * @evidence contracts/development/common.md#meaningful-documentation Names each member.
 */
export interface IRenderAutoMovieInspectionDiagnosticsProps {
  /** The scene the cubes are attached to while it renders. */
  scene: THREE.Scene;

  /** The placed sample's diagnostics, or undefined to draw no witness. */
  diagnostics: IAutoMovieInspectionDiagnostics | undefined;

  /** Render the scene once, through the caller's camera and target. */
  render: () => void;

  /** Drawn raster width in pixels. */
  width: number;

  /** Drawn raster height in pixels. */
  height: number;

  /** Stroke width in drawn pixels. */
  stroke: number;
}
