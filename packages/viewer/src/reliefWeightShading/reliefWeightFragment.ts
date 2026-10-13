import * as THREE from "three";
import { RELIEF_WEIGHT_TARGET } from "./RELIEF_WEIGHT_TARGET.js";

/**
 * Multiply base normal-map slopes by interpolated relief after their native
 * scale. The native chunk is expanded only when still present; a shader with
 * no scale boundary is refused rather than leaving the material unmodified.
 */
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
