import type {
  IAutoMovieCrowdAgent,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieSolveHalfPlaneProgram,
  IAutoMovieSteerCrowd,
  IAutoMovieVector3,
} from "@automovie/interface";

import { solveAutoMovieHalfPlaneProgram } from "../math/solveAutoMovieHalfPlaneProgram";
import { integrateMotionTrajectory } from "./integrateMotionTrajectory";
import { steerAutoMovieCrowdContacts } from "./steerAutoMovieCrowdContacts";
import { steerAutoMovieCrowdGeometry } from "./steerAutoMovieCrowdGeometry";
import { steerAutoMovieCrowdNeighbours } from "./steerAutoMovieCrowdNeighbours";

/**
 * A crowd's ways planned once: every agent heads for its goals at its own
 * desired speed and avoids the others and the obstacles by anticipation, the
 * whole crowd integrated together on a fixed step and each agent's course read
 * back by time.
 *
 * Each agent's acceleration is the social force model's driving term toward its
 * desired velocity, `(v0 e0 - v) / tau` with the relaxation time `tau` (Helbing
 * and Molnar 1995, Phys Rev E 51:4282), plus the anticipatory interaction of
 * the universal power law (Karamouzas, Skinner and Guy 2014, Phys Rev Lett
 * 113:238701): with every other agent and obstacle it would meet within the
 * time to collision `t` at the current velocities, the force is minus the
 * spatial gradient of `E(t) = k t^-2 exp(-t / t0)`, cut at the horizon: a
 * contact predicted later than `t0` exerts nothing. The paper's `t0`, about 3
 * s, is its estimate of the interaction's intrinsic range, and its measured
 * energy "quickly vanishes" past the observed range, "suggesting a truncation
 * of the interaction when the time-to-collision is large"; the cut makes that
 * truncation exact at `t0` (this repository's ruling: the paper's law itself
 * decays smoothly and its simulation code could not be read). The cut makes the
 * interaction local. Two discs `d` apart with summed radii `R` close their gap
 * no faster than their relative speed `|v_i - v_j|`, so when `d - R > |v_i -
 * v_j| t0` they cannot touch within the horizon and their term is exactly zero;
 * such a pair's reciprocal half-plane is dropped with it, as van den Berg et
 * al.'s RVO2 library keeps only the agents within its neighbour distance
 * (Agent::computeNeighbors, eighborDist). An obstacle is cut alike: when the
 * agent's gap to its footprint exceeds `(max(|v|, maximum) + |w|) t0`, `w` the
 * obstacle's velocity, the agent cannot reach it within the horizon at its
 * speed or its cap, so the obstacle exerts nothing and adds no half-plane, as
 * RVO2 keeps only the obstacles within imeHorizonObst * maxSpeed + radius. Each
 * evaluation finds the pairs inside that bound with a uniform grid
 * (`steerAutoMovieCrowdNeighbours`) whose cell is the largest reach any agent
 * has, `max(NEIGHBOURHOOD, 2 (r_max + v_max t0))`, then tests each candidate
 * exactly; candidates are visited in ascending order, the order of a full scan,
 * so every sum is formed as before and the courses stay deterministic. That
 * gradient is `k exp(-t / t0) t^-2 (2 / t + 1 / t0)` along the contact normal
 * `n` at the predicted collision, divided by the closing speed along it, `-(n .
 * u)`, so the push grows as a collision nears in time and is aimed away from
 * where it would happen. The desired direction `e0` follows the goals as
 * Reynolds's path following does (Reynolds 1999): toward the point `LOOKAHEAD`
 * seconds of desired travel past the agent's nearest point on the polyline of
 * its start and goals, slowed within `ARRIVAL` relaxation times of desired
 * travel from its destination; with a herding share `p` it is `N[(1 - p) e0 + p
 * <v_j> / v0]` (Helbing, Farkas and Vicsek 2000, Nature 407:487), `<v_j>` the
 * mean velocity of the agents within `NEIGHBOURHOOD`, each weighted by Tukey's
 * biweight kernel `(1 - (d / NEIGHBOURHOOD)^2)^2` (Beaton and Tukey 1974; the
 * compactly supported smoothing kernels of SPH and Wendland's family are of the
 * same kind): the paper's mean heading of the neighbours, read with a compact,
 * continuously differentiable weight that falls to nothing at the
 * neighbourhood's edge and a velocity that grows from rest, so the right-hand
 * side is Lipschitz, which a well-posed integration needs (Picard and
 * Lindelof), and no neighbour's entry or start jumps it. At each integration
 * stage, the position rate comes from projecting the agent's own velocity into
 * its `maximum` speed disc and the reciprocal avoidance half-planes over the
 * horizon `t0` (van den Berg, Guy, Lin and Manocha 2011,
 * `solveAutoMovieHalfPlaneProgram`): the anticipatory force steers, and the
 * half-plane program supplies a projected position rate at each integration
 * stage. The program can return a fallback when its constraints are infeasible.
 * An obstacle takes part in the anticipatory push and also in the program. Its
 * half-plane is the agent's own exit from the obstacle's velocity obstacle
 * relative to its motion (Fiorini and Shiller 1998), so an obstacle that
 * overtakes, meets or crosses the agent is anticipated by its velocity. The
 * exit is the nearest the agent's speed can reach
 * (`steerAutoMovieCrowdGeometry.obstacle`). The program keeps the obstacles'
 * half-planes hard when it falls back, as van den Berg et al. keep theirs, so
 * agents may crowd one another but do not give way into an obstacle. The
 * sampled diagnostics cannot certify clearance between knots.
 *
 * The state of the whole crowd is one vector handed to the engine's one
 * fixed-step integrator, `integrateMotionTrajectory` (#3424), so every agent
 * sees every other at the same instant (a synchronous update) and the courses
 * are read back by its Hermite interpolation. Agents with distinct sort keys
 * are integrated in a canonical order, so listing them in another order gives
 * bit-identical courses. Interaction couples agents: adding one changes the
 * others' courses. The pass is kinematic and reports a pair in `contacts` when
 * the pair overlaps at two successive knots.
 *
 * The force scale `K` is the energy's normalisation, which the paper fixes only
 * up to units (E(1) = 1 in its figure); the published simulation's own
 * constants, its force cap and its sensing range were searched for (the paper's
 * supplement and the authors' page could not be read) and are provisional here,
 * as is every other named constant marked so.
 *
 * @param props The agents, the obstacles, the interval, the step and the law's
 *   two times.
 * @returns Each agent's course in the order given, and the contacts.
 * @throws {Error} When an agent's radius, speed or start is not finite and
 *   positive where it must be, a goal list is empty, or the interval is not
 *   forward: a caller's defect.
 */
