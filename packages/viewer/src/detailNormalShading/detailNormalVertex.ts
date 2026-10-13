/**
 * Pass the detail map's own transformed first UV set to the fragment stage.
 * The caller supplies the native shader chunks and retains the input string.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Carries the declared detail texture transform separately from the base normal map.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Supplies the detail normal sampler with its transformed UV coordinates.
 */
export const detailNormalVertex = (vertexShader: string): string =>
  vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nuniform mat3 detailNormalTransform;\nvarying vec2 vDetailNormalUv;",
    )
    .replace(
      "#include <uv_vertex>",
      "#include <uv_vertex>\n\tvDetailNormalUv = ( detailNormalTransform * vec3( uv, 1.0 ) ).xy;",
    );
