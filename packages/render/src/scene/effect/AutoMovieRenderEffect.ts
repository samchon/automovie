import type { IAutoMovieCompiledEffect } from "@automovie/interface";
import type { IAutoMovieEffectViewerObject } from "../IAutoMovieEffectViewerObject.js";
import { buildInstancedEffect as buildInstancedEffectImplementation } from "../internal/buildInstancedEffect.js";

/** Public operations for Auto Movie Render Effect. */
export namespace AutoMovieRenderEffect {
  /**
   * Build a compiled effect as fixed-capacity camera-facing billboard instances.
   * Numeric particles come from the engine's absolute fixed-step sampler. The
   * current tree exposes this producer without a production scene/film caller.
   * Its returned native mesh exposes resources for caller-owned retirement; no
   * complete disposal handle or partial-setup rollback is supplied here.
   */
  export function buildInstancedEffect(effect: IAutoMovieCompiledEffect): IAutoMovieEffectViewerObject {
    return buildInstancedEffectImplementation(effect);
  }
}
