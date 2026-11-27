import type * as THREE from "three";
import { applyProceduralSurface as applyProceduralSurfaceImplementation } from "./proceduralShading/internal/applyProceduralSurface.js";

import { type IAutoMovieProceduralSurface } from "@automovie/interface";
import { proceduralPatternGlsl as proceduralPatternGlslImplementation } from "./proceduralShading/internal/proceduralPatternGlsl.js";

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

  /**
   * Shade a material from an admitted procedural surface, evaluating the engine's
   * `AutoMovieEngineMaterial.sampleProceduralSurface` per fragment through one
   * material shader patch.
   *
   * The vertex stage passes the sample point: the bind-pose object-space
   * `position` attribute, read before morphing and skinning so the pattern stays
   * on the same surface points as a skinned mesh bends; or, for a pattern piece,
   * the UV0 mapped by the occurrence transform into sheet turns, times the tile
   * lengths, with `dot(position, normal)` as the third coordinate and a `module`
   * piece's hashed offset added. The mapping is affine in the vertex attributes,
   * so interpolation across a triangle is exact.
   *
   * The fragment stage computes the kind's pattern value once and then replaces
   * the base colour after the colour map (vertex colours still multiply it), the
   * roughness after the roughness map, and perturbs the shading normal after the
   * normal maps by the height `value × relief`: the screen-space derivatives of
   * the height and the view-space position give Blinn's bump (Blinn 1978,
   * "Simulation of wrinkled surfaces", SIGGRAPH) in Mikkelsen's surface-gradient
   * form, the same construction three uses for bump maps. Every uniform is set
   * once here from the surface; the program key names the kind and whether a
   * piece is sampled, so materials of one kind share a program.
   */
  export function applySurface(material: THREE.MeshStandardMaterial, surface: IAutoMovieProceduralSurface): void {
    applyProceduralSurfaceImplementation(material, surface);
  }
}
