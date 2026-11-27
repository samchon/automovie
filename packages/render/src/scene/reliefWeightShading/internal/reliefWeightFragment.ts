import * as THREE from "three";

import { AutoMovieRenderReliefWeightTarget } from "../../AutoMovieRenderReliefWeightTarget.js";

/*
 * Multiply base normal-map slopes by interpolated relief after their native
 * scale. The native chunk is expanded only when still present; a shader with no
 * scale boundary is refused rather than leaving the material unmodified.
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
  if (!expanded.includes(AutoMovieRenderReliefWeightTarget))
    throw new Error(
      "The normal-map chunk no longer scales its slopes where the relief weight applies.",
    );
  return expanded
    .replace(
      "#include <common>",
      "#include <common>\nvarying float vReliefWeight;",
    )
    .replace(
      AutoMovieRenderReliefWeightTarget,
      `${AutoMovieRenderReliefWeightTarget}\n\tmapN.xy *= vReliefWeight;`,
    );
};
