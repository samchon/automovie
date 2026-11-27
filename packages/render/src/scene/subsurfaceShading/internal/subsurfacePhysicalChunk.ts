import { AutoMovieRenderSubsurfaceTarget } from "../../AutoMovieRenderSubsurfaceTarget.js";
import { SUBSURFACE_TEXTURE_SIZE } from "../SUBSURFACE_TEXTURE_SIZE.js";

/*
 * Replace the supported physical direct-diffuse line with the current RGB table
 * lookup while preserving all other supplied chunk text. An absent target
 * refuses before returning source; only the first exact occurrence is
 * replaced.
 */
export function subsurfacePhysicalChunk(pars: string): string {
  if (!pars.includes(AutoMovieRenderSubsurfaceTarget))
    throw new Error(
      "The physical lighting chunk no longer has the direct diffuse line subsurface shading replaces.",
    );
  return (
    `uniform vec3 subsurfaceRadius;
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
      AutoMovieRenderSubsurfaceTarget,
      "reflectedLight.directDiffuse += directLight.color * subsurfaceDiffuse( dot( geometryNormal, directLight.direction ) ) * diffuseBRDF * ( 1.0 - F );",
    )
  );
}

const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE =
  SUBSURFACE_TEXTURE_SIZE;
