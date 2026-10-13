/**
 * Pass the detail map's own transformed first UV set to the fragment stage.
 * The caller supplies the native shader chunks and retains the input string.
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
