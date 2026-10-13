/**
 * Interpolate the mesh's reliefWeight attribute into the fragment stage.
 * The owning mesh supplies the attribute; this transformation adds no fallback
 * value that could conceal an absent per-vertex input.
 */
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
