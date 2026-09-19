import { IAutoMovieSurface } from "@automovie/interface";
import { prepareSurface } from "./prepareSurface";
import { preparedSurfaceContains } from "./preparedSurfaceContains";

/**
 * Is `(x, z)` on the surface's footprint?
 *
 * Classified against the authored rings, not against their convex hull. That
 * distinction is the whole of #1868: a hull is always a superset, so an
 * L-shaped plate answered "yes" inside its own notch and a slab with an atrium
 * void answered "yes" over the void — silently, in the one query feet, props,
 * crowds and the camera base all read. `validateSpace` refused those footprints
 * precisely because this query could not tell the truth about them; it can now,
 * so they are authored instead of forbidden.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `surfaceContains` answers "Is `(x, z)` on the surface's footprint?" This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surfaceContains` performs contains surface evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 */
export const surfaceContains = (
  surface: IAutoMovieSurface,
  x: number,
  z: number,
): boolean => preparedSurfaceContains(prepareSurface(surface), x, z);
