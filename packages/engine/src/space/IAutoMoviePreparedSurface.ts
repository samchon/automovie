import { IAutoMovieSurface } from "@automovie/interface";
import { IAutoMovieFootprint } from "./IAutoMovieFootprint";

/**
 * Prepared footprint for one surface. Build once when checking many points
 * against the same static polygon.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `IAutoMoviePreparedSurface` represents prepared footprint for one surface. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `IAutoMoviePreparedSurface` structures prepared footprint for one surface for the system that resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export interface IAutoMoviePreparedSurface {
  /**
   * The source surface whose height/identity remains authoritative.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `surface` records `IAutoMoviePreparedSurface`'s source surface whose height/identity remains authoritative. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surface` supplies `IAutoMoviePreparedSurface`'s source surface whose height/identity remains authoritative when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly surface: IAutoMovieSurface;

  /**
   * The exact plan region of {@link IAutoMovieSurface.polygon} and its holes.
   *
   * This used to be the footprint's convex hull, which is why an L-shaped plate
   * had to be refused: a hull fills the notch, and a hull of a holed slab fills
   * the atrium. The region carried here is the rings themselves.
   *
   * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `footprint` records `IAutoMoviePreparedSurface`'s exact plan region of `IAutoMovieSurface.polygon` and its holes. This ensures marks and supports resolve against their declared host geometry.
   * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `footprint` supplies `IAutoMoviePreparedSurface`'s exact plan region of `IAutoMovieSurface.polygon` and its holes when the engine resolves host-relative support geometry and whole-footprint zone membership.
   */
  readonly footprint: IAutoMovieFootprint;
}
