import * as THREE from "three";
import { subsurfacePhysicalChunk } from "./subsurfacePhysicalChunk.js";

/**
 * Expand the physical fragment with the declared subsurface diffuse response.
 * The supplied shader keeps its other lighting chunks and flat-surface branch.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Integrates the material lookup while retaining the physical shader's other response terms.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Applies the curvature-based diffuse lookup to the actual physical fragment shader.
 */
export const subsurfaceFragment = (fragmentShader: string): string => {
  const pars = THREE.ShaderChunk.lights_physical_pars_fragment;
  const patched = subsurfacePhysicalChunk(pars);
  return fragmentShader
    .replace("#include <lights_physical_pars_fragment>", patched)
    .replace(
      "#include <lights_fragment_begin>",
      `#ifndef FLAT_SHADED
	subsurfaceCurvature = length( fwidth( normalize( vNormal ) ) ) / max( length( fwidth( vViewPosition ) ), 1e-6 );
#else
	subsurfaceCurvature = 0.0;
#endif
#include <lights_fragment_begin>`,
    );
};
