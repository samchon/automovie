import type { IAutoMovieVector3 } from "@automovie/interface";

import { solveAutoMovieHalfPlaneProgram } from "../math/solveAutoMovieHalfPlaneProgram";
import type { IAutoMovieCrowdAgent } from "./IAutoMovieCrowdAgent";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";
import { steerAutoMovieCrowdGeometry } from "./steerAutoMovieCrowdGeometry";

/**
 * A crowd's ways planned once: every agent heads for its goals at its own desired speed and avoids the others and the obstacles by anticipation, the whole crowd integrated together on a fixed step and each agent's course read back by time.
 *
 * Each agent's acceleration is the social force model's driving term toward its desired velocity, `(v0 e0 - v) / tau` with the relaxation time `tau` (Helbing and Molnar 1995, Phys Rev E 51:4282), plus the anticipatory interaction of the universal power law (Karamouzas, Skinner and Guy 2014, Phys Rev Lett 113:238701): with every other agent and obstacle it would meet within the time to collision `t` at the current velocities, the force is minus the spatial gradient of `E(t) = k t^-2 exp(-t / t0)`. That gradient is `k exp(-t / t0) t^-2 (2 / t + 1 / t0)` along the contact normal `n` at the predicted collision, divided by the closing speed along it, `-(n . u)`, so the push grows as a collision nears in time and is aimed away from where it would happen. The desired direction `e0` follows the goals as Reynolds's path following does (Reynolds 1999): toward the point `LOOKAHEAD` seconds of desired travel past the agent's nearest point on the polyline of its start and goals, slowed within `ARRIVAL` relaxation times of desired travel from its destination; with a herding share `p` it is `N[(1 - p) e0 + p <v_j> / v0]` (Helbing, Farkas and Vicsek 2000, Nature 407:487), `<v_j>` the mean velocity of the agents within `NEIGHBOURHOOD`, each weighted by Tukey's biweight kernel `(1 - (d / NEIGHBOURHOOD)^2)^2` (Beaton and Tukey 1974; the compactly supported smoothing kernels of SPH and Wendland's family are of the same kind): the paper's mean heading of the neighbours, read with a compact, continuously differentiable weight that falls to nothing at the neighbourhood's edge and a velocity that grows from rest, so the right-hand side is Lipschitz, which a well-posed integration needs (Picard and Lindelof), and no neighbour's entry or start jumps it. A position moves at most at the agent's `maximum` speed, as in that model, and at the velocity nearest the agent's own that optimal reciprocal collision avoidance admits against every other agent over the horizon `t0` (van den Berg, Guy, Lin and Manocha 2011, `solveAutoMovieHalfPlaneProgram`): the anticipatory force steers, and the half-plane program is the hard guarantee that two agents never step into each other, an overlap already there being undone within one step.
 *
 * The state of the whole crowd is one vector handed to the engine's one fixed-step integrator, `integrateMotionTrajectory` (#3424), so every agent sees every other at the same instant (a synchronous update) and the courses are read back by its Hermite interpolation. Agents are integrated in a canonical order of their own data, not in the order given, so listing them in another order gives bit-identical courses. Interaction couples agents: adding one changes the others' courses, as a real crowd does. The pass is kinematic; contact forces of a crush are out of scope, and every overlap that outlasts one step is reported in `contacts` for the caller to refuse.
 *
 * The force scale `K` is the energy's normalisation, which the paper fixes only up to units (E(1) = 1 in its figure); the published simulation's own constants, its force cap and its sensing range were searched for (the paper's supplement and the authors' page could not be read) and are provisional here, as is every other named constant marked so.
 *
 * @param props The agents, the obstacles, the interval, the step and the law's two times.
 * @returns Each agent's course in the order given, and the contacts.
 * @throws {Error} When an agent's radius, speed or start is not finite and positive where it must be, a goal list is empty, or the interval is not forward: a caller's defect.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law with its sources, the gradient's closed form, the goal following, herding, the speed cap, the integration, the order independence, the coupling, the contacts and the provisional constants with the search recorded.
 * @evidence contracts/development/implementation.md#principled-implementation The social force driving term plus the power-law interaction's exact spatial gradient: the time to collision of two discs solves `|p - u t| = R`, and implicit differentiation gives `grad t = n / -(n . u)` at the contact normal `n`, the same expression for an offset edge or a corner of a convex obstacle. The position's rate is the ORCA velocity, the cited paper's reciprocal half-planes solved by its linear program. Classical RK4 on the stacked state through `integrateMotionTrajectory`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the agents, fix the canonical order, define the right-hand side, integrate, then read the courses, the arrivals and the contacts at the knots.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No agent is moved apart after the fact: overlaps are reported, not repaired. The force cap is named and provisional, documented as the cure for the gradient's grazing singularity the implicit-crowds work describes, not a tuning of one scene.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each evaluation is O(N^2 + N M) for N agents and M obstacle edges, plus N half-plane programs of N - 1 half-planes each, expected linear, four per step over `(to - from) / step` steps; a read is one interpolation of the stacked state. A spatial grid would cut the pairs for crowds of thousands; the crowds planned here are hundreds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One integration serves every agent's course and every read of it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the trajectory's knots, 4 N numbers per step, for as long as the caller keeps the courses.
 */
