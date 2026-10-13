import * as THREE from "three";
import { DETAIL_NORMAL_TARGET } from "./DETAIL_NORMAL_TARGET.js";

/**
 * Insert code into the tangent-space branch of three's normal-map chunk,
 * just before the frame turns `mapN` into the normal, expanding the chunk
 * first unless an earlier patch already did, so patches that bend the
 * tangent-space normal compose in the order they run.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Composes the declared material's tangent-space normal changes into one program.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the ordered composition of normal blends at the render boundary.
 */
export const spliceTangentNormal = (
  fragmentShader: string,
  code: string,
): string => {
  const expanded = fragmentShader.includes("#include <normal_fragment_maps>")
    ? fragmentShader.replace(
        "#include <normal_fragment_maps>",
        THREE.ShaderChunk.normal_fragment_maps,
      )
    : fragmentShader;
  if (!expanded.includes(DETAIL_NORMAL_TARGET))
    throw new Error(
      "The normal-map chunk no longer has the tangent-space line normal blends splice into.",
    );
  return expanded.replace(
    DETAIL_NORMAL_TARGET,
    `${code}\n\t${DETAIL_NORMAL_TARGET}`,
  );
};
