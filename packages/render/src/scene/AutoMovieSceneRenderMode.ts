import { restoreAutoMovieRenderModeOnce as restoreAutoMovieRenderModeOnceImplementation } from "./internal/restoreAutoMovieRenderModeOnce.js";

/** Public operations for Auto Movie Scene Render Mode. */
export namespace AutoMovieSceneRenderMode {
  /**
   * Attempt one synchronous restoration once. Later calls preserve its original
   * failure instead of reporting success or retrying a partially released
   * resource; reentrant calls do not start a second attempt.
   */
  export function restoreOnce(fn: () => void): (() => void) {
    return restoreAutoMovieRenderModeOnceImplementation(fn);
  }
}
