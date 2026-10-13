import { formatHumanHairShadowGlsl } from "./formatHumanHairShadowGlsl.js";

import { HUMAN_HAIR_SHADOW_DARKEST } from "./HUMAN_HAIR_SHADOW_DARKEST.js";

import { HUMAN_HAIR_SHADOW_ABSORPTION_SCALE } from "./HUMAN_HAIR_SHADOW_ABSORPTION_SCALE.js";

import { HUMAN_HAIR_SHADOW_OFFSETS } from "./HUMAN_HAIR_SHADOW_OFFSETS.js";

import { HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE } from "./HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE.js";

import { HUMAN_HAIR_SHADOW_LUMINANCE } from "./HUMAN_HAIR_SHADOW_LUMINANCE.js";

/** `hairFibreShadowOpacity` in GLSL, from the same constants. */
export const HUMAN_HAIR_SHADOW_OPACITY_GLSL = `
float hairFibreShadowOpacity( vec3 albedo ) {
  vec3 sigma = log( clamp( albedo, ${formatHumanHairShadowGlsl(HUMAN_HAIR_SHADOW_DARKEST)}, 1.0 ) ) / ${formatHumanHairShadowGlsl(HUMAN_HAIR_SHADOW_ABSORPTION_SCALE)};
  sigma *= sigma;
  vec3 passed = vec3( 0.0 );
${HUMAN_HAIR_SHADOW_OFFSETS.map(
  ([h, weight]) =>
    `  passed += ${formatHumanHairShadowGlsl(weight)} * exp( -2.0 * sigma * ${formatHumanHairShadowGlsl(Math.sqrt(1 - h * h))} );`,
).join("\n")}
  return 1.0 - ${formatHumanHairShadowGlsl((1 - HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE) ** 2)} * dot( passed, vec3( ${HUMAN_HAIR_SHADOW_LUMINANCE.map(formatHumanHairShadowGlsl).join(", ")} ) );
}
`;
