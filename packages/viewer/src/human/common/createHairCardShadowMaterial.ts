import * as THREE from "three";

import { HUMAN_HAIR_SHADOW_OPACITY_GLSL } from "./HUMAN_HAIR_SHADOW_OPACITY_GLSL.js";

/**
 * The depth material a fibre-card mesh casts its shadow with: a texel stops
 * light in proportion to the share of it the fibres cover (the texture's
 * alpha) times `hairFibreShadowOpacity` of its own colour (the card texture's
 * shade times `color`, the finish's base colour), so the cards' binary shadow
 * map keeps each texel with that probability,
 * against a deterministic interleaved-gradient threshold on the map's texel
 * grid. This finite depth-map approximation needs beauty observation to judge
 * visible patterning; the threshold does not guarantee an exact coverage
 * average over every neighbourhood. The renderer assigns the hair material's texture,
 * alpha cutoff and side to it each shadow pass, so the card's own mask still
 * decides where a fibre is.
 *
 * @evidence contracts/common.md#principled-implementation Patches the native MeshDepthMaterial fragment source to discard when alpha times modeled fibre opacity is below a deterministic screen-grid threshold. The supported native shader must retain both string anchors; replacement does not refuse if an anchor disappears. This is a monochrome depth-map coverage approximation, not full multiple-scattering hair transport.
 * @evidence contracts/common.md#clear-and-simple-design One owned depth material carries the cloned pigment uniform and canonical opacity GLSL while native shadow rendering supplies the source mask. Numerical absorption constants remain with their named owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The deterministic threshold has no fixture frame or temporal random seed. Native shader text is extended through public onBeforeCompile, not foreign-method replacement; unobserved current shader output is not claimed smooth or physically exact.
 * @evidence contracts/common.md#meaningful-documentation The comment states alpha/pigment participation, deterministic depth-grid threshold and visible-patterning limit. The copied pigment does not follow later mutation of the input Color.
 * @evidence contracts/performance.md#efficient-algorithms Material construction copies one color/uniform; compilation performs two source-string replacements. Each shadow fragment evaluates the fixed opacity quadrature and threshold, and real shadow raster/map cost belongs to the viewport lights.
 * @evidence contracts/performance.md#reuse-equivalent-work The constant program cache key is valid while every instance uses the same shader source and varies only its uniform pigment. Changed module constants/native shader content require recompilation; no key claims geometry or texture equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned material and releases it through preview-group retirement. Shader closures retain the cloned pigment and fixed GLSL; the constructor borrows no texture and owns no renderer or task.
 */
export function createHairCardShadowMaterial(
  color: THREE.Color,
): THREE.MeshDepthMaterial {
  const material: THREE.MeshDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  const pigment: { value: THREE.Color; } = { value: color.clone() };
  material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms): void => {
    shader.uniforms.hairPigment = pigment;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `uniform vec3 hairPigment;\n${HUMAN_HAIR_SHADOW_OPACITY_GLSL}\nvoid main() {`,
      )
      .replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
  // Interleaved gradient noise on the shadow map's own texel grid.
  float hairThreshold = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
  if ( diffuseColor.a * hairFibreShadowOpacity( diffuseColor.rgb * hairPigment ) <= hairThreshold ) discard;`,
      );
  };
  material.customProgramCacheKey = (): string => "hair-card-shadow";
  return material;
}
