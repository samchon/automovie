/**
 * Interpolate the mesh's reliefWeight attribute into the fragment stage.
 * The owning mesh supplies the attribute; this transformation adds no fallback
 * value that could conceal an absent per-vertex input.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Passes authored per-vertex relief strength to material shading.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Interpolates the relief weight across each drawn triangle.
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
