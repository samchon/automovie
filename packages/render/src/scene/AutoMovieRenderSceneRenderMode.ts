import type { AutoMovieGuidePass } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieRenderModeHandle } from "./IAutoMovieRenderModeHandle";
import { applyRenderMode as applyRenderModeImplementation } from "./internal/applyRenderMode";
import { restoreRenderModeOnce as restoreRenderModeOnceImplementation } from "./internal/restoreRenderModeOnce";
import { restoreRenderModeState as restoreRenderModeStateImplementation } from "./internal/restoreRenderModeState";
import { guardRenderModeRetirement as guardRenderModeRetirementImplementation } from "./internal/guardRenderModeRetirement";

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
      return restoreRenderModeStateImplementation(operations);
    return restoreRenderModeStateImplementation(operations, primary);
  }

  /** Guard new mode work while a scene mode restoration is active or failed. */
  export function guardRetirement(
    scene: THREE.Scene,
    attempt?: { run: () => void; primary?: { error: unknown } },
  ): void {
    guardRenderModeRetirementImplementation(scene, attempt);
  }

  /**
   * Attempt one synchronous restoration once. Later calls preserve its original
   * failure instead of reporting success or retrying a partially released
   * resource; reentrant calls do not start a second attempt.
   */
  export function restoreOnce(fn: () => void): (() => void) {
    return restoreRenderModeOnceImplementation(fn);
  }
}
