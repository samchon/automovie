import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/** Terrain and staged anchor needed to measure formation placement relief. */
export namespace IAutoMovieFormationGroundRelief {
  /**
   * A formation's borrowed terrain snapshot and staged world anchor, used to
   * measure terrain rise in metres.
   *
   * Relief rather than absolute ground, so `anchor.y` keeps meaning what it
   * always meant: the height the unit was staged at. A unit standing on its
   * ground has an anchor on that ground, and every member then lands on the
   * ground under itself; a unit deliberately staged a metre above its terrain
   * keeps that metre all the way up the hill instead of being snapped down at
   * placement time. Level terrain gives zero relief everywhere.
   *
   * Zero when the formation declares no terrain, when the point is over none,
   * and when the anchor itself is over none: relief is measured from the
   * anchor's own ground, and without that datum there is no rise to state. Each
   * is a fact about what was authored rather than a fallback that guesses.
   *
   * The anchor's ground height is remembered per formation record object, so a
   * record must keep its `anchor` and `ground` unchanged once members have been
   * placed from it; a changed placement is a new record. The weak cache also
   * remembers an absent anchor surface. It retains only a boxed height while
   * the record remains live; no explicit invalidation exists. Terrain lookup
   * uses the first containing surface in declared order.
   */
  export type IFormation = IAutoMovieFormationGrounding & {
    /**
     * Staged world position in metres. Relief is measured against ground below
     * its XZ coordinates while anchor.y retains its staged offset; keep anchor
     * and ground unchanged after first use because datum height is cached by
     * formation object identity.
     */
    anchor: IAutoMovieVector3;
  };
}
