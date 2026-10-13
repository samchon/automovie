import * as THREE from "three";
import { subsurfacePhysicalChunk } from "./subsurfacePhysicalChunk.js";

/**
 * Expand the physical fragment with the declared subsurface diffuse response.
 * The supplied shader keeps its other lighting chunks and flat-surface branch.
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
