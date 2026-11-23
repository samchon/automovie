import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMoviePropBox } from "../harness/IAutoMoviePropBox";

/** Corner-containment query for a world box and a logical building subtree. */
export namespace IAutoMoviePropSpaceContainsBounds {
  /**
   * Whether a world volume lies inside a logical space or the spaces below it.
   *
   * Each of the box's eight corners must lie in some space of the subtree, read
   * through `builtSpaceContainsPoint`, the same per-space rule
   * `builtEnvironmentContainsPoint` folds. The corners may lie in different
   * child spaces, and because only corners are tested, a box whose corners are
   * inside a non-convex space while its middle crosses a notch is accepted.
   *
   * A subtree that states no volume at all locates nothing, so it excludes
   * nothing and the answer is `true`: a purely semantic container such as "the
   * west wing" is a name, not a boundary, and refusing props inside it would
   * invent a geometric claim the author never made. An undeclared space throws
   * the `Error` of `requireBuiltSpace`. The prop placement gate and the service
   * network gate judge `in-space` containment with it.
   */
  export type IProps = {
    /**
     * Borrowed building whose space tree and stated volumes define containment;
     * no registry or box is mutated.
     */
    environment: IAutoMovieBuiltEnvironment;
    /**
     * Exact root-space id. requireBuiltSpace throws when undeclared;
     * descendants participate through builtSpaceSubtree.
     */
    space: string;
    /**
     * Borrowed world-axis-aligned box in metres. All eight corners must belong
     * to some subtree volume, unless the subtree states no volume at all.
     */
    bounds: IAutoMoviePropBox;
  };
}
