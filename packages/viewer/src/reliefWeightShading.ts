import * as THREE from "three";

import { addMaterialShaderPatch } from "./materialShaderPatches";

/** The line of three's normal-map chunk that scales the normal map's slopes. */
export const RELIEF_WEIGHT_TARGET = "mapN.xy *= normalScale;";

/**
 * Scale a material's normal-map slopes by each vertex's relief weight (the
 * mesh's `reliefWeight` attribute, interpolated across the triangle), before
 * any detail map or overlay blends in, so a relief deepens or flattens
 * across the surface while the finer detail stays even. The material must
 * carry a tangent-space `normalMap`, and every mesh drawn with it must carry
 * the attribute.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a mesh's per-vertex relief strength into its render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the per-vertex normal-map strength at the render boundary.
 */
export const applyReliefWeights = (material: THREE.Material): void => {
  addMaterialShaderPatch(material, {
    key: "automovie-relief-weights",
    apply: (shader) => {
      shader.vertexShader = reliefWeightVertex(shader.vertexShader);
      shader.fragmentShader = reliefWeightFragment(shader.fragmentShader);
    },
  });
};

/** The vertex shader passing each vertex's relief weight. */
export const reliefWeightVertex = (vertexShader: string): string =>
  vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nattribute float reliefWeight;\nvarying float vReliefWeight;",
    )
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n\tvReliefWeight = reliefWeight;",
    );

/** The fragment shader scaling the normal map's slopes by the relief weight. */
export const reliefWeightFragment = (fragmentShader: string): string => {
  const expanded = fragmentShader.includes("#include <normal_fragment_maps>")
    ? fragmentShader.replace(
        "#include <normal_fragment_maps>",
        THREE.ShaderChunk.normal_fragment_maps,
      )
    : fragmentShader;
  if (!expanded.includes(RELIEF_WEIGHT_TARGET))
    throw new Error(
      "The normal-map chunk no longer scales its slopes where the relief weight applies.",
    );
  return expanded
    .replace(
      "#include <common>",
      "#include <common>\nvarying float vReliefWeight;",
    )
    .replace(
      RELIEF_WEIGHT_TARGET,
      `${RELIEF_WEIGHT_TARGET}\n\tmapN.xy *= vReliefWeight;`,
    );
};
