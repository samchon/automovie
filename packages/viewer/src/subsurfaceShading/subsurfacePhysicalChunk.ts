import { SUBSURFACE_TARGET } from "./SUBSURFACE_TARGET.js";
import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE = SUBSURFACE_TEXTURE_SIZE;

/**
 * Replace the supported physical direct-diffuse line with the current RGB table lookup while preserving all other supplied chunk text. An absent target refuses before returning source; only the first exact occurrence is replaced.
 *
 * @evidence contracts/common.md#principled-implementation Exact supported-chunk recognition precedes insertion of radius/table uniforms and texel-centered coordinates from the shared grid; shader radius*curvature/pi is clamped to the tabulated blur domain.
 * @evidence contracts/common.md#clear-and-simple-design One pure compatibility boundary keeps SDK source input separate from the material registration and shared numerical lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declared native target line is a compatibility contract, not an expected image answer; duplicate targets and semantic changes elsewhere in a supplied chunk are not exhaustively validated.
 * @evidence contracts/common.md#meaningful-documentation Documents exact-target refusal, preserved surrounding source and single-occurrence compatibility limit.
 * @evidence contracts/performance.md#efficient-algorithms One target scan and replacement plus fixed prefix are O(chunk length); no GPU allocation or shader compilation occurs here.
 * @evidence contracts/performance.md#reuse-equivalent-work Grid dimensions and target text are shared constants; each supplied chunk produces fresh output without caching mutable shader edits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned source; this function retains no program, texture, renderer or background task.
 */
export function subsurfacePhysicalChunk(pars: string): string {
  if (!pars.includes(SUBSURFACE_TARGET))
    throw new Error(
      "The physical lighting chunk no longer has the direct diffuse line subsurface shading replaces.",
    );
  return `uniform vec3 subsurfaceRadius;
uniform sampler2D subsurfaceTable;
float subsurfaceCurvature;
vec3 subsurfaceDiffuse( const in float dotNL ) {
	// texel centres of the ${COSINES} x ${BLURS} table
	vec3 s = ( clamp( subsurfaceRadius * subsurfaceCurvature / PI, 0.0, 1.0 ) * ${BLURS - 1}.0 + 0.5 ) / ${BLURS}.0;
	float u = ( ( dotNL * 0.5 + 0.5 ) * ${COSINES - 1}.0 + 0.5 ) / ${COSINES}.0;
	return vec3(
		texture2D( subsurfaceTable, vec2( u, s.r ) ).r,
		texture2D( subsurfaceTable, vec2( u, s.g ) ).r,
		texture2D( subsurfaceTable, vec2( u, s.b ) ).r
	);
}
` +
    pars.replace(
      SUBSURFACE_TARGET,
      "reflectedLight.directDiffuse += directLight.color * subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) ) * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );",
    );
}
