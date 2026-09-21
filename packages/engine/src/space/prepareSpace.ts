import { IAutoMovieSpace } from "@automovie/interface";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
import { prepareSurface } from "./prepareSurface";

/**
 * Precompute every surface footprint hull in a space.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `prepareSpace` precomputes every surface footprint hull in a space. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `prepareSpace` performs space preparation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export const prepareSpace = (space: IAutoMovieSpace): IAutoMoviePreparedSpace =>
  ({
    space,
    surfaces: space.surfaces.map(prepareSurface),
  }) satisfies IAutoMoviePreparedSpace;
