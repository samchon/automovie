import type { IAutoMovieHumanBodyBasisSurface } from "../structures/surface/IAutoMovieHumanBodyBasisSurface";

type Region = IAutoMovieHumanBodyBasisSurface["regions"][number];

/**
 * Give body UV corners the exact Float32 coordinates the renderer uploads.
 *
 * The basis retains its original finite UV numbers. Rendering and GLB export both store UV attributes as Float32, so two source corners that round to the same pair cannot differ at sampling time. Canonicalizing before the fixed region correspondence is compiled merges only those identical GPU corners. Distinct Float32 pairs, including real atlas seams, stay distinct; no pixel-size tolerance or anatomy-dependent welding is introduced. The body renderer and contact segmenter use this same derived region so a build's output corner order still matches its source-vertex partition.
 *
 * @evidence contracts/common.md#principled-implementation Source UV coordinates are rounded with Math.fround before region correspondence uses them, aligning render-seam identity with the Float32 attributes uploaded and exported.
 * @evidence contracts/common.md#clear-and-simple-design Untextured regions reuse their record; textured regions copy only the UV array while retaining the admitted region's other authored properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equality follows the actual Float32 representation, without pixel/anatomical welding tolerances; admitted finite UVs remain a caller premise and this conversion does not certify geometry or contact.
 * @evidence contracts/common.md#meaningful-documentation The comment explains source precision, GPU/export precision, retained genuine seams and shared corner-order consumers.
 * @evidence contracts/performance.md#efficient-algorithms A textured region performs one linear UV-coordinate pass and allocates one derived array; untextured regions return in constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Body region compilation and contact correspondence consume the same conversion rule; their owners retain compiled correspondence while this pure helper owns no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A copied textured record owns its UV array and shares the caller's other fields; no temporary source geometry or external resource remains retained by this function after return.
 */
export function humanBodyGpuRegion(region: Region): Region {
  return region.uvs === null
    ? region
    : {
        ...region,
        uvs: region.uvs.map((value: number): number => Math.fround(value)),
      };
}
