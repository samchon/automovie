import type * as THREE from "three";
import { applyFilmIndirectPatch as applyFilmIndirectPatchImplementation } from "./internal/applyFilmIndirectPatch.js";

/** Public operations for Auto Movie Render Film Shading. */
export namespace AutoMovieRenderFilmShading {
  /**
   * Give one lit material the film's indirect shading: the probes' one-bounce
   * irradiance at the fragment's world position and normal, times its diffuse
   * albedo over π (`BRDF_Lambert`), is added to its indirect diffuse light, and
   * then its indirect diffuse and indirect specular light are multiplied by the
   * occlusion visibility the film stage measured for the fragment's own pixel,
   * after any occlusion texture of the material has applied, so the two multiply
   * and occlusion darkens the bounce too.
   *
   * The patch reads the stage's shared uniform objects, so one compiled program
   * serves every frame: `uFilmProbesOn` and `uFilmOcclusionOn` are zero outside
   * the stage's beauty draw, which leaves the material's light exactly as before.
   * The probe term mirrors `sampleAutoMovieIrradianceVolume` over a float texture
   * of nine coefficient texels per probe row, validity in the first texel's
   * alpha; the world position comes from the view position by the inverse of the
   * rigid view matrix. The visibility texture is read at `gl_FragCoord.xy /
   * uFilmResolution`, the pixel of the raster the stage measured. Direct light is
   * never touched.
   *
   * Lit materials are three's standard, physical, Lambert, Phong and toon
   * materials, whose fragment programs carry the `aomap_fragment` chunk and
   * indirect light. A material is patched once; a material whose compile hook was
   * set outside `addMaterialShaderPatch` is refused with an error naming it,
   * because the shared seam would replace that hook.
   *
   * @returns Whether the material is lit and now carries the patch.
   */
  export function applyIndirectPatch(material: THREE.Material, uniforms: Record<string, THREE.IUniform>): boolean {
    return applyFilmIndirectPatchImplementation(material, uniforms);
  }
}
