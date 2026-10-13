import * as THREE from "three";
import { DETAIL_NORMAL_TARGET } from "./DETAIL_NORMAL_TARGET.js";

/**
 * Insert code into the tangent-space branch of three's normal-map chunk,
 * just before the frame turns `mapN` into the normal, expanding the chunk
 * first unless an earlier patch already did, so patches that bend the
 * tangent-space normal compose in the order they run.
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
