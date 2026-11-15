import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieCrowdAgent } from "./IAutoMovieCrowdAgent";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";

/**
 * A crowd's ways planned once: every agent heads for its goals at its own desired speed and avoids the others and the obstacles by anticipation, the whole crowd integrated together on a fixed step and each agent's course read back by time.
 *
 * Each agent's acceleration is the social force model's driving term toward its desired velocity, `(v0 e0 - v) / tau` with the relaxation time `tau` (Helbing and Molnar 1995, Phys Rev E 51:4282), plus the anticipatory interaction of the universal power law (Karamouzas, Skinner and Guy 2014, Phys Rev Lett 113:238701): with every other agent and obstacle it would meet within the time to collision `t` at the current velocities, the force is minus the spatial gradient of `E(t) = k t^-2 exp(-t / t0)`. That gradient is `k exp(-t / t0) t^-2 (2 / t + 1 / t0)` along the contact normal `n` at the predicted collision, divided by the closing speed along it, `-(n . u)`, so the push grows as a collision nears in time and is aimed away from where it would happen. The desired direction `e0` follows the goals as Reynolds's path following does (Reynolds 1999): toward the point `LOOKAHEAD` seconds of desired travel past the agent's nearest point on the polyline of its start and goals, slowed within `ARRIVAL` relaxation times of desired travel from its destination; with a herding share `p` it is `N[(1 - p) e0 + p <e_j>]`, `<e_j>` the mean heading of the moving agents within `NEIGHBOURHOOD` (Helbing, Farkas and Vicsek 2000, Nature 407:487). A position moves at most at the agent's `maximum` speed, as in that model.
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
 * @evidence contracts/development/implementation.md#principled-implementation The social force driving term plus the power-law interaction's exact spatial gradient: the time to collision of two discs solves `|p - u t| = R`, and implicit differentiation gives `grad t = n / -(n . u)` at the contact normal `n`, the same expression for an offset edge or a corner of a convex obstacle. Classical RK4 on the stacked state through `integrateMotionTrajectory`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the agents, fix the canonical order, define the right-hand side, integrate, then read the courses, the arrivals and the contacts at the knots.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No agent is moved apart after the fact: overlaps are reported, not repaired. The force cap is named and provisional, documented as the cure for the gradient's grazing singularity the implicit-crowds work describes, not a tuning of one scene.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each evaluation is O(N^2 + N M) for N agents and M obstacle edges, four per step over `(to - from) / step` steps; a read is one interpolation of the stacked state. A spatial grid would cut the pairs for crowds of thousands; the crowds planned here are hundreds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One integration serves every agent's course and every read of it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the trajectory's knots, 4 N numbers per step, for as long as the caller keeps the courses.
 */
