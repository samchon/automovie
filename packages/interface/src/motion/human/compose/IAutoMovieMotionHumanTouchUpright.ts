import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * How a held vessel is turned about its own upright axis at a region, so the
 * arm that brings it there keeps it upright, and how far it is leaned.
 *
 * Standing a vessel upright fixes one axis of the hand; its turn about that
 * axis is free, and most of those turns ask the forearm and the wrist for more
 * than their range, so the resolver gives way on the rotation and the vessel
 * tilts. Each candidate turns the region's level normal by a multiple of `STEP`
 * degrees within `SPAN` either way (`facings`); each is solved on the posture,
 * and the facing whose reached hand keeps the vessel's axis nearest the asked
 * one is taken, the nearest to head on on a tie, so the first that keeps it
 * exactly ends the search. The turn about that axis is not counted, since it is
 * free. A lean toward the face is a turn of the axis about the level line
 * across the region (`tip`); the least lean that lets the arm drink is
 * `AutoMovieMotionHumanTouchDrink`'s.
 */
export namespace IAutoMovieMotionHumanTouchUpright {
  /** A vessel's facing and lean at a region and the tilt the arm leaves there. */
  export interface IFacing {
    /**
     * The level world direction the effector faces against; the region's normal
     * when it has no level part.
     */
    facing: IAutoMovieVector3;

    /**
     * How far the vessel's axis is asked to lean from the world's up toward the
     * region, degrees (`AutoMovieMotionHumanTouchDrink`); 0 from `solve`.
     */
    lean: number;

    /**
     * How far the reached hand carries the vessel's axis off the asked one,
     * degrees; 0 when the region's normal has no level part.
     */
    tilt: number;
  }
}
