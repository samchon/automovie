import * as THREE from "three";

import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";

/**
 * The beauty material of a flame: unlit, emissive, additive and soft at its
 * silhouette.
 *
 * The colour is the flame's linear chromaticity times its luminance in cd/m²,
 * the radiance units the renderer's photometric lights produce, as a surface
 * graphic's emissive white is. It blends additively, writes no depth and is
 * drawn on both faces, so the flame glows over what lies behind it without
 * hiding it. A shader patch scales the outgoing light by `|n · v|^1.5`, the
 * cosine between the surface normal and the view direction, so the edge seen
 * side-on fades and the flame reads as a soft volume rather than a hard shell;
 * the exponent is a provisional look choice. Guide passes replace this material
 * with their own, so the flame's shape, not this glow, is what they draw.
 */
export function createAutoMovieFlameMaterial(
  color: { r: number; g: number; b: number },
  luminance: number,
): THREE.MeshBasicMaterial {
  const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(
      color.r * luminance,
      color.g * luminance,
      color.b * luminance,
    ),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  addMaterialShaderPatch(material, {
    key: "automovie-flame-edge",
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vFlameNormal;\nvarying vec3 vFlameView;",
        )
        .replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvFlameNormal = normalize( normalMatrix * normal );\nvFlameView = -mvPosition.xyz;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vFlameNormal;\nvarying vec3 vFlameView;",
        )
        .replace(
          "#include <opaque_fragment>",
          "outgoingLight *= pow( abs( dot( normalize( vFlameNormal ), normalize( vFlameView ) ) ), 1.5 );\n#include <opaque_fragment>",
        );
    },
  });
  return material;
}
