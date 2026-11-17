import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * How a held vessel is turned about its own upright axis at a region, so
 * the arm that brings it there keeps it upright, and how far it is leaned.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for
 * more than their range, so the resolver gives way on the rotation and the
 * vessel tilts. Each candidate turns the region's level normal by a multiple
 * of `STEP` degrees within `SPAN` either way (`facings`); each is solved on
 * the posture, and the facing whose reached hand keeps the vessel's axis
 * nearest the asked one is taken, the nearest to head on on a tie, so the
 * first that keeps it exactly ends the search. The turn
 * about that axis is not counted, since it is free. A lean toward the face
 * is a turn of the axis about the level line across the region (`tip`);
 * the least lean that lets the arm drink is `AutoMovieMotionHumanTouchDrink`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lean: How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. tilt: How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part.
 * @evidence contracts/development/design.md#principled-representation lean: How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. tilt: How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanTouchUpright.ts (AutoMovieMotionHumanTouchUpright.solve, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTouchUpright {
  /**
   * A vessel's facing and lean at a region and the tilt the arm leaves there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
   * @evidence contracts/development/design.md#principled-representation The chosen level direction and lean with the residual it was chosen by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members: the stroke reads the facing and the lean, a choice among several effectors the tilt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tilt is the reached one, never the asked one.
   */
  export interface IFacing {
    /** The level world direction the effector faces against; the region's normal when it has no level part. */
    facing: IAutoMovieVector3;

    /** How far the vessel's axis is asked to lean from the world's up toward the region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`. */
    lean: number;

    /** How far the reached hand carries the vessel's axis off the asked one, degrees; 0 when the region's normal has no level part. */
    tilt: number;
  }
}
