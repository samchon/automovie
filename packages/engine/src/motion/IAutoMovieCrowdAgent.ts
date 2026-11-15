import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One agent of a plan-time crowd steering pass (`steerAutoMovieCrowd`): a disc on the floor that heads for its goals at its own desired speed and avoids the others and the obstacles.
 *
 * Positions are world metres on the floor plan (`y` is not read), speeds metres per second, times film seconds. Nothing in it names a person: a walker, a horse or a cart is an agent with its own radius and speed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an agent is, its units and frames, and that it carries no vocabulary.
 * @evidence contracts/development/design.md#principled-representation The agent of the social force model (Helbing and Molnar 1995): a position, a goal, a radius and a desired speed, with the start second and herding share of Helbing, Farkas and Vicsek 2000.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the engine's steering pass; the motions package builds agents from members and the props planner from vehicles and herds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A goal is a point or an ordered list of points, never a scripted course; the course is the pass's output.
 */
export interface IAutoMovieCrowdAgent {
  /** Where it stands at the pass's first second, world metres. */
  at: IAutoMovieVector3;

  /** Where it heads: one point, or points passed in order, the last its destination; world metres. */
  goal: IAutoMovieVector3 | readonly IAutoMovieVector3[];

  /** Its disc's radius, metres, positive: half a walker's shoulder breadth. */
  radius: number;

  /** Its desired speed, metres per second, positive. */
  speed: number;

  /** The fastest it may go, metres per second, at least `speed`; 1.3 times `speed` when absent (Helbing and Molnar 1995). */
  maximum?: number;

  /** The film second it sets off; it stands still before. */
  start: number;

  /** Its herding share in [0, 1]: the weight of its neighbours' mean heading against its own (Helbing, Farkas and Vicsek 2000); 0 when absent. */
  herding?: number;
}

/**
 * Companion types of {@link IAutoMovieCrowdAgent}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type states its members' units.
 * @evidence contracts/development/design.md#principled-representation An obstacle is a convex footprint, fixed in the world or carried by a motion; a course is a state read by time; a contact is two discs that met.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the pass reads and returns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A moving obstacle's footprint is in its own frame and placed by its motion, so a still one needs no motion.
 */
export namespace IAutoMovieCrowdAgent {
  /** Something the agents steer round. */
  export interface IObstacle {
    /** A convex footprint's corners in order: world metres without a motion, its own frame (x to its left, z ahead) with one; `y` is not read. */
    footprint: readonly IAutoMovieVector3[];

    /** Where it is and which way it faces at a film second; still when absent. Pure. */
    motion?: (seconds: number) => { position: IAutoMovieVector3; yaw: number };
  }

  /** One agent's planned course. */
  export interface ICourse {
    /** Its position and velocity at a film second, held at the pass's ends outside it. */
    at: (seconds: number) => { position: IAutoMovieVector3; velocity: IAutoMovieVector3 };

    /** The first second it stands within its radius of its destination, or null when it does not arrive within the pass. */
    arrival: number | null;
  }

  /** Two discs, or a disc and an obstacle, that overlapped for longer than one step. */
  export interface IContact {
    /** The first agent's index. */
    agent: number;

    /** The other agent's index, or null for an obstacle. */
    other: number | null;

    /** The obstacle's index, for a contact with one. */
    obstacle: number | null;

    /** The film second the overlap began. */
    seconds: number;

    /** How deep they overlapped there, metres. */
    depth: number;
  }
}