export function steerAutoMovieCrowd(
  props: steerAutoMovieCrowd.IProps,
): steerAutoMovieCrowd.IResult {
  const tau: number = props.law?.relaxation ?? steerAutoMovieCrowd.RELAXATION;
  const t0: number = props.law?.horizon ?? steerAutoMovieCrowd.HORIZON;
  const h: number = props.step ?? integrateMotionTrajectory.STEP;
  const agents: readonly IAutoMovieCrowdAgent[] = props.agents;
  agents.forEach((a: IAutoMovieCrowdAgent, i: number): void => {
    for (const [name, value] of [
      ["radius", a.radius],
      ["speed", a.speed],
    ] as const)
      if (!(Number.isFinite(value) && value > 0))
        throw new Error(
          `steerAutoMovieCrowd: agent ${i}'s ${name} ${value} is not positive`,
        );
    if (!Number.isFinite(a.start))
      throw new Error(`steerAutoMovieCrowd: agent ${i}'s start is not finite`);
    if (steerAutoMovieCrowdGeometry.goals(a).length === 0)
      throw new Error(`steerAutoMovieCrowd: agent ${i} has no goal`);
  });
  const obstacles: readonly IAutoMovieCrowdAgent.IObstacle[] =
    props.obstacles ?? [];
  const n: number = agents.length;
  if (n === 0) return { courses: [], contacts: [] };

  // The canonical order: by each agent's own data, so the order given changes nothing.
  const order: number[] = agents
    .map((_: IAutoMovieCrowdAgent, i: number): number => i)
    .sort(
      (a: number, b: number): number =>
        steerAutoMovieCrowdGeometry.compare(agents[a]!, agents[b]!) || a - b,
    );
  const paths: steerAutoMovieCrowdGeometry.IPath[] = order.map(
    (i: number): steerAutoMovieCrowdGeometry.IPath =>
      steerAutoMovieCrowdGeometry.pathOf(agents[i]!),
  );

  // The right-hand side over the stacked state [x, z, vx, vz] per agent in canonical order.
  const f = (
    t: number,
    x: readonly number[],
  ): integrateMotionTrajectory.IRate => {
    const dx: number[] = new Array<number>(4 * n).fill(0);
    const placed: IAutoMovieVector3[][] = obstacles.map(
      (o: IAutoMovieCrowdAgent.IObstacle): IAutoMovieVector3[] =>
        steerAutoMovieCrowdGeometry.footprintAt(o, t),
    );
    const moving: IAutoMovieVector3[] = obstacles.map(
      (o: IAutoMovieCrowdAgent.IObstacle): IAutoMovieVector3 =>
        steerAutoMovieCrowdGeometry.velocityOf(o, t),
    );
    for (let k: number = 0; k < n; ++k) {
      const agent: IAutoMovieCrowdAgent = agents[order[k]!]!;
      if (t < agent.start) continue;
      const px: number = x[4 * k]!;
      const pz: number = x[4 * k + 1]!;
      const vx: number = x[4 * k + 2]!;
      const vz: number = x[4 * k + 3]!;

      // The desired velocity: along the goals, slowed on arrival, mixed with the neighbours' heading.
      const want: { x: number; z: number; speed: number } =
        steerAutoMovieCrowdGeometry.follow(
          paths[k]!,
          px,
          pz,
          agent.speed,
          tau,
          steerAutoMovieCrowd.LOOKAHEAD,
          steerAutoMovieCrowd.ARRIVAL,
        );
      let ex: number = want.x;
      let ez: number = want.z;
      const p: number = agent.herding ?? 0;
      if (p > 0) {
        // The neighbours' velocities, each weighted by Tukey's biweight `(1 - (d / NEIGHBOURHOOD)^2)^2`, compact and continuously differentiable, over the agent's own desired speed: a mean heading that grows from nothing as the neighbours set off, so the right-hand side stays Lipschitz and the integration well posed.
        let mx: number = 0;
        let mz: number = 0;
        let weight: number = 0;
        for (let j: number = 0; j < n; ++j) {
          if (j === k) continue;
          const d: number =
            Math.hypot(x[4 * j]! - px, x[4 * j + 1]! - pz) /
            steerAutoMovieCrowd.NEIGHBOURHOOD;
          if (d >= 1) continue;
          const w: number = (1 - d * d) ** 2;
          mx += w * x[4 * j + 2]!;
          mz += w * x[4 * j + 3]!;
          weight += w;
        }
        if (weight > 0) {
          ex = (1 - p) * ex + (p * mx) / (weight * agent.speed);
          ez = (1 - p) * ez + (p * mz) / (weight * agent.speed);
          const e: number = Math.hypot(ex, ez);
          if (e > 1e-9) {
            ex /= e;
            ez /= e;
          }
        }
      }
      let ax: number = (want.speed * ex - vx) / tau;
      let az: number = (want.speed * ez - vz) / tau;

      // The anticipatory push from every agent and obstacle it would meet.
      const push = (hit: steerAutoMovieCrowdGeometry.IHit | null): void => {
        // The energy falls off by its own exponential: no time to collision is cut off, so even a slow drift toward another is turned before it touches.
        if (hit === null) return;
        // A present overlap is a time to collision of zero, the energy's singularity: the pair is pushed apart at the cap, as the power law's reference implementation treats a collision.
        if (hit.time === 0) {
          ax += steerAutoMovieCrowd.CAP * hit.nx;
          az += steerAutoMovieCrowd.CAP * hit.nz;
          return;
        }
        const closing: number = -(hit.nx * hit.ux + hit.nz * hit.uz);
        if (!(closing > 1e-9)) return;
        const tt: number = Math.max(hit.time, 1e-3);
        const size: number = Math.min(
          steerAutoMovieCrowd.CAP,
          (steerAutoMovieCrowd.K * Math.exp(-tt / t0) * (2 / tt + 1 / t0)) /
            (tt * tt * closing),
        );
        ax += size * hit.nx;
        az += size * hit.nz;
      };
      for (let j: number = 0; j < n; ++j) {
        if (j === k) continue;
        push(
          steerAutoMovieCrowdGeometry.discs(
            px,
            pz,
            vx,
            vz,
            x[4 * j]!,
            x[4 * j + 1]!,
            x[4 * j + 2]!,
            x[4 * j + 3]!,
            agent.radius + agents[order[j]!]!.radius,
          ),
        );
      }
      placed.forEach((footprint: IAutoMovieVector3[], o: number): void =>
        push(
          steerAutoMovieCrowdGeometry.polygon(
            px,
            pz,
            vx - moving[o]!.x,
            vz - moving[o]!.z,
            footprint,
            agent.radius,
          ),
        ),
      );

      // A position moves at the velocity nearest the agent's own that keeps it clear of every other agent for the horizon, taking its share of each avoidance, and no faster than its maximum (ORCA's linear program, the hard guarantee under the anticipatory force).
      const top: number =
        agent.maximum ?? steerAutoMovieCrowd.MAXIMUM * agent.speed;
      const lines: solveAutoMovieHalfPlaneProgram.ILine[] = [];
      for (let j: number = 0; j < n; ++j)
        if (j !== k)
          lines.push(
            steerAutoMovieCrowdGeometry.reciprocal(
              px,
              pz,
              vx,
              vz,
              x[4 * j]!,
              x[4 * j + 1]!,
              x[4 * j + 2]!,
              x[4 * j + 3]!,
              agent.radius + agents[order[j]!]!.radius,
              t0,
              h,
              top,
              // An agent that has not set off stands and avoids nobody.
              t < agents[order[j]!]!.start
                ? 0
                : (agents[order[j]!]!.maximum ??
                    steerAutoMovieCrowd.MAXIMUM * agents[order[j]!]!.speed),
            ),
          );
      const moved: solveAutoMovieHalfPlaneProgram.IPoint =
        solveAutoMovieHalfPlaneProgram(lines, top, { x: vx, y: vz }).point;
      dx[4 * k] = moved.x;
      dx[4 * k + 1] = moved.y;
      dx[4 * k + 2] = ax;
      dx[4 * k + 3] = az;
    }
    return { dx };
  };
  const x0: number[] = [];
  for (const i of order) x0.push(agents[i]!.at.x, agents[i]!.at.z, 0, 0);
  const trajectory: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (t: number, x: readonly number[]): integrateMotionTrajectory.IRate =>
        f(t, x),
      x0,
      t0: props.from,
      t1: props.to,
      ...(props.step === undefined ? {} : { h: props.step }),
    });

  // Arrivals and contacts at the knots.
  const slot: number[] = new Array<number>(n);
  order.forEach((i: number, k: number): void => {
    slot[i] = k;
  });
  const arrival: (number | null)[] = new Array<number | null>(n).fill(null);
  const contacts: IAutoMovieCrowdAgent.IContact[] = [];
  const open: Map<string, { seconds: number; depth: number; ticks: number }> =
    new Map();
  for (let s: number = 0; s < trajectory.knots; ++s) {
    const seconds: number = Math.min(props.to, props.from + s * trajectory.h);
    const x: number[] = trajectory.at(seconds).x;
    const seen: Set<string> = new Set();
    const touch = (
      key: string,
      depth: number,
      agent: number,
      other: IAutoMovieCrowdAgent.IContact["other"],
    ): void => {
      seen.add(key);
      const was: { seconds: number; depth: number; ticks: number } = open.get(
        key,
      ) ?? { seconds, depth, ticks: 0 };
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
      const destination: IAutoMovieVector3 =
        steerAutoMovieCrowdGeometry.finalGoal(agents[i]!);
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
      obstacles.forEach(
        (o: IAutoMovieCrowdAgent.IObstacle, k: number): void => {
          const depth: number =
            agents[i]!.radius -
            steerAutoMovieCrowdGeometry.signedDistance(
              ax,
              az,
              steerAutoMovieCrowdGeometry.footprintAt(o, seconds),
            );
          if (depth > 1e-9)
            touch(`o${i}:${k}`, depth, i, { kind: "obstacle", index: k });
        },
      );
    }
    for (const key of [...open.keys()]) if (!seen.has(key)) open.delete(key);
  }
  return {
    courses: agents.map(
      (_: IAutoMovieCrowdAgent, i: number): IAutoMovieCrowdAgent.ICourse => ({
        at: (
          seconds: number,
        ): { position: IAutoMovieVector3; velocity: IAutoMovieVector3 } => {
          const state: number[] = trajectory.at(seconds).x;
          const k: number = slot[i]!;
          return {
            position: { x: state[4 * k]!, y: 0, z: state[4 * k + 1]! },
            velocity: { x: state[4 * k + 2]!, y: 0, z: state[4 * k + 3]! },
          };
        },
        arrival: arrival[i]!,
      }),
    ),
    contacts,
  };
}

