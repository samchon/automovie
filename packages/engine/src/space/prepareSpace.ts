import { IAutoMovieSpace } from "@automovie/interface";

import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSurface } from "./prepareSurface";

/**
 * Prepare every authored surface's rings and areas for repeated space queries.
 *
 * @evidence contracts/common.md#principled-implementation Each surface preserves its outer ring and holes through prepareSurface; the source space is borrowed and this pass performs no geometry admission.
 * @evidence contracts/common.md#clear-and-simple-design One space wrapper groups prepared surfaces in authored order, preserving topmost-query tie behavior without a spatial index or hull substitution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Concavity and holes are retained; mutable source edits are not observed or silently reconciled with previously projected coordinates.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed space/surface identity, fresh prepared wrappers and projection invalidation after source changes.
 * @evidence contracts/performance.md#efficient-algorithms S surfaces with E total ring vertices take O(S+E) work and owned projection storage, required to prepare every query candidate.
 * @evidence contracts/performance.md#reuse-equivalent-work The resulting generation can serve multiple queries; callers rebuild after source mutation rather than relying on identity alone as a revision key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the result and projected arrays, which retain source space and surfaces until discarded; there are no active tasks or handles.
 */
export const prepareSpace: (
  space: IAutoMovieSpace,
) => IAutoMoviePreparedSpace = (
  space: IAutoMovieSpace,
): IAutoMoviePreparedSpace =>
  ({
    space,
    surfaces: space.surfaces.map(prepareSurface),
  }) satisfies IAutoMoviePreparedSpace;
