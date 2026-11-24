import * as THREE from "three";

import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";

/**
 * The beauty material of a flame: unlit, emissive, additive and soft at its
 * silhouette.
 *
 * The colour is the flame's linear chromaticity times its luminance in cd/m²,
 * the radiance units the renderer's photometric lights produce, as a surface
 * graphic's emissive white is. It blends additively and writes no depth, so the
 * flame glows over what lies behind it without hiding it.
 *
 * Additive blending sums every face a view ray crosses, so the material draws
 * exactly one face per ray and a pixel's radiance is the luminance once. A
 * closed flame (`closed`, a small or open flame revolved from a meridian that
 * starts and ends on its axis, whose winding faces outward) draws its front
 * faces only: drawn on both faces, the far wall would add a second time and a
 * flame seen side-on would read twice its luminance at its centre. An ember's
 * disc is one open sheet, so it draws on both faces and is seen from either
 * side once. A view ray can still cross a deeply concave silhouette twice; the
 * meridian's few-percent noise leaves the flame convex enough that it does
 * not.
 *
 * A shader patch scales the outgoing light by `|n · v|^1.5`, the cosine between
 * the surface normal and the view direction, so the edge seen side-on fades and
 * the flame reads as a soft volume rather than a hard shell; the exponent is a
 * provisional look choice. Guide passes replace this material with their own,
 * so the flame's shape, not this glow, is what they draw.
 */
export function createAutoMovieFlameMaterial(
  color: { r: number; g: number; b: number },
  luminance: number,
  closed: boolean,
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
    side: closed ? THREE.FrontSide : THREE.DoubleSide,
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
