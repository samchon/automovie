import type { IAutoMovieInspectionDrawable } from "./IAutoMovieInspectionDrawable";

/**
 * World-space object boxes and a path pattern for isolating inspection units.
 * expandAutoMovieInspectionSweep validates finite ordered bounds and a finite
 * nonnegative margin, selects topmost matching units, and throws if the pattern
 * matches none. It preserves source order and does not own scene objects.
 */
export interface IAutoMovieInspectionSweepProps {
  /** Drawn objects by path, with their world-space boxes in metres. */
  objects: readonly IAutoMovieInspectionDrawable[];

  /** Path pattern of the units, under the inspection path grammar. */
  pattern: string;

  /** Distance in metres a neighbour's box may lie from the unit's box. */
  margin: number;
}
