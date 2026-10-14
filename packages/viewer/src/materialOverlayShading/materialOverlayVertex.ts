import type { IMaterialOverlayShape } from "./IMaterialOverlayShape.js";

/**
 * The vertex shader passing each overlay image's transformed UV.
 *
 * @evidence contracts/common.md#principled-implementation Adds one transformed colour UV per layer and optional transformed normal UV at the installed Three common/uv markers.
 * @evidence contracts/common.md#clear-and-simple-design Vertex varying generation is separate from fragment composition and actual texture matrix uniforms, retaining the original source around supported markers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The original uv coordinate and layer ordering remain unchanged; missing SDK markers are not detected as a successful native shader build by this string helper.
 * @evidence contracts/common.md#meaningful-documentation Documentation names transformed per-image UVs, marker premises and lack of an independent compile/render verdict.
 * @evidence contracts/performance.md#efficient-algorithms Layer statement construction is O(L) plus a fixed number of S-byte replacements, with generated string storage proportional to input source and enabled layer fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Ordered structural shapes govern program-source equivalence while actual texture transforms remain per-material uniforms; this function maintains no mutable source cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary source arrays and the returned string are retained by their consumer; the function acquires no geometry, attribute buffer or shader program.
 */
export const materialOverlayVertex: (
  vertexShader: string,
  shapes: readonly IMaterialOverlayShape[],
) => string = (
  vertexShader: string,
  shapes: readonly IMaterialOverlayShape[],
): string => {
  const declarations: string[] = [];
  const assignments: string[] = [];
  shapes.forEach((shape: IMaterialOverlayShape, i: number): void => {
    declarations.push(
      `uniform mat3 overlayColorTransform${i};`,
      `varying vec2 vOverlayColorUv${i};`,
    );
    assignments.push(
      `vOverlayColorUv${i} = ( overlayColorTransform${i} * vec3( uv, 1.0 ) ).xy;`,
    );
    if (shape.normal) {
      declarations.push(
        `uniform mat3 overlayNormalTransform${i};`,
        `varying vec2 vOverlayNormalUv${i};`,
      );
      assignments.push(
        `vOverlayNormalUv${i} = ( overlayNormalTransform${i} * vec3( uv, 1.0 ) ).xy;`,
      );
    }
  });
  return vertexShader
    .replace(
      "#include <common>",
      ["#include <common>", ...declarations].join("\n"),
    )
    .replace(
      "#include <uv_vertex>",
      ["#include <uv_vertex>", ...assignments].join("\n\t"),
    );
};
