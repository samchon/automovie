import * as THREE from "three";
import { DETAIL_NORMAL_TARGET } from "./DETAIL_NORMAL_TARGET.js";

/**
 * Insert code into the tangent-space branch of three's normal-map chunk,
 * just before the frame turns `mapN` into the normal, expanding the chunk
 * first unless an earlier patch already did, so patches that bend the
 * tangent-space normal compose in the order they run.
 *
 * @evidence contracts/common.md#principled-implementation Expands the installed native normal-map chunk when still included and inserts code immediately before its supported tangent-to-surface line, retaining that line for later ordered patches; exact pinned chunk/anchor compatibility is required and absence throws rather than silently applying a different projection.
 * @evidence contracts/common.md#clear-and-simple-design One insertion owner serves detail/relief normal operations and composes with an already-expanded shader, avoiding competing custom tangent-frame solvers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads the real installed ShaderChunk and exact supported projection marker rather than fixture shader text or a patched global chunk; no default-normal or different branch hides a missing compatibility boundary.
 * @evidence contracts/common.md#meaningful-documentation Explains native expansion, preserved tangent boundary and ordered composition; the thrown error identifies the unsupported native projection point.
 * @evidence contracts/performance.md#efficient-algorithms Fixed includes/replacements visit shader bytes linearly and expand one constant native chunk, O(source+injected-code) result storage; no mesh, texture or renderer traversal is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work Detects and reuses prior native chunk expansion while retaining the target marker so successive distinct patches compose once in registration order; repeated identical patch insertion is not deduplicated by this primitive.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Acquires no native shader/program/texture handle and retains no caller input; returned text owns only source bytes, with temporary expansion strings released after the call.
 */
export const spliceTangentNormal: (fragmentShader: string, code: string) => string = (
  fragmentShader: string,
  code: string,
): string => {
  const expanded: string = fragmentShader.includes("#include <normal_fragment_maps>")
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
