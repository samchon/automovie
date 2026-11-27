import type { AutoMovieGuidePass } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle.js";
import { applyRenderMode as applyRenderModeImplementation } from "./internal/applyRenderMode.js";
import { restoreAutoMovieRenderModeOnce as restoreAutoMovieRenderModeOnceImplementation } from "./internal/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState as restoreAutoMovieRenderModeStateImplementation } from "./internal/restoreAutoMovieRenderModeState.js";
import { guardAutoMovieRenderModeRetirement as guardAutoMovieRenderModeRetirementImplementation } from "./internal/guardAutoMovieRenderModeRetirement.js";

/** Public operations for Auto Movie Scene Render Mode. */
export namespace AutoMovieRenderSceneRenderMode {
  /** Apply one reversible guide-pass render mode to a scene. */
  export function apply(
    scene: THREE.Scene,
    mode: AutoMovieGuidePass,
    options?: { depthRange?: number; edgeWidth?: number },
  ): IAutoMovieRenderModeHandle {
    return applyRenderModeImplementation(scene, mode, options);
  }

  /** Restore every independent mode state operation, then report failures. */
  export function restoreState(
    operations: readonly (() => void)[],
    primary: { error: unknown },
  ): never;
  export function restoreState(operations: readonly (() => void)[]): void;
  export function restoreState(
    operations: readonly (() => void)[],
    primary?: { error: unknown },
  ): void {
    if (primary === undefined)
      return restoreAutoMovieRenderModeStateImplementation(operations);
    return restoreAutoMovieRenderModeStateImplementation(operations, primary);
  }

  /** Guard new mode work while a scene mode restoration is active or failed. */
  export function guardRetirement(
    scene: THREE.Scene,
    attempt?: { run: () => void; primary?: { error: unknown } },
  ): void {
    guardAutoMovieRenderModeRetirementImplementation(scene, attempt);
  }

  /**
   * Attempt one synchronous restoration once. Later calls preserve its original
   * failure instead of reporting success or retrying a partially released
   * resource; reentrant calls do not start a second attempt.
   */
  export function restoreOnce(fn: () => void): (() => void) {
    return restoreAutoMovieRenderModeOnceImplementation(fn);
  }
}
