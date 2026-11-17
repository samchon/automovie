import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";

/**
 * Where on a region a touch lands (#3357): a region is a patch of skin, not
 * one point, so a touch names a place on it. The place is stated by the
 * author, drawn by the seed, or chosen by a rule; on a prop's contact that
 * has a length, it is a share along that length (`along`, `span`).
 *
 * A place is an offset in the region's own surface: `up` along the surface
 * toward the head (the world's up laid into the surface) and `out` to the
 * right of someone facing the surface. On a level surface, where the world's
 * up has no direction in it, `up` is the world's forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation up: Along the surface toward the head, metres; 0 when absent. out: To the right of someone facing the surface, metres; 0 when absent. draw: The radius the seed draws the place within, metres, uniform over the disc.
 * @evidence contracts/development/design.md#principled-representation up: Along the surface toward the head, metres; 0 when absent. out: To the right of someone facing the surface, metres; 0 when absent. draw: The radius the seed draws the place within, metres, uniform over the disc.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/touchHold.ts (touchHold.region, perceived); touch/touchHold.ts (touchHold.region, held); touch/touchHold.ts (touchHold.region, return); touch/touchHold.ts (touchHold.perceived, perceived); touch/touchHold.ts (touchHold.perceived, return); touch/touchRegion.ts (touchRegion.reader, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchSite {
  /**
   * A site on a region: an offset stated in metres, a place drawn by the
   * seed within a radius, or the place within a radius the rule chooses.
   * `reach` is the place nearest the touching arm's shoulder, the shortest
   * reach (#3357's reach rule).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three forms, the unit and what the one rule chooses.
   * @evidence contracts/development/design.md#principled-representation The three ways a site is chosen as one closed union: fixed, drawn, ruled.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three forms, each read by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the author's, in metres, because a region's frame carries no extent to read one from.
   */
  export type ISite =
    | {
        /** Along the surface toward the head, metres; 0 when absent. */
        up?: number;

        /** To the right of someone facing the surface, metres; 0 when absent. */
        out?: number;
      }
    | {
        /** The radius the seed draws the place within, metres, uniform over the disc. */
        draw: number;
      }
    | {
        /** The rule. */
        rule: "reach";

        /** The radius the rule chooses within, metres. */
        within: number;
      }
    | {
        /** On a prop's contact that has a length (a handle, a bar, a ledge): how far along it from its middle, as a share of that length in [-0.5, 0.5], toward the contact's own `+X`. */
        along: number;
      };

  /**
   * A region's point and outward unit normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A region's point and outward unit normal.
   * @evidence contracts/development/design.md#principled-representation Closed choices "point", "normal" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: touch/touchHold.ts (touchHold.region, perceived); touch/touchHold.ts (touchHold.region, held); touch/touchHold.ts (touchHold.region, return); touch/touchHold.ts (touchHold.perceived, perceived); touch/touchHold.ts (touchHold.perceived, return); touch/touchRegion.ts (touchRegion.reader, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTarget.IPlace identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IFrame = Pick<
    IAutoMovieMotionHumanTarget.IPlace,
    "point" | "normal"
  >;
}
