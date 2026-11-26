import type * as THREE from "three";
import { type IAutoMovieSceneSoftProps } from "./IAutoMovieSceneSoftProps.js";
import { buildSceneSoftProps as buildSceneSoftPropsImplementation } from "./internal/buildSceneSoftProps.js";

/** Public operations for Auto Movie Render Scene Layout. */
export namespace AutoMovieRenderSceneLayout {
  /**
   * Own a scene's soft props without retaining film samples. Each update supplies
   * the already evaluated world-space surfaces for one instant.
   */
  export function buildSceneSoftProps(scene: THREE.Scene): IAutoMovieSceneSoftProps {
    return buildSceneSoftPropsImplementation(scene);
  }
}