export function steerAutoMovieCrowd(
  props: IAutoMovieSteerCrowd.IProps,
): IAutoMovieSteerCrowd.IResult {
  const tau: number = props.law?.relaxation ?? steerAutoMovieCrowd.RELAXATION;
  const t0: number = props.law?.horizon ?? steerAutoMovieCrowd.HORIZON;
  const h: number = props.step ?? integrateMotionTrajectory.STEP;
  const agents: readonly IAutoMovieCrowdAgent[] = props.agents;
  agents.forEach((a: IAutoMovieCrowdAgent, i: number): void => {
    for (const [name, value] of [
      ["radius", a.radius],
      ["speed", a.speed],
    ] as const)
      if (!(value > 0))
        throw new Error(
          `steerAutoMovieCrowd: agent ${i}'s ${name} ${value} is not positive`,
        );
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

  // Each pair's readings within one evaluation, its first agent's index the smaller: the evaluation's
  // number, the contact (time, Infinity for none, normal, relative velocity), the avoidance change (direction,
  // change, whether the other side negates it) and the two agents' capacities (the second's Infinity when unread).
  const PAIR: number = 13;
  const pairs: Float64Array = new Float64Array((PAIR * n * (n - 1)) / 2);
  const pair = (a: number, b: number): number =>
    a * n - (a * (a + 1)) / 2 + (b - a - 1);
  const scratch: Float64Array = new Float64Array(4);
  let epoch: number = 0;

  // Each agent's radius in canonical order and the widest, for the neighbour cut.
  const radii: Float64Array = Float64Array.from(
    order,
    (i: number): number => agents[i]!.radius,
  );
  const widest: number = Math.max(...radii);

  // One agent's candidates and, of those, the ones it can meet, rewritten per agent.
  const candidates: Int32Array = new Int32Array(n);
  const meeting: Int32Array = new Int32Array(n);

  // The right-hand side over the stacked state [x, z, vx, vz] per agent in canonical order.
  const f = (
    t: number,
    x: readonly number[],
  ): IAutoMovieIntegrateMotionTrajectory.IRate => {
    epoch += 1;
    let ax: number = 0;
    let az: number = 0;
    // The anticipatory push of one predicted contact on the current agent.
    const push = (
      time: number,
      nx: number,
      nz: number,
      ux: number,
      uz: number,
    ): void => {
      // A present overlap is a time to collision of zero, the energy's singularity: the pair is pushed apart at the cap, as the power law's reference implementation treats a collision.
      if (time === 0) {
        ax += steerAutoMovieCrowd.CAP * nx;
        az += steerAutoMovieCrowd.CAP * nz;
        return;
      }
      // The law is cut at its horizon: a contact predicted later than `t0` pushes nothing.
      if (time > t0) return;
      const closing: number = -(nx * ux + nz * uz);
      if (!(closing > 1e-9)) return;
      const tt: number = Math.max(time, 1e-3);
      const size: number = Math.min(
        steerAutoMovieCrowd.CAP,
        (steerAutoMovieCrowd.K * Math.exp(-tt / t0) * (2 / tt + 1 / t0)) /
          (tt * tt * closing),
      );
      ax += size * nx;
      az += size * nz;
    };
    const hit = (found: steerAutoMovieCrowdGeometry.IHit | null): void => {
      if (found !== null)
        push(found.time, found.nx, found.nz, found.ux, found.uz);
    };

    // The neighbour cut. Two discs whose gap `d - R` exceeds `|v_k - v_j| t0`
    // cannot touch within the horizon at their current velocities, since their
    // gap shrinks no faster than their relative speed: their power-law term is
    // zero by the cut above, and their half-plane is dropped with it. The
    // relative speed is at most `2 v_max`.
    // A query reaches the farthest such pair and the herding neighbourhood,
    // so the uniform grid's cell is the largest reach any agent has.
    const speeds: Float64Array = new Float64Array(n);
    let fastest: number = 0;
    for (let j: number = 0; j < n; ++j) {
      speeds[j] = Math.hypot(x[4 * j + 2]!, x[4 * j + 3]!);
      fastest = Math.max(fastest, speeds[j]!);
    }
    const near: steerAutoMovieCrowdNeighbours.Query =
      steerAutoMovieCrowdNeighbours(
        x,
        n,
        Math.max(
          steerAutoMovieCrowd.NEIGHBOURHOOD,
          2 * (widest + fastest * t0),
        ),
      );
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

      // The agents in reach, ascending as a full scan visits them, and of
      // those the ones the horizon can bring into contact with this agent.
      const reach: number = near(k, candidates);
      let met: number = 0;
      for (let c: number = 0; c < reach; ++c) {
        const j: number = candidates[c]!;
        if (
          Math.hypot(x[4 * j]! - px, x[4 * j + 1]! - pz) -
            (radii[k]! + radii[j]!) <=
          Math.hypot(vx - x[4 * j + 2]!, vz - x[4 * j + 3]!) * t0
        )
          meeting[met++] = j;
      }

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
        for (let c: number = 0; c < reach; ++c) {
          const j: number = candidates[c]!;
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
      ax = (want.speed * ex - vx) / tau;
      az = (want.speed * ez - vz) / tau;

      // The anticipatory push from every agent and obstacle it would meet.
      // A pair's contact is read once, by its first agent to set off; the
      // other reads it negated where every component is nonzero, which is
      // exactly what it would compute, and computes it otherwise. The cut is
      // symmetric, so both agents of a pair read it or neither does.
      for (let c: number = 0; c < met; ++c) {
        const j: number = meeting[c]!;
        if (j < k) {
          const b: number = PAIR * pair(j, k);
          if (pairs[b] === epoch) {
            const time: number = pairs[b + 1]!;
            if (time === Infinity) continue;
            const nx: number = pairs[b + 2]!;
            const nz: number = pairs[b + 3]!;
            const ux: number = pairs[b + 4]!;
            const uz: number = pairs[b + 5]!;
            if (nx !== 0 && nz !== 0 && ux !== 0 && uz !== 0) {
              push(time, -nx, -nz, -ux, -uz);
              continue;
            }
          }
          hit(
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
          continue;
        }
        const found: steerAutoMovieCrowdGeometry.IHit | null =
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
          );
        const b: number = PAIR * pair(k, j);
        pairs[b] = epoch;
        if (found === null) pairs[b + 1] = Infinity;
        else {
          pairs[b + 1] = found.time;
          pairs[b + 2] = found.nx;
          pairs[b + 3] = found.nz;
          pairs[b + 4] = found.ux;
          pairs[b + 5] = found.uz;
        }
        hit(found);
      }
      // An obstacle is cut as an agent is: one whose gap exceeds what the
      // agent, at the larger of its speed and its cap, and the obstacle's own
      // motion can close within the horizon exerts nothing and adds no
      // half-plane (RVO2's Agent::computeNeighbors keeps only the obstacles
      // within 	imeHorizonObst * maxSpeed + radius).
      const top: number =
        agent.maximum ?? steerAutoMovieCrowd.MAXIMUM * agent.speed;
      const pace: number = Math.max(speeds[k]!, top);
      const reached: boolean[] = placed.map(
        (footprint: IAutoMovieVector3[], o: number): boolean =>
          steerAutoMovieCrowdGeometry.signedDistance(px, pz, footprint) -
            agent.radius <=
          (pace + Math.hypot(moving[o]!.x, moving[o]!.z)) * t0,
      );
      placed.forEach((footprint: IAutoMovieVector3[], o: number): void => {
        if (reached[o])
          hit(
            steerAutoMovieCrowdGeometry.polygon(
              px,
              pz,
              vx - moving[o]!.x,
              vz - moving[o]!.z,
              footprint,
              agent.radius,
            ),
          );
      });

      // A position moves at the velocity nearest the agent's own that keeps it clear of every other agent for the horizon, taking its share of each avoidance, and no faster than its maximum (the ORCA velocity projection; an infeasible program may return a fallback).
      // The share (the alpha-weighted reciprocity of van den Berg, Lin and Manocha 2008, with the uneven split of its generalisations): half while both can take their half within their speed caps (`capacity`); otherwise the capped one takes what its cap allows and the other the rest, and against an agent that does not avoid, all it can. A pair's change and both capacities are read once, as the contact is.
      const lines: IAutoMovieSolveHalfPlaneProgram.ILine[] = [];

      // Each obstacle's velocity obstacle, left by the agent alone since an obstacle does not avoid; listed first, as the obstacles' lines are in van den Berg et al.'s program.
      placed.forEach((footprint: IAutoMovieVector3[], o: number): void => {
        if (!reached[o]) return;
        const line: IAutoMovieSolveHalfPlaneProgram.ILine | null =
          steerAutoMovieCrowdGeometry.obstacle(
            px,
            pz,
            vx,
            vz,
            moving[o]!.x,
            moving[o]!.z,
            footprint,
            agent.radius,
            t0,
            h,
            top,
          );
        if (line !== null) lines.push(line);
      });
      const hard: number = lines.length;
      for (let c: number = 0; c < met; ++c) {
        const j: number = meeting[c]!;
        // An agent that has not set off stands and avoids nobody.
        const other: number =
          t < agents[order[j]!]!.start
            ? 0
            : (agents[order[j]!]!.maximum ??
              steerAutoMovieCrowd.MAXIMUM * agents[order[j]!]!.speed);
        let own: number;
        let theirs: number;
        let at: number;
        let source: Float64Array;
        let sign: number = 1;
        const first: number = j < k ? PAIR * pair(j, k) : -1;
        if (
          first >= 0 &&
          pairs[first] === epoch &&
          pairs[first + 10] === 1 &&
          pairs[first + 6] !== 0 &&
          pairs[first + 7] !== 0 &&
          pairs[first + 8] !== 0 &&
          pairs[first + 9] !== 0
        ) {
          // The first agent's reading, negated; its capacities are this agent's own (the second) and the first's.
          source = pairs;
          at = first + 6;
          sign = -1;
          own =
            pairs[first + 12] === Infinity
              ? steerAutoMovieCrowdGeometry.capacity(
                  vx,
                  vz,
                  -pairs[first + 8]!,
                  -pairs[first + 9]!,
                  top,
                )
              : pairs[first + 12]!;
          theirs = other > 0 ? pairs[first + 11]! : 0;
        } else {
          source = j > k ? pairs : scratch;
          at = j > k ? PAIR * pair(k, j) + 6 : 0;
          const turns: boolean = steerAutoMovieCrowdGeometry.change(
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
            source,
            at,
          );
          own = steerAutoMovieCrowdGeometry.capacity(
            vx,
            vz,
            source[at + 2]!,
            source[at + 3]!,
            top,
          );
          theirs =
            other > 0
              ? steerAutoMovieCrowdGeometry.capacity(
                  x[4 * j + 2]!,
                  x[4 * j + 3]!,
                  -source[at + 2]!,
                  -source[at + 3]!,
                  other,
                )
              : 0;
          if (j > k) {
            source[at + 4] = turns ? 1 : 0;
            source[at + 5] = own;
            source[at + 6] = other > 0 ? theirs : Infinity;
          }
        }
        const share: number = Math.min(own, Math.max(1 - theirs, 0.5));
        const cx: number = sign * source[at + 2]!;
        const cz: number = sign * source[at + 3]!;
        lines.push({
          point: { x: vx + share * cx, y: vz + share * cz },
          direction: { x: sign * source[at]!, y: sign * source[at + 1]! },
        });
      }
      // The obstacles' half-planes stay hard when the program is infeasible: walkers may crowd one another but not enter an obstacle.
      const moved: IAutoMovieSolveHalfPlaneProgram.IPoint =
        solveAutoMovieHalfPlaneProgram(
          lines,
          top,
          { x: vx, y: vz },
          hard,
        ).point;
      dx[4 * k] = moved.x;
      dx[4 * k + 1] = moved.y;
      dx[4 * k + 2] = ax;
      dx[4 * k + 3] = az;
    }
    return { dx };
  };
  const x0: number[] = [];
  for (const i of order) x0.push(agents[i]!.at.x, agents[i]!.at.z, 0, 0);
  const trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => f(t, x),
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
  const { arrival, contacts }: steerAutoMovieCrowdContacts.IResult =
    steerAutoMovieCrowdContacts(
      agents,
      obstacles,
      slot,
      trajectory,
      props.from,
      props.to,
    );
  // The integrator returns an owned copy of the stacked state. Keep just
  // the latest one private to every agent's course, which projects fresh records.
  let sampledSeconds: number | undefined;
  let sampledState: readonly number[] = [];
  return {
    courses: agents.map(
      (_: IAutoMovieCrowdAgent, i: number): IAutoMovieCrowdAgent.ICourse => ({
        at: (
          seconds: number,
        ): { position: IAutoMovieVector3; velocity: IAutoMovieVector3 } => {
          if (!Object.is(seconds, sampledSeconds)) {
            sampledState = trajectory.at(seconds).x;
            sampledSeconds = seconds;
          }
          const k: number = slot[i]!;
          return {
            position: {
              x: sampledState[4 * k]!,
              y: 0,
              z: sampledState[4 * k + 1]!,
            },
            velocity: {
              x: sampledState[4 * k + 2]!,
              y: 0,
              z: sampledState[4 * k + 3]!,
            },
          };
        },
        arrival: arrival[i]!,
      }),
    ),
    contacts,
  };
}

/** Companion types and constants of {@link steerAutoMovieCrowd}. */
export namespace steerAutoMovieCrowd {
  /** The relaxation time of the driving term, seconds (Helbing and Molnar 1995). */
  export const RELAXATION: number = 0.5;

  /**
   * The interaction's time horizon `t0`, seconds (Karamouzas, Skinner and Guy
   * 2014: about 3 s).
   */
  export const HORIZON: number = 3;

  /**
   * The energy's scale `k`, square metres per second squared (provisional: the
   * paper normalises it away; 1.5 is recalled from the authors' reference
   * implementation, not read).
   */
  export const K: number = 1.5;

  /**
   * The largest push, metres per second squared (provisional: caps the
   * gradient's singularity at a grazing pass, which the implicit-crowds work of
   * Karamouzas, Sohre, Narain and Guy 2017 describes).
   */
  export const CAP: number = 20;

  /**
   * Metres within which a neighbour's heading enters the herding mean
   * (provisional: Helbing, Farkas and Vicsek 2000 say "a certain
   * neighborhood").
   */
  export const NEIGHBOURHOOD: number = 2;

  /**
   * Seconds of desired travel ahead of the nearest point of the goals' polyline
   * that the agent heads for (provisional, after Reynolds 1999's path
   * following).
   */
  export const LOOKAHEAD: number = 1;

  /**
   * Relaxation times of desired travel from the destination within which the
   * desired speed falls linearly to 0 (provisional, Reynolds 1999's arrival).
   */
  export const ARRIVAL: number = 2;

  /**
   * The maximum speed over the desired one when an agent gives none (Helbing
   * and Molnar 1995: 1.3).
   */
  export const MAXIMUM: number = 1.3;
}
