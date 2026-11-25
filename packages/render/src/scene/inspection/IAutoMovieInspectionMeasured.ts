import type { IAutoMovieMark } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Marks the inspection measured on one scene object, with the call that moves
 * them to the object's current pose.
 */
export interface IAutoMovieInspectionMeasured {
  /**
   * The object the marks were measured on, whose local frame their coordinates
   * are in.
   */
  anchor: THREE.Object3D;

  /** The marks, in the anchor's local frame. */
  marks: IAutoMovieMark[];

  /**
   * Rewrite the marks' coordinates in place from the anchor's current pose.
   * Call it after the scene's time or pose changes and before the marks are
   * drawn.
   */
  refresh: () => void;
}
