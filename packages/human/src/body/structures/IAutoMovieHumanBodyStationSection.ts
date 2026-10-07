/**
 * A girth or breadth read over stations along a landmark segment: planes at
 * evenly spaced fractions, the largest, smallest or rearmost reading kept.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyStationSection {
  /** Tape girth (convex-hull perimeter) or X breadth of the kept loop. */
  kind: "girth" | "breadth";

  /** Landmark id where the segment the sections walk along starts. */
  from: string;

  /** Landmark id where the segment ends. */
  to: string;

  /** Fractions of the segment, inclusive, sampled at `steps` evenly spaced planes. */
  range: [number, number];

  /** Number of sampled planes. */
  steps: number;

  /**
   * Take the largest or the smallest value over the sampled planes, or the
   * value on the plane whose loop reaches furthest back (the least Z; the
   * body faces +Z), where ANSUR takes the buttock circumference.
   */
  pick: "max" | "min" | "rearmost";

  /** Cut horizontally (trunk girths) instead of perpendicular to the segment. */
  horizontal: boolean;
}
