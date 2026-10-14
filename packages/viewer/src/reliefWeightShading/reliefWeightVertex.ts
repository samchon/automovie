/**
 * Interpolate the mesh's reliefWeight attribute into the fragment stage. The owning mesh supplies the attribute; this transformation adds no fallback value that could conceal an absent per-vertex input.
 *
 * @evidence contracts/common.md#principled-implementation Inserts the original reliefWeight attribute/varying declaration and assignment at the supported Three common/begin_vertex markers.
 * @evidence contracts/common.md#clear-and-simple-design Vertex interpolation stays distinct from fragment slope scaling and material patch registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fabricated default conceals a missing mesh attribute; supported markers are a premise and this string transformation does not independently validate compilation or pixels.
 * @evidence contracts/common.md#meaningful-documentation Documents owner-supplied attribute and interpolation without implying a fallback for absent per-vertex data.
 * @evidence contracts/performance.md#efficient-algorithms Two fixed replacements scan S source bytes with proportional returned string storage and no geometry-buffer allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The unchanged source operation contributes stable program structure while actual attributes vary per mesh; no source cache or runtime attribute memo exists here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only shader strings escape and no attribute buffer, material, shader or native program is acquired.
 */
export const reliefWeightVertex: (vertexShader: string) => string = (vertexShader: string): string =>
  vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nattribute float reliefWeight;\nvarying float vReliefWeight;",
    )
    .replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\n\tvReliefWeight = reliefWeight;",
    );
