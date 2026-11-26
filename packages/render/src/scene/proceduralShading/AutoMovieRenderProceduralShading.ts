import { type IAutoMovieProceduralSurface } from "@automovie/interface";
import { proceduralPatternGlsl as proceduralPatternGlslImplementation } from "./internal/proceduralPatternGlsl.js";

/** Public operations for Auto Movie Render Procedural Shading. */
export namespace AutoMovieRenderProceduralShading {
  /**
   * The GLSL function `float autoMovieProceduralPattern( vec3 p )` of one
   * procedural kind, reading the uniforms `applyProceduralSurface` binds: the
   * seed `uProceduralSeed`, the feature size `uProceduralScale` and the axis
   * frame `uProceduralAlong`, `uProceduralAcross` and `uProceduralNormal`.
   *
   * Each body is the engine's `autoMovieProceduralPattern` for that kind written
   * in GLSL over `AUTOMOVIE_PROCEDURAL_NOISE_GLSL`, with the same constants and
   * the same operation order, so the value differs from the CPU reference only by
   * 32-bit float rounding. Only the material's own kind is compiled.
   */
  export function patternGlsl(kind: IAutoMovieProceduralSurface["kind"]): string {
    return proceduralPatternGlslImplementation(kind);
  }
}
