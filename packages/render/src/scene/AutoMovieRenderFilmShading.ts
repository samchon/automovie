import type { IAutoMovieFilmShading, IAutoMovieIrradianceVolume } from "@automovie/interface";
import type * as THREE from "three";
import type { IAutoMovieFilmIndirectRenderer } from "./IAutoMovieFilmIndirectRenderer.js";
import { bakeAutoMovieFilmProbesImplementation } from "./filmShading/internal/bakeAutoMovieFilmProbesImplementation.js";
import { applyFilmIndirectPatch as applyFilmIndirectPatchImplementation } from "./filmShading/internal/applyFilmIndirectPatch.js";

/** Public operations for Auto Movie Render Film Shading. */
export namespace AutoMovieRenderFilmShading {
  /**
   * Bake a film's irradiance probes: for each grid point of `probes`, draw the
   * static `layer` into six 32-texel cube faces and project them with
   * `projectAutoMovieIrradianceProbe`.
   *
   * Each face is a 90° perspective camera at the probe whose layer mask is
   * `layer` alone, so only the static set and the lights on that layer draw, with
   * their shadows, emission and the scene's image lighting on surfaces. The six
   * faces render side by side into one 192 × 32 float target, cleared to black
   * with the scene's background off, so texels that see no geometry add nothing
   * and the sky, which image lighting already brings to every material, is not
   * counted twice. A second render of the same faces with a double-sided material
   * that writes one on back faces marks the texels that look into a solid. Both
   * are read back and handed to the projection, which marks the probe invalid
   * when more than a quarter of its texels see back faces.
   *
   * The renderer's target, clear colour and alpha, clear policy, tone curve and
   * exposure, and the scene's background and override material are restored
   * before it returns or throws. Nothing earlier than this call is read, so a
   * bake depends only on the scene as it stands: one bounce.
   *
   * @throws When the renderer cannot clear or read back a target.
   */
  export function bakeProbes(props: {
    /** The renderer, with its read-back members. */
    renderer: IAutoMovieFilmIndirectRenderer;

    /** The scene placed at the drawn second. */
    scene: THREE.Scene;

    /** The admitted probes request. */
    probes: IAutoMovieFilmShading.IProbes;
  }): IAutoMovieIrradianceVolume {
    return bakeAutoMovieFilmProbesImplementation(props);
  }
  /**
   * Give one lit material the film's indirect shading: the probes' one-bounce
   * irradiance at the fragment's world position and normal, times its diffuse
   * albedo over ? (`BRDF_Lambert`), is added to its indirect diffuse light, and
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
   * set outside `AutoMovieRenderMaterial.addShaderPatch` is refused with an error naming it,
   * because the shared seam would replace that hook.
   *
   * @returns Whether the material is lit and now carries the patch.
   */
  export function applyIndirectPatch(material: THREE.Material, uniforms: Record<string, THREE.IUniform>): boolean {
    return applyFilmIndirectPatchImplementation(material, uniforms);
  }
}
