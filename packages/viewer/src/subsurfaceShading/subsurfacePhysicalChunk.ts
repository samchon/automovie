import { SUBSURFACE_TARGET } from "./SUBSURFACE_TARGET.js";
import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS } = SUBSURFACE_TEXTURE_SIZE;

/**
 * Splice the subsurface lookup into one supplied physical lighting chunk.
 * An incompatible chunk is refused before producing a partial shader. The
 * caller supplies the actual SDK chunk; the pure boundary also accepts typed
 * compatibility inputs without changing the SDK's shared shader registry.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Preserves the physical material response except for its declared subsurface diffuse term.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Refuses an incompatible lighting chunk instead of silently dropping the subsurface response.
 */
export const subsurfacePhysicalChunk = (pars: string): string => {
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
};
