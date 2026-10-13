import * as THREE from "three";

import { HUMAN_HAIR_SHADOW_OPACITY_GLSL } from "./HUMAN_HAIR_SHADOW_OPACITY_GLSL.js";

/**
 * The depth material a fibre-card mesh casts its shadow with: a texel stops
 * light in proportion to the share of it the fibres cover (the texture's
 * alpha) times `hairFibreShadowOpacity` of its own colour (the card texture's
 * shade times `color`, the finish's base colour), so the cards' binary shadow
 * map keeps each texel with that probability,
 * against interleaved gradient noise on the map's texel grid (Jimenez,
 * "Next Generation Post Processing in Call of Duty: Advanced Warfare",
 * SIGGRAPH 2014), whose thresholds spread evenly over any small neighbourhood
 * so the soft-shadow filter averages them into a partial shadow; stochastic
 * transparency is the standard way to shadow hair through a depth map
 * (Enderton et al. 2010). The renderer assigns the hair material's texture,
 * alpha cutoff and side to it each shadow pass, so the card's own mask still
 * decides where a fibre is.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under orbiting view and shadowed material display.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Applies device-bounded texture sampling and shadow policy without changing the saved anatomical document.
 */
export function createHairCardShadowMaterial(
  color: THREE.Color,
): THREE.MeshDepthMaterial {
  const material = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  const pigment = { value: color.clone() };
  material.onBeforeCompile = (shader) => {
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
  material.customProgramCacheKey = () => "hair-card-shadow";
  return material;
}
