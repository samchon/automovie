import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * What stands in a person's way: a wall, a piece of furniture, a door frame,
 * each a solid of the scene with the openings a person may pass through.
 *
 * An obstacle is a convex footprint on the floor with the heights its solid
 * spans, and its apertures: an opening is a line across the footprint with
 * a clear width and a clear height (a doorway, a gap in a fence, the space
 * under a beam). A law that moves a body across the floor asks `blocking`
 * whether a straight stretch of its path meets a solid, and where: a path
 * that meets none is free, one that crosses an obstacle through an opening
 * wide and tall enough for the body is free too, and any other is blocked,
 * with the reason a refusal reports (a wall in the way, an opening too
 * narrow, too little headroom).
 *
 * Nothing here plans a way round: a law refuses or steers, and the
 * production's own path gives the way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation footprint: Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. bottom: The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. top: The height its solid ends at, metres above the floor.
 * @evidence contracts/development/design.md#principled-representation footprint: Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. bottom: The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. top: The height its solid ends at, metres above the floor.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkClear.ts (walkClear, o); ensemble/HumanCrowd.ts (HumanCrowd.steer.obstacles, o); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough.obstacle, o); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, o); perform/HumanObstacle.ts (HumanObstacle.wall, return); perform/HumanObstacle.ts (HumanObstacle.object, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanObstacle {
  /**
   * A solid of the scene on the floor plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation footprint: Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. bottom: The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. top: The height its solid ends at, metres above the floor.
   * @evidence contracts/development/design.md#principled-representation footprint: Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. bottom: The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. top: The height its solid ends at, metres above the floor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkClear.ts (walkClear, o); ensemble/HumanCrowd.ts (HumanCrowd.steer.obstacles, o); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough.obstacle, o); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, o); perform/HumanObstacle.ts (HumanObstacle.wall, return); perform/HumanObstacle.ts (HumanObstacle.object, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanObstacle.IAperture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IObstacle {
    /** Its subject id, which a refusal names. */
    subject: string;

    /** Its footprint on the floor: a convex polygon's corners in order, world metres; `y` is not read. */
    footprint: readonly IAutoMovieVector3[];

    /** The height its solid starts at, metres above the floor: 0 for a wall, the underside of a beam. */
    bottom: number;

    /** The height its solid ends at, metres above the floor. */
    top: number;

    /** Its openings; none when absent. */
    apertures?: readonly IAutoMovieMotionHumanObstacle.IAperture[];

    /** Where a moving obstacle is at a film second; `footprint` is then in its own frame, placed by `HumanObstacleMotion.at`. Still when absent. */
    motion?: (seconds: number) => {
      /** Obstacle root position in world metres. */
      position: IAutoMovieVector3;
      /** Obstacle yaw in degrees about world +Y. */
      yaw: number;
    };
  }

  /**
   * An opening through an obstacle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: The middle of its sill on the floor plan, world metres; `y` is the sill's height. width: Its clear width, metres. height: Its clear height above the sill, metres.
   * @evidence contracts/development/design.md#principled-representation at: The middle of its sill on the floor plan, world metres; `y` is the sill's height. width: Its clear width, metres. height: Its clear height above the sill, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkClear.ts (walkClear, a); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough.opening, a); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, a); perform/HumanObstacle.ts (HumanObstacle.wall, apertures); perform/HumanObstacle.ts (HumanObstacle.apertures, return); lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAperture {
    /** Its id within the obstacle. */
    id: string;

    /** The middle of its sill on the floor plan, world metres; `y` is the sill's height. */
    at: IAutoMovieVector3;

    /** The level unit direction its width runs along, world. */
    across: IAutoMovieVector3;

    /** Its clear width, metres. */
    width: number;

    /** Its clear height above the sill, metres. */
    height: number;
  }

  /**
   * The first obstacle a straight stretch of a path cannot pass, if any. What a body needs of a passage.
   *
   * @evidence contracts/development/common.md#meaningful-documentation breadth: The width it takes, metres: the shoulders' breadth for a body that walks facing its way. height: The height it takes, metres: the stature for a body that stands.
   * @evidence contracts/development/design.md#principled-representation breadth: The width it takes, metres: the shoulders' breadth for a body that walks facing its way. height: The height it takes, metres: the stature for a body that stands.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObstacle.ts (HumanObstacle.blocking, need); perform/HumanObstacle.ts (HumanObstacle.judged, need); actions/walkClear.ts (walkClear).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanObstacle.blocking.
   */
  export interface INeed {
    /** The width it takes, metres: the shoulders' breadth for a body that walks facing its way. */
    breadth: number;

    /** The height it takes, metres: the stature for a body that stands. */
    height: number;
  }

  /**
   * Where and why a path is blocked.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: Where the path first meets the obstacle's footprint, world metres on the floor. distance: How far along the path that is, metres from its start. short: The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`.
   * @evidence contracts/development/design.md#principled-representation at: Where the path first meets the obstacle's footprint, world metres on the floor. distance: How far along the path that is, metres from its start. short: The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanObstacle.ts (HumanObstacle.blocking, return); perform/HumanObstacle.ts (HumanObstacle.judged, return); actions/walkClear.ts (walkClear); actions/walkClear.ts (walkClear.between); perform/HumanObstacle.ts (HumanObstacle.CAUSES); perform/HumanObstacle.ts (HumanObstacle.blocking).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IBlock {
    /** The obstacle. */
    subject: string;

    /** Where the path first meets the obstacle's footprint, world metres on the floor. */
    at: IAutoMovieVector3;

    /** How far along the path that is, metres from its start. */
    distance: number;

    /** Why: a solid with no opening on the path, an opening narrower than the body, or one lower than it. */
    cause: (readonly ["solid", "narrow", "headroom"])[number];

    /** The opening the path goes through, for `narrow` and `headroom`. */
    aperture?: string;

    /** The measure that falls short and what it would have to be, metres, for `narrow` and `headroom`. */
    short?: {
      /** Available geometric clearance in metres. */
      has: number;
      /** Required geometric clearance in metres. */
      needs: number;
    };
  }
}
