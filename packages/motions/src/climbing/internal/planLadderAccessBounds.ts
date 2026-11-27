import type { AutoMovieHumanSide } from "@automovie/interface";

/*
 * The bounds `planLadderAccess` lays a ladder access by: its sides, gaps,
 * stances, heights, beats and margins.
 */
export namespace planLadderAccessBounds {
  /*
   * Both sides, left first, the order each beat moves its limbs in.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /*
   * The widest gap between the ladder's rung plane and the landing's near edge,
   * metres (provisional: a step across, not a stride).
   */
  export const MAX_GAP: number = 0.25;

  /*
   * How far behind the rungs the floor stance stands, metres (provisional: the
   * toes under the first rung).
   */
  export const FLOOR_STANCE: number = 0.38;

  /*
   * Heel room on the landing beyond its near edge, foot lengths (provisional:
   * the toe joint inside the edge by most of the foot).
   */
  export const HEEL_ROOM: number = 0.84;

  /*
   * Height of the hands' first rung above the floor, statures (provisional:
   * about shoulder height less the arm's bend).
   */
  export const GRIP_HEIGHT: number = 0.69;

  /*
   * Seconds per ladder beat (provisional).
   */
  export const BEAT: number = 0.65;

  /*
   * Lateral margin of a sole inside a rung's or landing's edge, metres
   * (provisional).
   */
  export const SOLE_MARGIN: number = 0.07;

  /*
   * The swing waypoints' height above the landing, foot lengths (provisional:
   * the toe clear of the edge).
   */
  export const EDGE_RISE: number = 0.55;

  /*
   * The near waypoint's distance outside the landing's edge, foot lengths
   * (provisional: the toes clear of the edge's face).
   */
  export const EDGE_BUFFER: number = 0.62;

  /*
   * Seconds to let go of a rail and stand (provisional).
   */
  export const RELEASE: number = 0.4;

  /*
   * Seconds to settle a standing stance at either end of the route
   * (provisional).
   */
  export const SETTLE: number = 0.3;

  /*
   * Depth the landing needs beyond the heel room, metres (provisional: the far
   * stance's heel).
   */
  export const LANDING_MARGIN: number = 0.12;

  /*
   * The share of the body weight a grip bears on the ladder (provisional).
   */
  export const GRIP_LOAD: number = 0.1;
}
