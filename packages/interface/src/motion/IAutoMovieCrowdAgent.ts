import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One agent of a plan-time crowd steering pass (`steerAutoMovieCrowd`): a disc on the floor that heads for its goals at its own desired speed and avoids the others and the obstacles.
 *
 * Positions are world metres on the floor plan (`y` is not read), speeds metres per second, times film seconds. Nothing in it names a person: a walker, a horse or a cart is an agent with its own radius and speed.
 * steerAutoMovieCrowd checks positive finite radius and speed, finite start
 * and a nonempty goal list. Finite point coordinates, maximum >= speed and
 * herding in [0, 1] are caller premises, not additional admission checks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an agent is, its units and frames, and that it carries no vocabulary.
 * @evidence contracts/development/design.md#principled-representation The agent of the social force model (Helbing and Molnar 1995): a position, a goal, a radius and a desired speed, with the start second and herding share of Helbing, Farkas and Vicsek 2000.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the planar agent contract consumed by steerAutoMovieCrowd; motion planners build agents from their own performers and objects.
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

/** Obstacle inputs and course/contact outputs of the planar crowd steering pass. */
export namespace IAutoMovieCrowdAgent {
  /**
     * Something the agents steer round.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States its footprint's frame with and without a motion, and that a motion is pure.
     * @evidence contracts/development/design.md#principled-representation A convex footprint on the floor plan and an optional rigid placement by film second.
     * @evidence contracts/development/design.md#minimal-and-owned-surface The two members the pass reads; the motions package maps its obstacles onto it.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts A still obstacle carries no motion rather than a constant function.
     */
    export interface IObstacle {
      /** A convex footprint's corners in order: world metres without a motion, its own frame (x to its left, z ahead) with one; `y` is not read. */
      footprint: readonly IAutoMovieVector3[];
  
      /**
       * Pure placement at a film second: world position in metres and yaw in
       * degrees. The footprint stays fixed in world space when absent. The
       * reader also samples neighbouring instants to estimate velocity.
       * It is called synchronously during planning, can be called repeatedly,
       * and must not mutate the obstacle. Exceptions abort the pass. Completed
       * course readers sample stored integration data without calling motion.
       *
       * @evidence contracts/development/common.md#meaningful-documentation States purity, timebase, output units, absence and neighbouring-time reads.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation A callback declaration; its supplied function owns the placement method.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No callback body is declared here.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This signature computes no placement.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The callback's implementation owns its evaluation cost.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no evaluations or cache.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires and retains no resources.
       */
      motion?: (seconds: number) => {
        /** World translation in metres; y is ignored. Sampling includes 0.0005 seconds before and after queried times for velocity. */
        position: IAutoMovieVector3;
        /** Yaw in degrees from world +Z toward +X. */
        yaw: number;
      };
    }

  /**
     * One agent's planned course.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the reader's units, the held ends and the meaning of a null arrival.
     * @evidence contracts/development/design.md#principled-representation A course read by film second, and the first second within its radius of its destination.
     * @evidence contracts/development/design.md#minimal-and-owned-surface What HumanCrowd.steer and the props planner read.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts No arrival is invented: an agent that does not arrive reads null.
     */
    export interface ICourse {
      /**
       * World position in metres and velocity in metres per second at a film
       * second, held at the pass's ends outside it. The reader retains the
       * planned trajectory and slot mapping until the course is released;
       * each call returns new position and velocity records.
       *
       * @evidence contracts/development/common.md#meaningful-documentation States the timebase, result frames and units, and held-end behavior.
       * @evidenceExclude contracts/development/implementation.md#principled-implementation A course-reader signature; the steering pass's supplied function owns sampling.
       * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No sampling body is declared here.
       * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration computes no trajectory state.
       * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Evaluation cost belongs to the supplied reader.
       * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature owns no trajectory memo or coordinated reads.
       * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The steering implementation owns the captured trajectory; releasing all course readers releases that retained numerical data.
       */
      at: (seconds: number) => {
        /** Fresh world position in metres, with y = 0. */
        position: IAutoMovieVector3;
        /** Fresh planar velocity state in metres/second, with y = 0; this force-integrated state can differ from the avoidance-projected position derivative. */
        velocity: IAutoMovieVector3;
      };
  
      /** The first second it stands within its radius of its destination, or null when it does not arrive within the pass. */
      arrival: number | null;
    }

  /**
     * Two discs, or a disc and an obstacle, observed overlapping at two consecutive trajectory knots.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and unit.
     * @evidence contracts/development/design.md#principled-representation The two parties by index, when the overlap began and how deep it was.
     * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller names in its refusal.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts The other party is a discriminated agent-or-obstacle index, so the array owning the index is explicit.
     */
    export interface IContact {
      /** The first agent's index. */
      agent: number;
  
      /** What it overlapped: another agent, or an obstacle, by index. */
      other:
        | {
            /** Selects the input agents array. */
            kind: "agent";
            /** Other agent's zero-based index in the original input order. */
            index: number;
          }
        | {
            /** Selects the input obstacles array. */
            kind: "obstacle";
            /** Obstacle's zero-based index in the original input order. */
            index: number;
          };
  
      /** Film time of the first observed overlapping knot, rather than an interpolated exact collision onset. */
      seconds: number;
  
      /** How deep they overlapped there, metres. */
      depth: number;
    }
}
