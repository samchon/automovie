import type * as THREE from "three";
import { type IAutoMovieMedium } from "@automovie/interface";
import { applySceneMedium as applySceneMediumImplementation } from "./medium/internal/applySceneMedium.js";
import { readAutoMovieSceneMedium as readAutoMovieSceneMediumImplementation } from "./medium/internal/readAutoMovieSceneMedium.js";

/** Public operations for Auto Movie Render Medium. */
export namespace AutoMovieRenderMedium {
  /**
   * Attach the scene's physical haze to a built `three.js` scene, or remove it
   * when nothing is declared.
   *
   * Exported, and separate from `buildScene`, for the reason `applySceneFog` is:
   * a production that assembles its own scene graph attaches the film's medium
   * through this one call. The medium is stored verbatim, a copy of the three
   * coefficients, under {@link AUTOMOVIE_SCENE_MEDIUM_KEY}; the film response
   * stage reads it with `readAutoMovieSceneMedium` and draws it in the linear
   * beauty target. Absent or `null` removes it, so the scene draws clear air.
   */
  export function apply(scene: THREE.Scene, medium: IAutoMovieMedium | null | undefined): void {
    applySceneMediumImplementation(scene, medium);
  }

  /**
   * The physical haze `applySceneMedium` attached to a scene, or null when it
   * carries none.
   */
  export function read(scene: THREE.Scene): IAutoMovieMedium | null {
    return readAutoMovieSceneMediumImplementation(scene);
  }
}
