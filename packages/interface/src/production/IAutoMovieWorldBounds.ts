import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned world-meter volume bounding an environmental effect zone.
 *
 * @evidence contracts/common.md#principled-implementation Finite corners in [-1e9,1e9] with min strictly below max are the intended authored domain; the retired world gate no longer enforces it. Effect materialization copies this spawn box, while sampling adds wind/rise/turbulence drift afterward; the box does not enclose every particle throughout its lifetime.
 * @evidence contracts/common.md#clear-and-simple-design Two vectors specify a zone independently from its recipe, seed and activation timing, which stay on their respective records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The volume is explicitly authored rather than inferred from a landmark or visible mesh. Materialization copies extents without repairing or completely admitting them, so callers must establish ordered representable bounds.
 * @evidence contracts/common.md#meaningful-documentation Defines world-meter corner coordinates and effect-volume ownership.
 */
export interface IAutoMovieWorldBounds {
  /** Component-wise minimum world corner in meters. */
  min: IAutoMovieVector3;

  /** Component-wise maximum world corner in meters. */
  max: IAutoMovieVector3;
}
