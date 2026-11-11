import type { IAutoMovieMark } from "@automovie/engine";
import type * as THREE from "three";

import type { IAutoMovieSectionRenderer } from "../IAutoMovieSectionRenderer.js";
import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * What `applyAutoMovieInspection` works on: a built scene, the request, and the two things only the caller holds.
 *
 * @evidence contracts/development/design.md#principled-representation The scene and the request are the whole input of a picture; marks exist only where an owner supplies findings or construction, and a renderer only where WebGL draws, so both are optional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, each owned elsewhere: the scene by its builder, the request by its parser, the marks by their producers and the clipping switch by the renderer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No camera, size or time is taken, so the same applied inspection serves every view and every frame of a run; marks that change with time are handed to the handle's `update`.
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
   * Marks the scene's owners supply for its current state, such as construction curves, joints or contacts. Their kinds, with the kinds the inspection measures itself, are what the request's `marks` patterns may name. Absent, only measured kinds exist.
   */
  marks?: readonly IAutoMovieMark[];

  /**
   * The WebGL renderer drawing the scene, whose local clipping a section needs switched on. Absent, a section sets the planes on the materials and a renderer must have local clipping on to honour them.
   */
  renderer?: IAutoMovieSectionRenderer;
}