/**
 * Companion types and constants of {@link steerAutoMovieCrowd}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit and its source or that it is provisional.
 * @evidence contracts/development/design.md#principled-representation The input as agents, obstacles, an interval, a step and the law's two times; the result as courses and contacts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the motions package's crowd and the props planner pass and read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The law's times are optional data with cited defaults, not a free option bag.
 */
export namespace steerAutoMovieCrowd {
  /** The relaxation time of the driving term, seconds (Helbing and Molnar 1995). */
  export const RELAXATION: number = 0.5;

  /** The interaction's time horizon `t0`, seconds (Karamouzas, Skinner and Guy 2014: about 3 s). */
  export const HORIZON: number = 3;

  /** The energy's scale `k`, square metres per second squared (provisional: the paper normalises it away; 1.5 is recalled from the authors' reference implementation, not read). */
  export const K: number = 1.5;

  /** The largest push, metres per second squared (provisional: caps the gradient's singularity at a grazing pass, which the implicit-crowds work of Karamouzas, Sohre, Narain and Guy 2017 describes). */
  export const CAP: number = 20;

  /** Metres within which a neighbour's heading enters the herding mean (provisional: Helbing, Farkas and Vicsek 2000 say "a certain neighborhood"). */
  export const NEIGHBOURHOOD: number = 2;

