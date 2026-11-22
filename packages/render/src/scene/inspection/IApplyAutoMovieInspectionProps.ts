import type {
  IAutoMovieInspectionRequest,
  IAutoMovieMark,
} from "@automovie/interface";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";

/**
 * The built scene, request, and inputs supplied by the subject and renderer for `applyAutoMovieInspection`.
 *
 * @evidence contracts/development/design.md#principled-representation A built scene and request define a picture. Supplied marks contain the current frame's geometry, lifetime kind declarations admit selection independent of that geometry, and the renderer supplies the optional clipping switch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The subject supplies mark geometry and its declaration, the builder owns the scene, the parser owns the request and the renderer owns its clipping switch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A handle may serve multiple views/frames only while its concrete inspected objects remain. Marks on those objects update through the handle; replacing the object graph requires restoring it and applying a new inspection.
 * @evidence contracts/development/common.md#meaningful-documentation Each member states who supplies it and what its absence means.
 */
export interface IApplyAutoMovieInspectionProps {
  /**
   * The scene to inspect. It is changed in place and put back by the handle's `restore`.
   */
  scene: THREE.Scene;

  /**
   * What to show, as `parseAutoMovieInspectionRequest` returns it.
   */
  request: IAutoMovieInspectionRequest;

  /**
   * Mark geometry and styles supplied by the scene's owners for its current state. Absent when the frame supplies none.
   */
  marks?: readonly IAutoMovieMark[];

  /** Kind names the subject declares for its lifetime. Admission also includes supplied and measured kinds. Current marks provide geometry and styles. */
  markKinds?: readonly string[];

  /**
   * The WebGL renderer drawing the scene, whose local clipping a section needs switched on. Absent, a section sets the planes on the materials and a renderer must have local clipping on to honour them.
   */
  renderer?: IAutoMovieSectionRenderer;
}
