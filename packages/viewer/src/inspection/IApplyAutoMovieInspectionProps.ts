import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import type { IAutoMovieInspectionConstruction } from "./IAutoMovieInspectionConstruction.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * What `applyAutoMovieInspection` works on: a built scene, the request, and the two things only the caller holds.
 *
 * @evidence contracts/development/design.md#principled-representation The scene and the request are the whole input of a picture; curves exist only where a form was built from a construction, and a renderer only where WebGL draws, so both are optional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, each owned elsewhere: the scene by its builder, the request by its parser, the curves by the engine's sampler and the clipping switch by the renderer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No camera, size or time is taken, so the same applied inspection serves every view and every frame of a run.
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
   * Construction curves of the scene's built forms. Absent, no curve is drawn whatever the request asks.
   */
  constructions?: readonly IAutoMovieInspectionConstruction[];

  /**
   * The WebGL renderer drawing the scene, whose local clipping a section needs switched on. The CPU rasterizer needs none.
   */
  renderer?: IAutoMovieSectionRenderer;
}
