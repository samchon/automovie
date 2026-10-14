/**
 * A girth or breadth read on the one plane through a named skin point.
 *
 * @evidence contracts/common.md#principled-implementation A level landmark places one plane; the segment seed selects its nearest closed loop for tape girth or horizontal breadth.
 * @evidence contracts/common.md#clear-and-simple-design The same record supplies kind, segment and plane placement to the section reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The horizontal choice is an instrument orientation; missing level landmarks cannot be replaced by an arbitrary station.
 * @evidence contracts/common.md#meaningful-documentation Members explain the kept loop, plane witness and missing-landmark limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The level section rules declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The level section rules schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The level section rules type acquires no handles, tasks or retained storage.
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
