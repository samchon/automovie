import type { IAutoMovieCaptureSubject } from "../capture/IAutoMovieCaptureSubject.js";

/**
 * World-space object boxes and a path pattern for isolating inspection units. expandAutoMovieInspectionSweep validates finite ordered bounds and a finite nonnegative margin, selects topmost matching units, and throws if the pattern matches none. It preserves source order and does not own scene objects.
 *
 * @evidence contracts/development/design.md#principled-representation It preserves source order and does not own scene objects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface expandAutoMovieInspectionSweep exchanges objects, pattern, margin; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It preserves source order and does not own scene objects.
 * @evidence contracts/development/common.md#meaningful-documentation World-space object boxes and a path pattern for isolating inspection units. expandAutoMovieInspectionSweep validates finite ordered bounds and a finite nonnegative margin, selects topmost matching units, and throws if the pattern matches none. The prose and members document how expandAutoMovieInspectionSweep interprets and admits these values.
 */
export interface IAutoMovieInspectionSweepProps {
  /** Drawn objects by path, with their world-space boxes in metres. */
  objects: readonly IAutoMovieCaptureSubject.IDrawable[];

  /** Path pattern of the units, under the inspection path grammar. */
  pattern: string;

  /** Distance in metres a neighbour's box may lie from the unit's box. */
  margin: number;
}
