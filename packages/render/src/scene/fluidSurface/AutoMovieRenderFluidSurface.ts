import type {
  AutoMovieWaterFeatureMode,
  IAutoMovieFluidSurface,
} from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieFluidSurfaceObject } from "../IAutoMovieFluidSurfaceObject.js";
import { buildFluidSurfaceObject as buildFluidSurfaceObjectImplementation } from "../internal/buildFluidSurfaceObject.js";

/** Public operations for Auto Movie Render Fluid Surface. */
export namespace AutoMovieRenderFluidSurface {
  /**
   * Project one engine-derived free surface into a `three.js` mesh.
   *
   * Positions, normals, UVs and the per-vertex flow vector come from the Engine
   * surface. `aFlow` and `flowing` preserve numerical intent for a supplied
   * shader; the default MeshStandardMaterial does not consume either to scroll
   * ripples.
   *
   * Structural passes swap this ordinary mesh's material. Its bounding sphere
   * uses the supplied wet bounds; copied Float32 positions do not establish pixel
   * equality with the numerical depth field.
   */
  export function buildFluidSurfaceObject(props: {
    surface: IAutoMovieFluidSurface;
    /** Water material; a translucent default is created when absent. */
    material?: THREE.Material;
    /**
     * Feature mode recorded as flowing metadata; a supplied shader may consume
     * it.
     */
    mode?: AutoMovieWaterFeatureMode;
  }): IAutoMovieFluidSurfaceObject {
    return buildFluidSurfaceObjectImplementation(props);
  }
}
