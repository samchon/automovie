import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A bounded fighting area: a square ring on the floor, centred on a point and
 * turned by a heading, inside its ropes. Footwork and staging read it to keep
 * the fighters' stances inside the ropes and to find its corners.
 *
 * The ring is a square of `size` metres between the ropes (GLORY rings are 6.1
 * to 7.3 m inside the ropes; the size is the production's). Corners are named
 * in the ring's own frame: the red and blue corners on one diagonal, the two
 * neutral corners on the other. A ring placed in the scene is read from its own
 * contacts (`of`, `AutoMovieArchetypeRing.create`'s): its centre and floor from the `canvas`, its
 * size from the top ropes on opposite sides, its heading from the placement,
 * and its corners named on its posts' tops, `corner1` (`+X +Z`) blue, `corner3`
 * red, `corner4` and `corner2` the neutral corners.
 */
export namespace IAutoMovieMotionHumanKickboxingRing {
  /** A ring. */
  export interface IRing {
    /** The centre on the floor, world metres. */
    centre: IAutoMovieVector3;

    /** The side between the ropes, metres; positive. */
    size: number;

    /** The heading of the ring's +Z side, degrees about +Y. */
    yaw: number;
  }

  /** A corner's name. */
  export type Corner = "red" | "blue" | "neutralA" | "neutralB";
}
