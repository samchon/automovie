import type { IMaterialOverlayShape } from "./IMaterialOverlayShape.js";

/** The vertex shader passing each overlay image's transformed UV. */
export const materialOverlayVertex = (
  vertexShader: string,
  shapes: readonly IMaterialOverlayShape[],
): string => {
  const declarations: string[] = [];
  const assignments: string[] = [];
  shapes.forEach((shape, i) => {
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

