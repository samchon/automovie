import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSolveHalfPlaneProgram,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The geometry the crowd steering pass reads (`steerAutoMovieCrowd`): an
 * agent's goal path and the point it heads for, the time to collision of two
 * discs and of a disc with a convex obstacle, the reciprocal half-plane of
 * velocities that keeps two discs apart, the half-plane that keeps a disc clear
 * of a moving obstacle, a point's distance from an obstacle, and a moving
 * obstacle's footprint and velocity.
 */
export namespace steerAutoMovieCrowdGeometry {
  /**
   * A predicted collision: when, the contact normal toward the agent, and the
   * closing velocity.
   */
  export interface IHit {
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
  export interface IPath {
    /** The corners, the start first. */
    points: readonly IAutoMovieVector3[];

    /** The arc distance at each corner. */
    arcs: readonly number[];
  }

  /**
   * Agents ordered by their own data: the canonical order the pass integrates
   * in, so the order given changes nothing.
   */
  export function compare(
    a: IAutoMovieCrowdAgent,
    b: IAutoMovieCrowdAgent,
  ): number {
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

  /** An agent's destination: its last goal. */
  export function finalGoal(agent: IAutoMovieCrowdAgent): IAutoMovieVector3 {
    const list: readonly IAutoMovieVector3[] = goals(agent);
    return list[list.length - 1]!;
  }

  /** An agent's goals as a list: one point or the points in order. */
  export function goals(
    agent: IAutoMovieCrowdAgent,
  ): readonly IAutoMovieVector3[] {
    return "x" in agent.goal ? [agent.goal] : agent.goal;
  }

  /**
   * The polyline from an agent's start through its goals, with the arc distance
   * at each corner.
   */
  export function pathOf(agent: IAutoMovieCrowdAgent): IPath {
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

  /**
   * The desired heading and speed at a position: toward the point `lookahead`
   * seconds of desired travel past the nearest point of the path, the speed
   * falling linearly within `arrival` relaxation times of travel from the
   * destination (Reynolds 1999's path following and arrival).
   */
  export function follow(
    path: IPath,
    px: number,
    pz: number,
    speed: number,
    tau: number,
    lookahead: number,
    arrival: number,
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
    const s: number = Math.min(total, along + speed * lookahead);
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
      speed: speed * Math.min(1, remaining / (speed * tau * arrival)),
    };
  }

  /**
   * The share of the product of two lengths under which their cross product
   * counts as zero in `change`: several million times a double's rounding, far
   * under any side a walker would choose.
   */
  export const TIE: number = 1e-9;

  /**
   * The smallest change `u` of an agent's velocity relative to another's that
   * leaves the other's velocity obstacle, truncated at a time horizon, and the
   * direction of the half-plane boundary it defines, the admissible side on its
   * left: the construction of optimal reciprocal collision avoidance (van den
   * Berg, Guy, Lin and Manocha 2011, section 5.1), before either agent takes
   * its share. A relative velocity within `TIE` of the cone's axis, relative to
   * the two lengths, takes the right leg, so the choice of side does not turn
   * on the rounding of where the scene stands. Two discs that already overlap
   * are separated within one step `step` instead of the horizon. Coordinates
   * are the floor's `x` and `z` as the plane's two.
   *
   * Read from the other agent's side, every input difference is negated and
   * every operation is odd or even in them, so each nonzero component is
   * exactly this one negated; the one exception is two overlapping discs with
   * no separating velocity, whose fallback direction does not turn with the
   * pair.
   *
   * @param px The agent's x, metres.
   * @param pz The agent's z, metres.
   * @param vx The agent's velocity x, metres per second.
   * @param vz The agent's velocity z.
   * @param qx The other's x.
   * @param qz The other's z.
   * @param wx The other's velocity x.
   * @param wz The other's velocity z.
   * @param R The two radii summed, metres.
   * @param horizon The time horizon, seconds.
   * @param step The integration step, seconds, for an overlap.
   * @param into Receives the boundary's unit direction x and z, then the
   *   change's x and z, metres per second.
   * @param at Where in `into` the four values start.
   * @returns Whether the pair read from the other's side negates this reading:
   *   false only for the overlap fallback.
   */
  export function change(
    px: number,
    pz: number,
    vx: number,
    vz: number,
    qx: number,
    qz: number,
    wx: number,
    wz: number,
    R: number,
    horizon: number,
    step: number,
    into: Float64Array,
    at: number,
  ): boolean {
    const rx: number = qx - px;
    const rz: number = qz - pz;
    const ux: number = vx - wx;
    const uz: number = vz - wz;
    const distance2: number = rx * rx + rz * rz;
    if (distance2 > R * R) {
      // Not colliding: the cone truncated at the horizon.
      const inverse: number = 1 / horizon;
      const sx: number = ux - inverse * rx;
      const sz: number = uz - inverse * rz;
      const s2: number = sx * sx + sz * sz;
      const dot: number = sx * rx + sz * rz;
      if (dot < 0 && dot * dot > R * R * s2) {
        // The cut-off disc.
        const s: number = Math.sqrt(s2);
        const nx: number = sx / s;
        const nz: number = sz / s;
        into[at] = nz;
        into[at + 1] = -nx;
        into[at + 2] = (R * inverse - s) * nx;
        into[at + 3] = (R * inverse - s) * nz;
        return true;
      }
      // The nearer leg.
      const leg: number = Math.sqrt(distance2 - R * R);
      // A relative velocity on the cone's axis names no leg; within the rounding of the inputs the right leg is taken, so a pair met head-on or in file passes the same way however the scene is placed.
      const cross: number = rx * sz - rz * sx;
      const left: boolean =
        Math.abs(cross) > TIE * Math.sqrt(distance2 * s2) && cross > 0;
      const dx: number = left
        ? (rx * leg - rz * R) / distance2
        : -(rx * leg + rz * R) / distance2;
      const dz: number = left
        ? (rx * R + rz * leg) / distance2
        : -(-rx * R + rz * leg) / distance2;
      const along: number = ux * dx + uz * dz;
      into[at] = dx;
      into[at + 1] = dz;
      into[at + 2] = along * dx - ux;
      into[at + 3] = along * dz - uz;
      return true;
    }
    // Colliding: separated within one step.
    const inverse: number = 1 / step;
    let sx: number = ux - inverse * rx;
    let sz: number = uz - inverse * rz;
    let s: number = Math.hypot(sx, sz);
    const turns: boolean = !(s < 1e-12);
    if (!turns) {
      sx = 1;
      sz = 0;
      s = 1;
    }
    const nx: number = sx / s;
    const nz: number = sz / s;
    into[at] = nz;
    into[at + 1] = -nx;
    into[at + 2] = (R * inverse - s) * nx;
    into[at + 3] = (R * inverse - s) * nz;
    return turns;
  }

  /**
   * The largest share `a` in [0, 1] of a velocity change `u` an agent can take
   * within its speed cap, `|v + a u| <= top`: the larger root of the quadratic
   * when the cap holds at `a = 0`, and nothing when it does not.
   *
   * @param vx The velocity's x, metres per second.
   * @param vz The velocity's z.
   * @param ux The change's x.
   * @param uz The change's z.
   * @param top The speed cap, metres per second.
   * @returns The share.
   */
  export function capacity(
    vx: number,
    vz: number,
    ux: number,
    uz: number,
    top: number,
  ): number {
    const a: number = ux * ux + uz * uz;
    if (a < 1e-24) return 1;
    const b: number = vx * ux + vz * uz;
    const c: number = vx * vx + vz * vz - top * top;
    if (c > 0) return 0;
    const root: number = (-b + Math.sqrt(Math.max(0, b * b - a * c))) / a;
    return Math.min(1, Math.max(0, root));
  }

  /**
   * The first contact of two discs moving at constant velocities, or null: `|p
   * - u t| = R` with `p` from the agent to the other and `u` the agent's
   * velocity relative to the other; the normal at contact points toward the
   * agent. Two discs that already overlap are in contact now: time 0, the
   * normal from the other's centre toward the agent's.
   */
  export function discs(
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
    if (c <= 0) {
      const d: number = Math.hypot(dx, dz);
      return d < 1e-12 ? null : { time: 0, nx: -dx / d, nz: -dz / d, ux, uz };
    }
    if (a < 1e-12 || b <= 0) return null;
    const disc: number = b * b - a * c;
    if (disc <= 0) return null;
    const time: number = (b - Math.sqrt(disc)) / a;
    if (!(time > 0)) return null;
    const nx: number = -(dx - ux * time) / R;
    const nz: number = -(dz - uz * time) / R;
    return { time, nx, nz, ux, uz };
  }

  /**
   * The first contact of a disc of radius `r` moving at `u` with a still convex
   * polygon, or null: the earliest of its edges offset by `r` and its corners'
   * rounded caps.
   */
  export function polygon(
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
      corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.x, 0) /
      m;
    const cz: number =
      corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.z, 0) /
      m;
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
  export function signedDistance(
    px: number,
    pz: number,
    corners: readonly IAutoMovieVector3[],
  ): number {
    const m: number = corners.length;
    const cx: number =
      corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.x, 0) /
      m;
    const cz: number =
      corners.reduce((s: number, c: IAutoMovieVector3): number => s + c.z, 0) /
      m;
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

