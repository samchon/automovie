import type { AutoMovieGuidePass, IAutoMovieSceneEnvironment } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieRenderScenePassRenderer } from "./IAutoMovieRenderScenePassRenderer.js";
import { renderAutoMovieScenePassImplementation } from "./internal/renderAutoMovieScenePassImplementation.js";

/** Public operations for Auto Movie Render Scene Pass. */
export namespace AutoMovieRenderScenePass {
  /**
   * Draw a scene sample under reversible environment and material-pass owners. A
   * beauty pass of a scene carrying a medium is refused before anything changes,
   * because the medium is drawn only in a film's linear target. Both owners are
   * restored independently, even after drawing or one restore fails. The primary
   * failure remains first rather than being replaced by a secondary restoration
   * error. Caller-owned scene and renderer are retained.
   */
  export function render(
    renderer: IAutoMovieRenderScenePassRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    environment: IAutoMovieSceneEnvironment | null | undefined,
    pass: AutoMovieGuidePass,
    delivery?: IAutoMovieSceneEnvironment["toneMapping"],
  ): void {
    renderAutoMovieScenePassImplementation(
      renderer,
      scene,
      camera,
      environment,
      pass,
      delivery,
    );
  }
}