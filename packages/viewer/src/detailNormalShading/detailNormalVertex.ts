/**
 * Pass the detail map's own transformed first UV set to the fragment stage.
 * The caller supplies the native shader chunks and retains the input string.
 *
 * @evidence contracts/common.md#principled-implementation Declares the Matrix3 transform/varying and computes its transformed first UV after Three's native UV chunk; caller shader must contain both supported anchors and a valid uv attribute. Missing anchors are not refused here and can lead to later native compile failure.
 * @evidence contracts/common.md#clear-and-simple-design Owns only detail UV projection text, leaving transform capture to createDetailNormalShaderPatch and tangent-normal blending to the fragment owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual first-UV values and captured binding matrix without fixture coordinates, extra UV duplication or replacing native shader methods.
 * @evidence contracts/common.md#meaningful-documentation States detail map's own transformed first UV and native-source ownership; implementation answer makes exact chunk compatibility and current missing-anchor limitation explicit.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed replacements cost O(shader source length) temporary string work; compiled vertex shader adds one Matrix3/vector operation and varying per vertex rather than CPU vertex-buffer rewrites.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses native UV production and the registered transform uniform without recomputing texture transforms per vertex on CPU; this source transform caches no mutable shader result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows one source string and transfers the edited string, retaining no geometry, texture or task; memory is input-sized plus fixed declaration/projection text.
 */
export const detailNormalVertex: (vertexShader: string) => string = (vertexShader: string): string =>
  vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nuniform mat3 detailNormalTransform;\nvarying vec2 vDetailNormalUv;",
    )
    .replace(
      "#include <uv_vertex>",
      "#include <uv_vertex>\n\tvDetailNormalUv = ( detailNormalTransform * vec3( uv, 1.0 ) ).xy;",
    );
