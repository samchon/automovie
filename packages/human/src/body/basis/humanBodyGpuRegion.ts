import type { IAutoMovieHumanBodyBasisSurface } from "../structures/surface/IAutoMovieHumanBodyBasisSurface";

type Region = IAutoMovieHumanBodyBasisSurface["regions"][number];

/**
 * Give body UV corners the exact Float32 coordinates the renderer uploads.
 *
 * The basis retains its original finite UV numbers. Rendering and GLB export
 * both store UV attributes as Float32, so two source corners that round to
 * the same pair cannot differ at sampling time. Canonicalizing before the
 * fixed region correspondence is compiled merges only those identical GPU
 * corners. Distinct Float32 pairs, including real atlas seams, stay distinct;
 * no pixel-size tolerance or anatomy-dependent welding is introduced.
 * The body renderer and contact segmenter use this same derived region so a
 * build's output corner order still matches its source-vertex partition.
 */
export function humanBodyGpuRegion(region: Region): Region {
  return region.uvs === null
    ? region
    : { ...region, uvs: region.uvs.map((value) => Math.fround(value)) };
}
