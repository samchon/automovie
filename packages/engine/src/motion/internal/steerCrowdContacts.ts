import type {
  IAutoMovieCrowdAgent,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieVector3,
} from "@automovie/interface";

import { steerAutoMovieCrowdGeometry } from "./steerAutoMovieCrowdGeometry";

/*
 * The arrivals and the contacts of a steered crowd, read at the integration's
 * knots (`steerCrowd`): an agent arrives at the first knot its centre
 * lies within its radius of its destination, and a pair of agents, or an agent
 * and an obstacle, is a contact when the two overlap at two successive knots,
 * reported at the first of them with its depth there.
 *
 * Moved unchanged out of `steerCrowd` to keep that file under the
 * repository's 500-line limit.
 * Parameter agents: The agents in the order given.
 * Parameter obstacles: The obstacles.
 * Parameter slot: Each given agent's index in the stacked state's canonical order.
 * Parameter trajectory: The integrated crowd.
 * Parameter from: The interval's first second.
 * Parameter to: The interval's last second.
 * Returns: Each agent's arrival (null when it never arrives) and the contacts
 * in knot order.
 */
export function steerCrowdContacts(
  agents: readonly IAutoMovieCrowdAgent[],
  obstacles: readonly IAutoMovieCrowdAgent.IObstacle[],
  slot: readonly number[],
  trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory,
  from: number,
  to: number,
): steerCrowdContacts.IResult {
  const n: number = agents.length;
  const arrival: IAutoMovieCrowdAgent.ICourse["arrival"][] = new Array<
    IAutoMovieCrowdAgent.ICourse["arrival"]
  >(n).fill(null);
  const contacts: IAutoMovieCrowdAgent.IContact[] = [];
  const open: Map<string, steerCrowdContacts.IOpen> = new Map();

  // Each agent's destination is its own constant, and each obstacle's
  // footprint at a knot is one placement every agent reads.
  const destinations: IAutoMovieVector3[] = agents.map(
    steerAutoMovieCrowdGeometry.finalGoal,
  );
  for (let s: number = 0; s < trajectory.knots; ++s) {
    const seconds: number = Math.min(to, from + s * trajectory.h);
    const x: number[] = trajectory.at(seconds).x;
    const footprints: IAutoMovieVector3[][] = obstacles.map(
      (o: IAutoMovieCrowdAgent.IObstacle): IAutoMovieVector3[] =>
        steerAutoMovieCrowdGeometry.footprintAt(o, seconds),
    );
    const seen: Set<string> = new Set();
    const touch = (
      key: string,
      depth: number,
      agent: number,
      other: IAutoMovieCrowdAgent.IContact["other"],
    ): void => {
      seen.add(key);
      const was: steerCrowdContacts.IOpen = open.get(key) ?? {
        seconds,
        depth,
        ticks: 0,
      };
      was.ticks += 1;
      open.set(key, was);
      if (was.ticks === 2)
        contacts.push({
          agent,
          other,
          seconds: was.seconds,
          depth: was.depth,
        });
    };
    for (let i: number = 0; i < n; ++i) {
      const a: number = slot[i]!;
      const ax: number = x[4 * a]!;
      const az: number = x[4 * a + 1]!;
      const destination: IAutoMovieVector3 = destinations[i]!;
      if (
        arrival[i] === null &&
        Math.hypot(destination.x - ax, destination.z - az) <= agents[i]!.radius
      )
        arrival[i] = seconds;
      for (let j: number = i + 1; j < n; ++j) {
        const b: number = slot[j]!;
        const depth: number =
          agents[i]!.radius +
          agents[j]!.radius -
          Math.hypot(x[4 * b]! - ax, x[4 * b + 1]! - az);
        if (depth > 1e-9)
          touch(`a${i}:${j}`, depth, i, { kind: "agent", index: j });
      }
      footprints.forEach((footprint: IAutoMovieVector3[], k: number): void => {
        const depth: number =
          agents[i]!.radius -
          steerAutoMovieCrowdGeometry.signedDistance(ax, az, footprint);
        if (depth > 1e-9)
          touch(`o${i}:${k}`, depth, i, { kind: "obstacle", index: k });
      });
    }
    for (const key of [...open.keys()]) if (!seen.has(key)) open.delete(key);
  }
  return { arrival, contacts };
}

/*
 * Companion types of steerCrowdContacts.
 */
export namespace steerCrowdContacts {
  /*
   * The pass's readings.
   */
  export interface IResult {
    /*
     * Each given agent's first arrival, seconds; null when it never arrives.
     */
    arrival: IAutoMovieCrowdAgent.ICourse["arrival"][];

    /*
     * The contacts, in the order they are confirmed.
     */
    contacts: IAutoMovieCrowdAgent.IContact[];
  }

  /*
   * An overlap still open at the latest knot.
   */
  export interface IOpen {
    /*
     * The first knot it was read at, seconds.
     */
    seconds: number;

    /*
     * Its depth there, metres.
     */
    depth: number;

    /*
     * The successive knots it has been read at.
     */
    ticks: number;
  }
}
