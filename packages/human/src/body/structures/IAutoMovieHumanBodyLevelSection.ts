/**
 * A girth or breadth read on the one plane through a named skin point.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyLevelSection {
  /** Tape girth (convex-hull perimeter) or X breadth of the kept loop. */
  kind: "girth" | "breadth";

  /** Landmark id where the segment starts; the loop nearest its point on the plane is kept. */
  from: string;

  /** Landmark id where the segment ends. */
  to: string;

  /**
   * The basis skin landmark (`IAutoMovieHumanBodyBasis.skinLandmarks`) the one
   * plane passes through, by name. A basis that does not declare it cannot
   * answer the rule.
   */
  level: string;

  /** Cut horizontally (trunk girths) instead of perpendicular to the segment. */
  horizontal: boolean;
}