export function steerAutoMovieCrowd(
  props: steerAutoMovieCrowd.IProps,
): steerAutoMovieCrowd.IResult {
  const tau: number = props.law?.relaxation ?? steerAutoMovieCrowd.RELAXATION;
  const t0: number = props.law?.horizon ?? steerAutoMovieCrowd.HORIZON;
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
    if (goals(a).length === 0)
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
        compare(agents[a]!, agents[b]!) || a - b,
    );
  const paths: IPath[] = order.map((i: number): IPath => pathOf(agents[i]!));

  // The right-hand side over the stacked state [x, z, vx, vz] per agent in canonical order.
  const f = (
    t: number,
    x: readonly number[],
  ): integrateMotionTrajectory.IRate => {
    const dx: number[] = new Array<number>(4 * n).fill(0);
    const placed: IAutoMovieVector3[][] = obstacles.map(
      (o: IAutoMovieCrowdAgent.IObstacle): IAutoMovieVector3[] =>
        footprintAt(o, t),
    );
    const moving: IAutoMovieVector3[] = obstacles.map(
      (o: IAutoMovieCrowdAgent.IObstacle): IAutoMovieVector3 =>
        velocityOf(o, t),
    );
    for (let k: number = 0; k < n; ++k) {
      const agent: IAutoMovieCrowdAgent = agents[order[k]!]!;
      if (t < agent.start) continue;
      const px: number = x[4 * k]!;
      const pz: number = x[4 * k + 1]!;
      const vx: number = x[4 * k + 2]!;
      const vz: number = x[4 * k + 3]!;

      // The desired velocity: along the goals, slowed on arrival, mixed with the neighbours' heading.
      const want: { x: number; z: number; speed: number } = follow(
        paths[k]!,
        px,
        pz,
        agent.speed,
        tau,
      );
      let ex: number = want.x;
      let ez: number = want.z;
      const p: number = agent.herding ?? 0;
      if (p > 0) {
        let mx: number = 0;
        let mz: number = 0;
        for (let j: number = 0; j < n; ++j) {
          if (j === k) continue;
          const sx: number = x[4 * j + 2]!;
          const sz: number = x[4 * j + 3]!;
          const s: number = Math.hypot(sx, sz);
          if (
            s < 1e-6 ||
            Math.hypot(x[4 * j]! - px, x[4 * j + 1]! - pz) >
              steerAutoMovieCrowd.NEIGHBOURHOOD
          )
            continue;
          mx += sx / s;
          mz += sz / s;
        }
        const m: number = Math.hypot(mx, mz);
        if (m > 1e-9) {
          ex = (1 - p) * ex + (p * mx) / m;
          ez = (1 - p) * ez + (p * mz) / m;
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
      const push = (hit: IHit | null): void => {
        if (hit === null || hit.time > steerAutoMovieCrowd.CUTOFF * t0) return;
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
          discs(
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
          polygon(
            px,
            pz,
            vx - moving[o]!.x,
            vz - moving[o]!.z,
            footprint,
            agent.radius,
          ),
        ),
      );

      // A position moves no faster than the agent's maximum.
      const top: number =
        agent.maximum ?? steerAutoMovieCrowd.MAXIMUM * agent.speed;
      const speed: number = Math.hypot(vx, vz);
      const scale: number = speed > top ? top / speed : 1;
      dx[4 * k] = vx * scale;
      dx[4 * k + 1] = vz * scale;
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
      const destination: IAutoMovieVector3 = finalGoal(agents[i]!);
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
        if (depth > 1e-9) touch(`a${i}:${j}`, depth, i, { kind: "agent", index: j });
      }
      obstacles.forEach(
        (o: IAutoMovieCrowdAgent.IObstacle, k: number): void => {
          const depth: number =
            agents[i]!.radius - signedDistance(ax, az, footprintAt(o, seconds));
          if (depth > 1e-9) touch(`o${i}:${k}`, depth, i, { kind: "obstacle", index: k });
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

  /** Times to collision beyond this many horizons are ignored (provisional: the energy has fallen below a ten-thousandth of its value at one second by then). */
  export const CUTOFF: number = 3;

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

/** A predicted collision: when, the contact normal toward the agent, and the closing velocity. */
interface IHit {
  /** Seconds until it. */
  time: number;

  /** The unit contact normal's x, pointing toward the agent. */
  nx: number;

  /** Its z. */
  nz: number;

  /** The agent's velocity relative to the other, x. */
  ux: number;

  /** Its z. */
  uz: number;
}

/** An agent's goal polyline: its corners and their arc distances. */
interface IPath {
  /** The corners, the start first. */
  points: readonly IAutoMovieVector3[];

  /** The arc distance at each corner. */
  arcs: readonly number[];
}

/** Agents ordered by their own data. */
function compare(a: IAutoMovieCrowdAgent, b: IAutoMovieCrowdAgent): number {
  const ga: IAutoMovieVector3 = finalGoal(a);
  const gb: IAutoMovieVector3 = finalGoal(b);
  return (
    a.at.x - b.at.x ||
    a.at.z - b.at.z ||
    a.start - b.start ||
    a.speed - b.speed ||
    a.radius - b.radius ||
    (a.herding ?? 0) - (b.herding ?? 0) ||
    ga.x - gb.x ||
    ga.z - gb.z
  );
}

/** An agent's destination. */
function finalGoal(agent: IAutoMovieCrowdAgent): IAutoMovieVector3 {
  const list: readonly IAutoMovieVector3[] = goals(agent);
  return list[list.length - 1]!;
}

/** An agent's goals as a list. */
function goals(agent: IAutoMovieCrowdAgent): readonly IAutoMovieVector3[] {
  return "x" in agent.goal ? [agent.goal] : agent.goal;
}

/** The polyline from an agent's start through its goals. */
function pathOf(agent: IAutoMovieCrowdAgent): IPath {
  const points: IAutoMovieVector3[] = [agent.at, ...goals(agent)];
  const arcs: number[] = [0];
  for (let i: number = 1; i < points.length; ++i)
    arcs.push(
      arcs[i - 1]! +
        Math.hypot(
          points[i]!.x - points[i - 1]!.x,
          points[i]!.z - points[i - 1]!.z,
        ),
    );
  return { points, arcs };
}

/** The desired heading and speed at a position: toward the lookahead point on the path, slowed on arrival. */
function follow(
  path: IPath,
  px: number,
  pz: number,
  speed: number,
  tau: number,
): { x: number; z: number; speed: number } {
  const { points, arcs }: IPath = path;
  const total: number = arcs[arcs.length - 1]!;

  // The nearest point of the polyline, the earliest stretch on a tie.
  let best: number = Infinity;
  let along: number = 0;
  let offset: number = 0;
  for (let i: number = 0; i + 1 < points.length; ++i) {
    const a: IAutoMovieVector3 = points[i]!;
    const length: number = arcs[i + 1]! - arcs[i]!;
    if (length < 1e-12) continue;
    const dx: number = (points[i + 1]!.x - a.x) / length;
    const dz: number = (points[i + 1]!.z - a.z) / length;
    const u: number = Math.max(
      0,
      Math.min(length, (px - a.x) * dx + (pz - a.z) * dz),
    );
    const d: number = Math.hypot(a.x + dx * u - px, a.z + dz * u - pz);
    if (d < best - 1e-12) {
      best = d;
      along = arcs[i]! + u;
      offset = d;
    }
  }
  const remaining: number = total - along + offset;
  const end: IAutoMovieVector3 = points[points.length - 1]!;
  const s: number = Math.min(
    total,
    along + speed * steerAutoMovieCrowd.LOOKAHEAD,
  );
  let k: number = 0;
  while (k + 2 < points.length && arcs[k + 1]! < s) ++k;
  const a: IAutoMovieVector3 = points[k]!;
  const b: IAutoMovieVector3 = points[k + 1] ?? end;
  const span: number = arcs[k + 1]! - arcs[k]!;
  const w: number =
    span < 1e-12 ? 1 : Math.min(1, Math.max(0, (s - arcs[k]!) / span));
  const tx: number = a.x + (b.x - a.x) * w - px;
  const tz: number = a.z + (b.z - a.z) * w - pz;
  const length: number = Math.hypot(tx, tz);
  if (length < 1e-9 || remaining < 1e-9) return { x: 0, z: 0, speed: 0 };
  return {
    x: tx / length,
    z: tz / length,
    speed:
      speed *
      Math.min(1, remaining / (speed * tau * steerAutoMovieCrowd.ARRIVAL)),
  };
}

/** The first contact of two discs moving at constant velocities, or null: `|p - u t| = R` with `p` from the agent to the other and `u` the agent's velocity relative to the other. */
function discs(
  px: number,
  pz: number,
  vx: number,
  vz: number,
  qx: number,
  qz: number,
  wx: number,
  wz: number,
  R: number,
): IHit | null {
  const dx: number = qx - px;
  const dz: number = qz - pz;
  const ux: number = vx - wx;
  const uz: number = vz - wz;
  const a: number = ux * ux + uz * uz;
  const b: number = dx * ux + dz * uz;
  const c: number = dx * dx + dz * dz - R * R;
  if (c <= 0 || a < 1e-12 || b <= 0) return null;
  const disc: number = b * b - a * c;
  if (disc <= 0) return null;
  const time: number = (b - Math.sqrt(disc)) / a;
  if (!(time > 0)) return null;
  const nx: number = -(dx - ux * time) / R;
  const nz: number = -(dz - uz * time) / R;
  return { time, nx, nz, ux, uz };
}

/** The first contact of a disc of radius `r` moving at `u` with a still convex polygon, or null. */
function polygon(
  px: number,
  pz: number,
  ux: number,
  uz: number,
  corners: readonly IAutoMovieVector3[],
  r: number,
): IHit | null {
  let best: IHit | null = null;
  const consider = (hit: IHit | null): void => {
    if (hit !== null && (best === null || hit.time < best.time)) best = hit;
  };
  const m: number = corners.length;
  const cx: number =
    corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.x, 0) / m;
  const cz: number =
    corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.z, 0) / m;
  for (let e: number = 0; e < m; ++e) {
    const a: IAutoMovieVector3 = corners[e]!;
    const b: IAutoMovieVector3 = corners[(e + 1) % m]!;
    const length: number = Math.hypot(b.x - a.x, b.z - a.z);
    if (length < 1e-12) continue;

    // The edge's outward normal, turned away from the centroid.
    let nx: number = (b.z - a.z) / length;
    let nz: number = -(b.x - a.x) / length;
    if ((a.x - cx) * nx + (a.z - cz) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    const d: number = (px - a.x) * nx + (pz - a.z) * nz;
    const rate: number = ux * nx + uz * nz;
    if (d > r && rate < 0) {
      const time: number = (d - r) / -rate;
      const hx: number = px + ux * time;
      const hz: number = pz + uz * time;
      const along: number =
        ((hx - a.x) * (b.x - a.x) + (hz - a.z) * (b.z - a.z)) / length;
      if (along >= 0 && along <= length) consider({ time, nx, nz, ux, uz });
    }

    // The corner's rounded cap: a disc of radius r about it.
    consider(discs(px, pz, ux, uz, a.x, a.z, 0, 0, r));
  }
  return best;
}

/** The signed distance from a point to a convex polygon, negative inside. */
function signedDistance(
  px: number,
  pz: number,
  corners: readonly IAutoMovieVector3[],
): number {
  const m: number = corners.length;
  const cx: number =
    corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.x, 0) / m;
  const cz: number =
    corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.z, 0) / m;
  let outside: number = -Infinity;
  let nearest: number = Infinity;
  for (let e: number = 0; e < m; ++e) {
    const a: IAutoMovieVector3 = corners[e]!;
    const b: IAutoMovieVector3 = corners[(e + 1) % m]!;
    const length: number = Math.hypot(b.x - a.x, b.z - a.z);
    if (length < 1e-12) continue;
    let nx: number = (b.z - a.z) / length;
    let nz: number = -(b.x - a.x) / length;
    if ((a.x - cx) * nx + (a.z - cz) * nz < 0) {
      nx = -nx;
      nz = -nz;
    }
    outside = Math.max(outside, (px - a.x) * nx + (pz - a.z) * nz);
    const u: number = Math.max(
      0,
      Math.min(
        length,
        ((px - a.x) * (b.x - a.x) + (pz - a.z) * (b.z - a.z)) / length,
      ),
    );
    nearest = Math.min(
      nearest,
      Math.hypot(
        a.x + ((b.x - a.x) * u) / length - px,
        a.z + ((b.z - a.z) * u) / length - pz,
      ),
    );
  }
  return outside <= 0 ? outside : nearest;
}

/** An obstacle's footprint in the world at a second. */
function footprintAt(
  obstacle: IAutoMovieCrowdAgent.IObstacle,
  seconds: number,
): IAutoMovieVector3[] {
  if (obstacle.motion === undefined) return [...obstacle.footprint];
  const { position, yaw }: { position: IAutoMovieVector3; yaw: number } =
    obstacle.motion(seconds);
  const h: number = (yaw * Math.PI) / 180;
  const cos: number = Math.cos(h);
  const sin: number = Math.sin(h);

  // Its own x is its left and its z ahead: (cos h, -sin h) and (sin h, cos h) in the world.
  return obstacle.footprint.map(
    (c: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: position.x + c.x * cos + c.z * sin,
      y: 0,
      z: position.z - c.x * sin + c.z * cos,
    }),
  );
}

/** An obstacle's velocity at a second, by a central difference of its motion over a millisecond; still without one. */
function velocityOf(
  obstacle: IAutoMovieCrowdAgent.IObstacle,
  seconds: number,
): IAutoMovieVector3 {
  if (obstacle.motion === undefined) return { x: 0, y: 0, z: 0 };
  const h: number = 5e-4;
  const a: IAutoMovieVector3 = obstacle.motion(seconds - h).position;
  const b: IAutoMovieVector3 = obstacle.motion(seconds + h).position;
  return { x: (b.x - a.x) / (2 * h), y: 0, z: (b.z - a.z) / (2 * h) };
}
