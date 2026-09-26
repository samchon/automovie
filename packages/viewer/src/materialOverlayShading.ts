import * as THREE from "three";

import { spliceTangentNormal } from "./detailNormalShading";
import { addMaterialShaderPatch } from "./materialShaderPatches";

/** One overlay with its images decoded. */
export interface IMaterialOverlayShading {
  /** sRGB colour, coverage in alpha. */
  color: THREE.Texture;
  /** Whether the colour tints the base colour or replaces it. */
  blend: "multiply" | "replace";
  /** Roughness where it covers, or `null` to keep the material's. */
  roughness: number | null;
  /** Tangent-space normal map, or `null`. */
  normal: THREE.Texture | null;
  /** Factor on the normal map's slopes. */
  normalScale: number;
  /** Factor on the coverage and the slopes, `[0, 1]`. */
  strength: number;
}

let flat: THREE.DataTexture | null = null;
/** A one-texel flat normal map, so a material without one still has a tangent frame to bend. */
const flatNormal = (): THREE.DataTexture => {
  if (flat !== null) return flat;
  flat = new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1);
  flat.colorSpace = THREE.NoColorSpace;
  flat.needsUpdate = true;
  return flat;
};

/**
 * Composite surface overlays over a material, in order, each where its own
 * colour image covers: its coverage is the image's alpha times its strength,
 * over which the base colour is multiplied by the image's colour (`multiply`)
 * or replaced by it (`replace`), the roughness moves to the overlay's own
 * when it names one, and its normal map's slopes, scaled by its normal scale
 * and strength, add to the material's by whiteout blending. An overlay with a
 * normal map on a material without one gives the material a flat normal map,
 * so the tangent frame it bends exists.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a material's surface overlays into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the overlay composite at the render boundary.
 */
export const applyMaterialOverlays = (
  material: THREE.MeshPhysicalMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void => {
  if (overlays.length === 0) return;
  if (material.normalMap === null && overlays.some((o) => o.normal !== null))
    material.normalMap = flatNormal();
  const uniforms: Record<string, THREE.IUniform> = {};
  overlays.forEach((overlay, i) => {
    overlay.color.updateMatrix();
    uniforms[`overlayColorMap${i}`] = { value: overlay.color };
    uniforms[`overlayColorTransform${i}`] = {
      value: overlay.color.matrix.clone(),
    };
    uniforms[`overlayStrength${i}`] = { value: overlay.strength };
    if (overlay.roughness !== null)
      uniforms[`overlayRoughness${i}`] = { value: overlay.roughness };
    if (overlay.normal !== null) {
      overlay.normal.updateMatrix();
      uniforms[`overlayNormalMap${i}`] = { value: overlay.normal };
      uniforms[`overlayNormalTransform${i}`] = {
        value: overlay.normal.matrix.clone(),
      };
      uniforms[`overlayNormalScale${i}`] = { value: overlay.normalScale };
    }
  });
  material.userData.overlays = overlays;
  const shapes = overlays.map((overlay) => ({
    blend: overlay.blend,
    roughness: overlay.roughness !== null,
    normal: overlay.normal !== null,
  }));
  addMaterialShaderPatch(material, {
    key: `automovie-overlays-${shapes
      .map(
        (shape) =>
          `${shape.blend[0]}${shape.roughness ? "r" : ""}${shape.normal ? "n" : ""}`,
      )
      .join(".")}`,
    apply: (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
};

/** What decides an overlay's shader code: its blend and which of its parts it carries. */
export interface IMaterialOverlayShape {
  /** Whether the colour tints the base colour or replaces it. */
  blend: "multiply" | "replace";
  /** Whether the overlay sets its own roughness. */
  roughness: boolean;
  /** Whether the overlay carries a normal map. */
  normal: boolean;
}

/** The vertex shader passing each overlay image's transformed UV. */
export const materialOverlayVertex = (
  vertexShader: string,
  shapes: readonly IMaterialOverlayShape[],
): string => {
  const declarations: string[] = [];
  const assignments: string[] = [];
  shapes.forEach((shape, i) => {
    declarations.push(
      `uniform mat3 overlayColorTransform${i};`,
      `varying vec2 vOverlayColorUv${i};`,
    );
    assignments.push(
      `vOverlayColorUv${i} = ( overlayColorTransform${i} * vec3( uv, 1.0 ) ).xy;`,
    );
    if (shape.normal) {
      declarations.push(
        `uniform mat3 overlayNormalTransform${i};`,
        `varying vec2 vOverlayNormalUv${i};`,
      );
      assignments.push(
        `vOverlayNormalUv${i} = ( overlayNormalTransform${i} * vec3( uv, 1.0 ) ).xy;`,
      );
    }
  });
  return vertexShader
    .replace(
      "#include <common>",
      ["#include <common>", ...declarations].join("\n"),
    )
    .replace(
      "#include <uv_vertex>",
      ["#include <uv_vertex>", ...assignments].join("\n\t"),
    );
};

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
      `varying vec2 vOverlayColorUv${i};`,
    );
    colours.push(
      `vec4 overlayColor${i} = texture2D( overlayColorMap${i}, vOverlayColorUv${i} );`,
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
        `overlayN${i}.xy *= overlayNormalScale${i} * overlayStrength${i};`,
        `mapN = normalize( vec3( mapN.xy + overlayN${i}.xy, mapN.z * overlayN${i}.z ) );`,
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
