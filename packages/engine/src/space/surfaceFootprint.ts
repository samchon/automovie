import { IAutoMovieSurface } from "@automovie/interface";

import { IAutoMovieFootprint } from "./IAutoMovieFootprint";
import { footprintRing } from "./footprintRing";

/**
 * Project a surface's outer ring and optional holes into one footprint record.
 *
 * @evidence contracts/common.md#principled-implementation The canonical ring owner computes XZ projections and signed doubled areas in authored order; omitted holes become an empty list and source world points remain borrowed.
 * @evidence contracts/common.md#clear-and-simple-design This representation owner preserves the actual region independently of height rules or downstream triangulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ring is replaced by its hull and no invalid hole arrangement is corrected; region admission and numerical representability remain separate prerequisites.
 * @evidence contracts/common.md#meaningful-documentation Documents absent-hole meaning, borrowed point ownership, fresh derived projections and invalidation after mutation.
 * @evidence contracts/performance.md#efficient-algorithms E total outer/hole vertices and H hole records take O(E+H) work and owned projection/wrapper storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Each ring is projected once for this footprint, which preparation callers reuse; fresh source revisions require rebuilding rather than identity-based caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh footprint and plans retaining authored world rings until discarded; no GPU or host resource is acquired.
 */
export const surfaceFootprint: (
  surface: IAutoMovieSurface,
) => IAutoMovieFootprint = (
  surface: IAutoMovieSurface,
): IAutoMovieFootprint => ({
  outer: footprintRing(surface.polygon),
  holes: (surface.holes ?? []).map(footprintRing),
});
