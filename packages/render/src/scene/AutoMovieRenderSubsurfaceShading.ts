import { subsurfaceTable as subsurfaceTableImplementation } from "./subsurfaceShading/internal/subsurfaceTable";
import { subsurfaceFragment as subsurfaceFragmentImplementation } from "./subsurfaceShading/internal/subsurfaceFragment";
import { subsurfacePhysicalChunk as subsurfacePhysicalChunkImplementation } from "./subsurfaceShading/internal/subsurfacePhysicalChunk";
import * as THREE from "three";
import { applySubsurfaceShadingImplementation } from "./subsurfaceShading/internal/applySubsurfaceShadingImplementation";

/** Public operations for Auto Movie Render Subsurface Shading. */
export namespace AutoMovieRenderSubsurfaceShading {
  /**
   * Compute a 32-by-64 diffuse lookup: the zero-blur row is a clamped cosine, and
   * other rows use 720 midpoint samples with five Gaussian wrap images. This
   * conventional approximation is not a measured tissue diffusion profile or an
   * exact infinite-wrap integral.
   */
  export function table(): number[][] {
    return subsurfaceTableImplementation();
  }

  /**
   * Expand the supported physical lighting include and add the existing
   * screen-space curvature assignment. Missing outer include markers are not
   * rejected; compatibility therefore requires the actual supported physical
   * shader template.
   */
  export function fragment(fragmentShader: string): string {
    return subsurfaceFragmentImplementation(fragmentShader);
  }

  /**
   * Replace the supported physical direct-diffuse line with the current RGB table
   * lookup while preserving all other supplied chunk text. An absent target
   * refuses before returning source; only the first exact occurrence is
   * replaced.
   */
  export function physicalChunk(pars: string): string {
    return subsurfacePhysicalChunkImplementation(pars);
  }
  /**
   * Register the existing direct-diffuse subsurface shader approximation on a new
   * physical material, borrowing one shared lookup texture. Radius channels are
   * admitted nonnegative finite distances in metres by Engine validation; this
   * helper does not independently validate them or prove measured tissue
   * response.
   */
  export function apply(
    material: THREE.MeshPhysicalMaterial,
    radius: { r: number; g: number; b: number },
  ): void {
    applySubsurfaceShadingImplementation(material, radius);
  }
}
