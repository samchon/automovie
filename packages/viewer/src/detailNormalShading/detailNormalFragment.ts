import { spliceTangentNormal } from "./spliceTangentNormal.js";

/**
 * Blend detail slopes into the base tangent-space normal by whiteout blending.
 * The shared splice owner expands the native chunk once and refuses a shader
 * with no supported tangent-space projection boundary.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Combines the declared detail normal and base normal without replacing either slope contribution.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Applies detail strength before projecting the combined tangent normal.
 */
export const detailNormalFragment = (fragmentShader: string): string =>
  spliceTangentNormal(
    fragmentShader.replace(
      "#include <common>",
      "#include <common>\nuniform sampler2D detailNormalMap;\nuniform float detailNormalScale;\nvarying vec2 vDetailNormalUv;",
    ),
    `vec3 detailN = texture2D( detailNormalMap, vDetailNormalUv ).xyz * 2.0 - 1.0;
	detailN.xy *= detailNormalScale;
	mapN = normalize( vec3( mapN.xy + detailN.xy, mapN.z * detailN.z ) );`,
  );
