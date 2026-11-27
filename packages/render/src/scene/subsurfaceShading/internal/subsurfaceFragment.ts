import * as THREE from "three";

import { subsurfacePhysicalChunk } from "./subsurfacePhysicalChunk";

/*
 * Expand the supported physical lighting include and add the existing
 * screen-space curvature assignment. Missing outer include markers are not
 * rejected; compatibility therefore requires the actual supported physical
 * shader template.
 */
export function subsurfaceFragment(fragmentShader: string): string {
  const pars: string = THREE.ShaderChunk.lights_physical_pars_fragment;
  const patched: string = subsurfacePhysicalChunk(pars);
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
}
