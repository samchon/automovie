import { spliceTangentNormal } from "../detailNormalShading/index.js";
import type { IMaterialOverlayShape } from "./IMaterialOverlayShape.js";

/** The fragment shader compositing each overlay's colour, roughness and slopes. */
export const materialOverlayFragment = (
  fragmentShader: string,
  shapes: readonly IMaterialOverlayShape[],
): string => {
  const declarations: string[] = [];
  const colours: string[] = [];
  const roughnesses: string[] = [];
  const normals: string[] = [];
  shapes.forEach((shape, i) => {
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
  let shader = fragmentShader
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
