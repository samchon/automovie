/**
 * A girth or breadth read over stations along a landmark segment: planes at
 * evenly spaced fractions, the largest, smallest or rearmost reading kept.
 *
 * @evidence contracts/common.md#principled-implementation Evenly spaced inclusive stations sample section loops; max, min or least-Z selection chooses the reported girth or breadth.
 * @evidence contracts/common.md#clear-and-simple-design Plane placement and reduction choice live in the same instrument rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Station sampling is an explicit approximation and does not claim a continuous extremum between planes.
 * @evidence contracts/common.md#meaningful-documentation Members state fractions, sample count, body-facing direction and horizontal orientation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The sampled section station rules definition supplies no executable processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The sampled section station rules type neither schedules requests nor caches results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The sampled section station rules declaration does not acquire or retain runtime resources.
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
