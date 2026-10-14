import * as THREE from "three";

import { RELIEF_WEIGHT_TARGET } from "./RELIEF_WEIGHT_TARGET.js";

/**
 * Multiply base normal-map slopes by interpolated relief after their native scale. The native chunk is expanded only when still present; a shader with no scale boundary is refused rather than leaving the material unmodified.
 *
 * @evidence contracts/common.md#principled-implementation Expands the installed native normal-map chunk when present, requires its actual slope-scale boundary and inserts unchanged interpolated relief multiplication immediately after it.
 * @evidence contracts/common.md#clear-and-simple-design A source transformation remains separate from vertex interpolation and material registration, preserving downstream detail/overlay ordering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing slope target refuses instead of silently leaving slopes unchanged; common-marker presence and tangent-normal compilation profile remain required and generated text alone is not device shading proof.
 * @evidence contracts/common.md#meaningful-documentation Documents native chunk expansion, required scale boundary and why unsupported source must refuse.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of includes/replacements scans S shader bytes and creates proportional returned strings; no texel or vertex data is copied.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent source/installed native chunk gives equivalent text, while native program reuse belongs to the material stable-key chain rather than a mutable local cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary and returned strings exist; no GPU shader/program or material lifetime is acquired by this helper.
 */
export const reliefWeightFragment: (fragmentShader: string) => string = (
  fragmentShader: string,
): string => {
  const expanded: string = fragmentShader.includes(
    "#include <normal_fragment_maps>",
  )
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
