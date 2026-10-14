import * as THREE from "three";

import { subsurfacePhysicalChunk } from "./subsurfacePhysicalChunk.js";

/**
 * Expand the supported physical lighting include and add the existing screen-space curvature assignment. Missing outer include markers are not rejected; compatibility therefore requires the actual supported physical shader template.
 *
 * @evidence contracts/common.md#principled-implementation Uses the installed Three physical chunk, whose direct diffuse target is checked by subsurfacePhysicalChunk, and replaces the two expected outer include markers; flat shading keeps zero curvature.
 * @evidence contracts/common.md#clear-and-simple-design One pure source edit composes the checked lighting rewrite and curvature insertion without changing the global ShaderChunk registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not inspect native shader handles or special-case fixture outputs; absent outer markers can silently leave an incomplete patch and actual compilation/appearance is not proved by source rewriting.
 * @evidence contracts/common.md#meaningful-documentation States supported-template dependency, missing-marker limitation and unchanged flat/other lighting responsibilities.
 * @evidence contracts/performance.md#efficient-algorithms Reads and rewrites chunk/template strings in O(chunk+fragment length), creating proportional output source; later native compilation remains outside this function.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared SDK chunk is read for each invocation; no source cache claims equivalence across changed SDK or other material patches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned source text and retains no shader, texture, program or render task.
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
