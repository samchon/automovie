import type {
  IAutoMovieInspectionRequest,
  IAutoMovieMark,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";

/**
 * The built scene, request, and inputs supplied by the subject and renderer for
 * `applyAutoMovieInspection`.
 */
export interface IApplyAutoMovieInspectionProps {
  /**
   * The scene to inspect. It is changed in place and put back by the handle's
   * `restore`.
   */
  scene: THREE.Scene;

  /** What to show, as `parseAutoMovieInspectionRequest` returns it. */
  request: IAutoMovieInspectionRequest;

  /**
   * Mark geometry and styles supplied by the scene's owners for its current
   * state. Absent when the frame supplies none.
   */
  marks?: readonly IAutoMovieMark[];

  /**
   * Kind names the subject declares for its lifetime. Admission also includes
   * supplied and measured kinds. Current marks provide geometry and styles.
   */
  markKinds?: readonly string[];

  /**
   * The WebGL renderer drawing the scene, whose local clipping a section needs
   * switched on. Absent, a section sets the planes on the materials and a
   * renderer must have local clipping on to honour them.
   */
  renderer?: IAutoMovieSectionRenderer;
}