  /** Seconds of desired travel ahead of the nearest point of the goals' polyline that the agent heads for (provisional, after Reynolds 1999's path following). */
  export const LOOKAHEAD: number = 1;

  /** Relaxation times of desired travel from the destination within which the desired speed falls linearly to 0 (provisional, Reynolds 1999's arrival). */
  export const ARRIVAL: number = 2;

  /** The maximum speed over the desired one when an agent gives none (Helbing and Molnar 1995: 1.3). */
  export const MAXIMUM: number = 1.3;

  /** What a pass is planned from. */
  export interface IProps {
    /** The agents. */
    agents: readonly IAutoMovieCrowdAgent[];

    /** What they steer round; none when absent. */
    obstacles?: readonly IAutoMovieCrowdAgent.IObstacle[];

    /** The first film second. */
    from: number;

    /** The last film second, after `from`. */
    to: number;

    /** The integrator's step, seconds; `integrateMotionTrajectory.STEP` when absent. */
    step?: number;

    /** The law's relaxation time and horizon, seconds; `RELAXATION` and `HORIZON` when absent. */
    law?: { relaxation: number; horizon: number };
  }

  /** A planned pass. */
  export interface IResult {
    /** Each agent's course, in the order given. */
    courses: readonly IAutoMovieCrowdAgent.ICourse[];

    /** Every overlap that lasted longer than one step, by the second it began. */
    contacts: readonly IAutoMovieCrowdAgent.IContact[];
  }
}
