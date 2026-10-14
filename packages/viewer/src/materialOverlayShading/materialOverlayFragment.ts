import { spliceTangentNormal } from "../detailNormalShading/index.js";
import type { IMaterialOverlayShape } from "./IMaterialOverlayShape.js";

/**
 * The fragment shader compositing each overlay's colour, roughness and slopes.
 *
 * @evidence contracts/common.md#principled-implementation Expands ordered layer uniforms and colour/roughness statements at the installed Three shader markers and delegates tangent-normal insertion to the existing splice owner.
 * @evidence contracts/common.md#clear-and-simple-design One fragment-source generator consumes structural shapes while actual images, transforms and scalar values remain material uniforms.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing blend/coverage/whiteout expressions are unchanged; supported shader markers and tangent-normal representation are premises, and generated strings alone do not prove compiled or observed shading.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies colour, optional roughness and normal composition, required SDK markers and source-versus-appearance limits.
 * @evidence contracts/performance.md#efficient-algorithms For L layers and S shader bytes, source arrays/joins grow with enabled components and a fixed set of replacements/splices scans shader text; ordered full expansion is necessary for every enabled layer.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal ordered shapes generate equivalent fragment structure and the material patch key permits native program reuse; image/scalar uniforms are not baked into a shared source cache here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary declarations/statements and the returned shader string contain no program or texture handle; compilation and native shader lifetime belong to Three/material ownership.
 */
export const materialOverlayFragment: (fragmentShader: string, shapes: readonly IMaterialOverlayShape[]) => string = (
  fragmentShader: string,
  shapes: readonly IMaterialOverlayShape[],
): string => {
  const declarations: string[] = [];
  const colours: string[] = [];
  const roughnesses: string[] = [];
  const normals: string[] = [];
  shapes.forEach((shape: IMaterialOverlayShape, i: number): void => {
    declarations.push(
      `uniform sampler2D overlayColorMap${i};`,
      `uniform float overlayStrength${i};`,
      `uniform vec3 overlayColorFactor${i};`,
      `varying vec2 vOverlayColorUv${i};`,
    );
    colours.push(
      `vec4 overlayColor${i} = texture2D( overlayColorMap${i}, vOverlayColorUv${i} );`,
      `overlayColor${i}.rgb *= overlayColorFactor${i};`,
      `float overlayCover${i} = overlayColor${i}.a * overlayStrength${i};`,
      shape.blend === "multiply"
        ? `diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * overlayColor${i}.rgb, overlayCover${i} );`
        : `diffuseColor.rgb = mix( diffuseColor.rgb, overlayColor${i}.rgb, overlayCover${i} );`,
    );
    if (shape.roughness) {
      declarations.push(`uniform float overlayRoughness${i};`);
      roughnesses.push(
        `roughnessFactor = mix( roughnessFactor, overlayRoughness${i}, overlayCover${i} );`,
      );
    }
    if (shape.normal) {
      declarations.push(
        `uniform sampler2D overlayNormalMap${i};`,
        `uniform float overlayNormalScale${i};`,
        `varying vec2 vOverlayNormalUv${i};`,
      );
      normals.push(
        `vec3 overlayN${i} = texture2D( overlayNormalMap${i}, vOverlayNormalUv${i} ).xyz * 2.0 - 1.0;`,
        ...(shape.blend === "multiply"
          ? [
              `overlayN${i}.xy *= overlayNormalScale${i} * overlayStrength${i};`,
              `mapN = normalize( vec3( mapN.xy + overlayN${i}.xy, mapN.z * overlayN${i}.z ) );`,
            ]
          : [
              // another tissue: its own surface replaces the material's
              `overlayN${i}.xy *= overlayNormalScale${i};`,
              `mapN = normalize( mix( mapN, normalize( overlayN${i} ), overlayCover${i} ) );`,
            ]),
      );
    }
  });
  let shader: string = fragmentShader
    .replace(
      "#include <common>",
      ["#include <common>", ...declarations].join("\n"),
    )
    .replace(
      "#include <color_fragment>",
      ["#include <color_fragment>", ...colours].join("\n\t"),
    );
  if (roughnesses.length > 0)
    shader = shader.replace(
      "#include <roughnessmap_fragment>",
      ["#include <roughnessmap_fragment>", ...roughnesses].join("\n\t"),
    );
  if (normals.length > 0)
    shader = spliceTangentNormal(shader, normals.join("\n\t"));
  return shader;
};
