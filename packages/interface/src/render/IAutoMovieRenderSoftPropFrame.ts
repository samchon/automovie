import type { AutoMovieSoftAnalysisStatus } from "../soft/AutoMovieSoftAnalysisStatus";
import type { IAutoMovieSoftBodySurface } from "../soft/IAutoMovieSoftBodySurface";

/**
 * Plain soft prop data for one film instant, supplied by the performance host.
 * The surface holds world-metre coordinates and carries its solver step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the film identity, coordinate frame, producer status and radius units.
 * @evidence contracts/development/design.md#principled-representation Cloth uses its indexed surface, and a cord uses the particle positions of an unindexed surface with a positive radius. Numeric and topology admission remains at projection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A scene and its capture feed share one record. Cloth topology and analysis status keep their engine-owned types.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No solver, performance, native object or backend is part of the record.
 */
export interface IAutoMovieRenderSoftPropFrame {
  /** Stable identity of the performance subject, distinct from the reusable domain id. */
  subject: string;

  /** The engine's projection at the supplied instant. */
  surface: IAutoMovieSoftBodySurface;

  /** The producer's outcome for this state. */
  status: AutoMovieSoftAnalysisStatus;

  /** Cord radius in metres, declared only for a one-wide lattice. */
  cordRadius?: number;
}
