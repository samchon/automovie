import type {
  AutoMovieSoftAnalysisStatus,
  IAutoMovieSoftBodySurface,
} from "@automovie/interface";
import type * as THREE from "three";

/*
 * Canonical surface and its actual analysis outcome for one cloth projection.
 */
export interface IBuildSoftBodyObjectProps {
  /*
   * Surface emitted by the Engine, including its drawn-panel bounds.
   */
  surface: IAutoMovieSoftBodySurface;

  /*
   * Borrowed material; absent input creates the existing double-sided default.
   */
  material?: THREE.Material;

  /*
   * Actual producer outcome, required without a solved-state default.
   */
  status: AutoMovieSoftAnalysisStatus;
}
