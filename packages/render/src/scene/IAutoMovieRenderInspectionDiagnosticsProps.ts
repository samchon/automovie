import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";
import type * as THREE from "three";

/** What one review picture draws over the scene, and how it is drawn. */
export interface IAutoMovieRenderInspectionDiagnosticsProps {
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
