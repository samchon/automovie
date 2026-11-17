import type { IAutoMovieVector3 } from "../../../../geometry/IAutoMovieVector3";

/**
 * A bounded fighting area: a square ring on the floor, centred on a point
 * and turned by a heading, inside its ropes. Footwork and staging read it to
 * keep the fighters' stances inside the ropes and to find its corners.
 *
 * The ring is a square of `size` metres between the ropes (GLORY rings are
 * 6.1 to 7.3 m inside the ropes; the size is the production's). Corners are
 * named in the ring's own frame: the red and blue corners on one diagonal,
 * the two neutral corners on the other. A ring placed in the scene is read
 * from its own contacts (`of`, `createRing`'s): its centre and floor from the
 * `canvas`, its size from the top ropes on opposite sides, its heading from
 * the placement, and its corners named on its posts' tops, `corner1` (`+X
 * +Z`) blue, `corner3` red, `corner4` and `corner2` the neutral corners.
 *
 * @evidence contracts/development/common.md#meaningful-documentation centre: The centre on the floor, world metres. size: The side between the ropes, metres; positive. yaw: The heading of the ring's +Z side, degrees about +Y.
 * @evidence contracts/development/design.md#principled-representation centre: The centre on the floor, world metres. size: The side between the ropes, metres; positive. yaw: The heading of the ring's +Z side, degrees about +Y.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/kickboxing/KickboxingRing.ts (KickboxingRing.corner, corner); sport/kickboxing/KickboxingRing.ts (KickboxingRing.of, return); sport/kickboxing/KickboxingRing.ts (KickboxingRing.corner, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.inside, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.clamp, ring); sport/kickboxing/KickboxingRing.ts (KickboxingRing.world, ring).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanKickboxingRing {
  /**
   * A ring.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation A centre in world metres, a side in metres (positive) and a heading in degrees about +Y; positivity is left to the queries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values every query reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
   */
  export interface IRing {
    /** The centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The side between the ropes, metres; positive. */
    size: number;

    /** The heading of the ring's +Z side, degrees about +Y. */
    yaw: number;
  }

  /**
   * A corner's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four corners; the namespace places them on the diagonals.
   * @evidence contracts/development/design.md#principled-representation A closed union of the four corners a ring has.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The corners the corner query and the knockdown count name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Corner = "red" | "blue" | "neutralA" | "neutralB";
}
