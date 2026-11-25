import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";

/**
 * Where on a region a touch lands: a region is a patch of skin, not one point,
 * so a touch names a place on it. The place is stated by the author, drawn by
 * the seed, or chosen by a rule; on a prop's contact that has a length, it is a
 * share along that length (`along`, `span`).
 *
 * A place is an offset in the region's own surface: `up` along the surface
 * toward the head (the world's up laid into the surface) and `out` to the right
 * of someone facing the surface. On a level surface, where the world's up has
 * no direction in it, `up` is the world's forward.
 */
export namespace IAutoMovieMotionHumanTouchSite {
  /**
   * A site on a region: an offset stated in metres, a place drawn by the seed
   * within a radius, or the place within a radius the rule chooses. `reach` is
   * the place nearest the touching arm's shoulder, the shortest reach (reach
   * rule).
   */
  export type ISite =
    | {
        /** Along the surface toward the head, metres; 0 when absent. */
        up?: number;

        /** To the right of someone facing the surface, metres; 0 when absent. */
        out?: number;
      }
    | {
        /**
         * The radius the seed draws the place within, metres, uniform over the
         * disc.
         */
        draw: number;
      }
    | {
        /** The rule. */
        rule: "reach";

        /** The radius the rule chooses within, metres. */
        within: number;
      }
    | {
        /**
         * On a prop's contact that has a length (a handle, a bar, a ledge): how
         * far along it from its middle, as a share of that length in [-0.5,
         * 0.5], toward the contact's own `+X`.
         */
        along: number;
      };

  /** A region's point and outward unit normal. */
  export type IFrame = Pick<
    IAutoMovieMotionHumanTarget.IPlace,
    "point" | "normal"
  >;
}
