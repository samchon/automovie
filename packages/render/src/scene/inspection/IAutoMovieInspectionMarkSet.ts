import type { IAutoMovieMark } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Marks that share one frame, with the scene object that frame belongs to and
 * the colour each is drawn in.
 */
export interface IAutoMovieInspectionMarkSet {
  /**
   * The object whose local frame the marks' coordinates are in, or `null` for
   * world coordinates.
   */
  anchor: THREE.Object3D | null;

  /**
   * The marks with the sRGB hex colour each is drawn in, the flag colour
   * already applied.
   */
  marks: { mark: IAutoMovieMark; color: number }[];
}