  /**
   * An obstacle's footprint in the world at a second: as given when still,
   * placed by its motion when moving (its own x to its left, z ahead).
   */
  export function footprintAt(
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

  /**
   * An obstacle's velocity at a second, by a central difference of its motion
   * over a millisecond; zero for a still one.
   */
  export function velocityOf(
    obstacle: IAutoMovieCrowdAgent.IObstacle,
    seconds: number,
  ): IAutoMovieVector3 {
    if (obstacle.motion === undefined) return { x: 0, y: 0, z: 0 };
    const h: number = 5e-4;
    const a: IAutoMovieVector3 = obstacle.motion(seconds - h).position;
    const b: IAutoMovieVector3 = obstacle.motion(seconds + h).position;
    return { x: (b.x - a.x) / (2 * h), y: 0, z: (b.z - a.z) / (2 * h) };
  }

  /**
   * The half-plane of velocities that keeps an agent's disc clear of a moving
   * convex obstacle for a time horizon, taken by the agent alone.
   *
   * The construction is the obstacle's velocity obstacle (Fiorini and Shiller
   * 1998, Motion planning in dynamic environments using velocity obstacles, Int
   * J Robot Res 17(7):760). It contains every velocity relative to the obstacle
   * that brings the disc into it within the horizon, so it is the union over `s
   * >= 1 / horizon` of `s Q`, where `Q` is the footprint grown by the radius
   * and seen from the agent. That union is the convex set `Q / horizon +
   * cone(Q)`: the near side of the scaled footprint between two legs through
   * the origin.
   *
   * The half-plane is the obstacle's line of optimal reciprocal collision
   * avoidance (van den Berg, Guy, Lin and Manocha 2011) with the agent's share
   * whole, since an obstacle does not avoid. Outside the velocity obstacle, the
   * line touches its nearest boundary point, so the current velocity stays
   * admissible. Inside it, the nearest exit can lie beyond the agent's speed. A
   * walker cannot outrun a carriage that overtakes it, nor back away from one
   * met head-on. The line therefore touches the nearest boundary point whose
   * absolute velocity is within `top`: Fiorini and Shiller's reachable
   * avoidance velocities. Only when none is reachable does it touch the nearest
   * point.
   *
   * The footprint grows by the radius with mitred corners, which covers the
   * rounded sum and exceeds it at a corner by at most `r (sec(罐 / 2) - 1)` for
   * a turn `罐`. An agent already inside the grown footprint is sent out through
   * its nearest side within one step.
   *
   * Coordinates are the floor's `x` and `z` as the plane's two; a returned
   * line's `y` is the floor's `z`.
   *
   * @param px The agent's x, metres.
   * @param pz The agent's z.
   * @param vx The agent's velocity x, metres per second.
   * @param vz The agent's velocity z.
   * @param wx The obstacle's velocity x.
   * @param wz The obstacle's velocity z.
   * @param corners The obstacle's convex footprint in the world, in either
   *   winding.
   * @param r The agent's radius, metres.
   * @param horizon The time horizon, seconds.
   * @param step The integration step, seconds, for an agent already inside.
   * @param top The agent's speed cap, metres per second.
   * @returns The half-plane, its admissible side on its direction's left, or
   *   null for a footprint with no area.
   */
  export function obstacle(
    px: number,
    pz: number,
    vx: number,
    vz: number,
    wx: number,
    wz: number,
    corners: readonly IAutoMovieVector3[],
    r: number,
    horizon: number,
    step: number,
    top: number,
  ): IAutoMovieSolveHalfPlaneProgram.ILine | null {
    // The footprint counter-clockwise in (x, z), without repeated corners.
    const ring: { x: number; z: number }[] = [];
    for (const c of corners) {
      const last: { x: number; z: number } | undefined = ring[ring.length - 1];
      if (last === undefined || Math.hypot(c.x - last.x, c.z - last.z) > 1e-12)
        ring.push({ x: c.x, z: c.z });
    }
    while (
      ring.length > 1 &&
      Math.hypot(
        ring[0]!.x - ring[ring.length - 1]!.x,
        ring[0]!.z - ring[ring.length - 1]!.z,
      ) <= 1e-12
    )
      ring.pop();
    const m: number = ring.length;
    if (m < 3) return null;
    let area: number = 0;
    for (let i: number = 0; i < m; ++i) {
      const a: { x: number; z: number } = ring[i]!;
      const b: { x: number; z: number } = ring[(i + 1) % m]!;
      area += a.x * b.z - b.x * a.z;
    }
    if (Math.abs(area) < 1e-12) return null;
    if (area < 0) ring.reverse();

    // Each edge's outward unit normal, then the footprint grown by the radius
    // with mitred corners, seen from the agent.
    const normals: { x: number; z: number }[] = ring.map(
      (a: { x: number; z: number }, i: number): { x: number; z: number } => {
        const b: { x: number; z: number } = ring[(i + 1) % m]!;
        const length: number = Math.hypot(b.x - a.x, b.z - a.z);
        return { x: (b.z - a.z) / length, z: -(b.x - a.x) / length };
      },
    );
    const q: { x: number; z: number }[] = ring.map(
      (c: { x: number; z: number }, i: number): { x: number; z: number } => {
        const n1: { x: number; z: number } = normals[(i + m - 1) % m]!;
        const n2: { x: number; z: number } = normals[i]!;
        const scale: number = r / (1 + n1.x * n2.x + n1.z * n2.z);
        return {
          x: c.x + (n1.x + n2.x) * scale - px,
          z: c.z + (n1.z + n2.z) * scale - pz,
        };
      },
    );
    const line = (
      cx: number,
      cz: number,
      nx: number,
      nz: number,
    ): IAutoMovieSolveHalfPlaneProgram.ILine => ({
      point: { x: cx + wx, y: cz + wz },
      direction: { x: nz, y: -nx },
    });

    // Already inside: out through the nearest side within one step.
    let outside: number = -Infinity;
    let side: number = 0;
    for (let e: number = 0; e < m; ++e) {
      const distance: number = -(
        normals[e]!.x * q[e]!.x +
        normals[e]!.z * q[e]!.z
      );
      if (distance > outside) {
        outside = distance;
        side = e;
      }
    }
    if (outside <= 0) {
      const n: { x: number; z: number } = normals[side]!;
      return line((n.x * -outside) / step, (n.z * -outside) / step, n.x, n.z);
    }

    // The velocity obstacle's boundary: the scaled footprint's edges that
    // face the agent, and the two legs through its extreme corners.
    const s0: number = 1 / horizon;
    let left: number = 0;
    let right: number = 0;
    for (let i: number = 1; i < m; ++i) {
      if (q[left]!.x * q[i]!.z - q[left]!.z * q[i]!.x > 0) left = i;
      if (q[right]!.x * q[i]!.z - q[right]!.z * q[i]!.x < 0) right = i;
    }
    let mx: number = 0;
    let mz: number = 0;
    for (const c of q) {
      mx += (2 * s0 * c.x) / m;
      mz += (2 * s0 * c.z) / m;
    }
    const pieces: {
      ax: number;
      az: number;
      dx: number;
      dz: number;
      length: number;
      nx: number;
      nz: number;
    }[] = [];
    for (let e: number = 0; e < m; ++e) {
      const n: { x: number; z: number } = normals[e]!;
      const ax: number = s0 * q[e]!.x;
      const az: number = s0 * q[e]!.z;
      if (n.x * ax + n.z * az >= 0) continue;
      const bx: number = s0 * q[(e + 1) % m]!.x;
      const bz: number = s0 * q[(e + 1) % m]!.z;
      const length: number = Math.hypot(bx - ax, bz - az);
      pieces.push({
        ax,
        az,
        dx: (bx - ax) / length,
        dz: (bz - az) / length,
        length,
        nx: n.x,
        nz: n.z,
      });
    }
    for (const corner of [right, left]) {
      const c: { x: number; z: number } = q[corner]!;
      const length: number = Math.hypot(c.x, c.z);
      const dx: number = c.x / length;
      const dz: number = c.z / length;
      const ax: number = s0 * c.x;
      const az: number = s0 * c.z;
      // The leg's normal, turned away from a point inside the velocity obstacle.
      const flip: boolean = dz * (mx - ax) - dx * (mz - az) > 0;
      pieces.push({
        ax,
        az,
        dx,
        dz,
        length: Infinity,
        nx: flip ? -dz : dz,
        nz: flip ? dx : -dx,
      });
    }

    // The relative velocity, whether it lies inside, and the boundary point the line touches.
    const ux: number = vx - wx;
    const uz: number = vz - wz;
    const inside: boolean = pieces.every(
      (piece: (typeof pieces)[number]): boolean =>
        piece.nx * (ux - piece.ax) + piece.nz * (uz - piece.az) <= 0,
    );
    const nearest = (
      reachable: boolean,
    ): {
      x: number;
      z: number;
      nx: number;
      nz: number;
      distance: number;
    } | null => {
      let best: {
        x: number;
        z: number;
        nx: number;
        nz: number;
        distance: number;
      } | null = null;
      for (const piece of pieces) {
        let lo: number = 0;
        let hi: number = piece.length;
        if (reachable) {
          // Where the piece's absolute velocity lies within the speed cap.
          const ex: number = piece.ax + wx;
          const ez: number = piece.az + wz;
          const b: number = ex * piece.dx + ez * piece.dz;
          const disc: number = b * b - (ex * ex + ez * ez - top * top);
          if (disc < 0) continue;
          lo = Math.max(lo, -b - Math.sqrt(disc));
          hi = Math.min(hi, -b + Math.sqrt(disc));
          if (lo > hi) continue;
        }
        const t: number = Math.min(
          hi,
          Math.max(lo, (ux - piece.ax) * piece.dx + (uz - piece.az) * piece.dz),
        );
        const x: number = piece.ax + piece.dx * t;
        const z: number = piece.az + piece.dz * t;
        const distance: number = Math.hypot(ux - x, uz - z);
        if (best === null || distance < best.distance)
          best = { x, z, nx: piece.nx, nz: piece.nz, distance };
      }
      return best;
    };
    // The two legs always bound the velocity obstacle, so the unrestricted search finds a point.
    const touched: {
      x: number;
      z: number;
      nx: number;
      nz: number;
      distance: number;
    } | null = (inside ? nearest(true) : null) ?? nearest(false);
    if (touched === null) return null;
    if (!inside && touched.distance > 1e-12)
      return line(
        touched.x,
        touched.z,
        (ux - touched.x) / touched.distance,
        (uz - touched.z) / touched.distance,
      );
    return line(touched.x, touched.z, touched.nx, touched.nz);
  }
}
