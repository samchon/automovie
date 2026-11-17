import type {
  IAutoMovieCrowdAgent,
  IAutoMovieSolveHalfPlaneProgram,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The geometry the crowd steering pass reads (`steerAutoMovieCrowd`): an
 * agent's goal path and the point it heads for, the time to collision of two
 * discs and of a disc with a convex obstacle, the reciprocal half-plane of
 * velocities that keeps two discs apart, a point's distance from an
 * obstacle, and a moving obstacle's footprint and velocity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and who reads it.
 * @evidence contracts/development/design.md#principled-representation Pure functions of floor-plan geometry in world metres and seconds, and the two records they exchange.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `steerAutoMovieCrowd` reads, split from it by responsibility so the pass holds the law and the integration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No function reads the pass's state: each takes its inputs.
 */
export namespace steerAutoMovieCrowdGeometry {
  /**
   * A predicted collision: when, the contact normal toward the agent, and the closing velocity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it holds and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The time to collision in seconds, a unit normal on the floor plan and the relative velocity in metres per second, the three factors of the power law's gradient.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the pass's push alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The normal is stored as its two floor components, since the pass is planar.
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

  /**
   * An agent's goal polyline: its corners and their arc distances.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it holds and each member's unit.
   * @evidence contracts/development/design.md#principled-representation Corners in world metres with the cumulative arc distance at each, so a point is found by distance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by path following alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPath {
    /** The corners, the start first. */
    points: readonly IAutoMovieVector3[];

    /** The arc distance at each corner. */
    arcs: readonly number[];
  }

  /**
   * Agents ordered by their own data: the canonical order the pass integrates in, so the order given changes nothing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation A lexicographic order on the agent's start, start second, speed, radius, herding and destination.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain of differences.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No index enters the order; equal agents are interchangeable.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per comparison.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * An agent's destination: its last goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation The last of its goals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function finalGoal(agent: IAutoMovieCrowdAgent): IAutoMovieVector3 {
    const list: readonly IAutoMovieVector3[] = goals(agent);
    return list[list.length - 1]!;
  }

  /**
   * An agent's goals as a list: one point or the points in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation A point is told from a list by its own x coordinate.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the agent's own list or a new one-element list.
   */
  export function goals(
    agent: IAutoMovieCrowdAgent,
  ): readonly IAutoMovieVector3[] {
    return "x" in agent.goal ? [agent.goal] : agent.goal;
  }

  /**
   * The polyline from an agent's start through its goals, with the arc distance at each corner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation Cumulative Euclidean distance on the floor plan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the corners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the goals.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new path the caller keeps.
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
   * The desired heading and speed at a position: toward the point `lookahead` seconds of desired travel past the nearest point of the path, the speed falling linearly within `arrival` relaxation times of travel from the destination (Reynolds 1999's path following and arrival).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation Closest-point projection onto each stretch, the earliest on a tie, then a carrot point along the arc; the arrival slowing is linear in the remaining distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Project, find the carrot, scale the speed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lookahead and arrival are the caller's named constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the path's corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /** The share of the product of two lengths under which their cross product counts as zero in `reciprocal`: several million times a double's rounding, far under any side a walker would choose. */
  export const TIE: number = 1e-9;

  /**
   * The half-plane of velocities that keeps an agent clear of another for a
   * time horizon, taking its share of the avoidance: optimal reciprocal
   * collision avoidance (van den Berg, Guy, Lin and Manocha 2011, section
   * 5.1). The velocity obstacle of the other, truncated at the horizon, is
   * left by the smallest change `u` of the relative velocity, and the agent
   * takes its share `a` of it, the other `1 - a`: the half-plane passes
   * through `v + a u` with its outward normal along `u`. The share is the
   * α-weighted reciprocity of the reciprocal velocity obstacle (van den Berg,
   * Lin and Manocha 2008, with the uneven split of its generalisations): one
   * half while both can take their half within their speed caps
   * (`capacity`), so the paper's even split stands wherever it is
   * feasible; otherwise an agent at its cap takes what the cap allows and
   * the other the rest, and against an agent that does not avoid, all it can. A relative velocity within `TIE` of the cone's
   * axis, relative to the two lengths, takes the right leg, so the choice of
   * side does not turn on the rounding of where the scene stands. Two discs that already overlap are separated
   * within one step `step` instead of the horizon. Coordinates are the
   * floor's `x` and `z` as the plane's two.
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
   * @param top The agent's speed cap, metres per second.
   * @param other The other's speed cap, or 0 when it does not avoid (a standing agent that has not set off).
   * @returns The half-plane, its direction a unit vector, the admissible side on its left.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the constraint, its source, the overlap case and the coordinates.
   * @evidence contracts/development/implementation.md#principled-implementation The paper's construction: the truncated cone's cut-off disc or its nearer leg by the sign of the determinant, or the one-step disc for an overlap, with the alpha-weighted share of RVO, one half wherever both agents can take it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three cases, each one projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coincident centres, which name no direction, take the relative velocity's own direction, or +x when that is zero, so the half-plane is always defined.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reciprocal(
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
    top: number,
    other: number,
  ): IAutoMovieSolveHalfPlaneProgram.ILine {
    const rx: number = qx - px;
    const rz: number = qz - pz;
    const ux: number = vx - wx;
    const uz: number = vz - wz;
    const distance2: number = rx * rx + rz * rz;
    let line: { dx: number; dz: number; cx: number; cz: number };
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
        line = {
          dx: nz,
          dz: -nx,
          cx: (R * inverse - s) * nx,
          cz: (R * inverse - s) * nz,
        };
      } else {
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
        line = { dx, dz, cx: along * dx - ux, cz: along * dz - uz };
      }
    } else {
      // Colliding: separated within one step.
      const inverse: number = 1 / step;
      let sx: number = ux - inverse * rx;
      let sz: number = uz - inverse * rz;
      let s: number = Math.hypot(sx, sz);
      if (s < 1e-12) {
        sx = 1;
        sz = 0;
        s = 1;
      }
      const nx: number = sx / s;
      const nz: number = sz / s;
      line = {
        dx: nz,
        dz: -nx,
        cx: (R * inverse - s) * nx,
        cz: (R * inverse - s) * nz,
      };
    }
    // The share: half while both can take their half within their speed caps; otherwise the capped one takes what its cap allows and the other the rest.
    const own: number = capacity(vx, vz, line.cx, line.cz, top);
    const theirs: number =
      other > 0 ? capacity(wx, wz, -line.cx, -line.cz, other) : 0;
    const share: number = Math.min(own, Math.max(1 - theirs, 0.5));
    return {
      point: { x: vx + share * line.cx, y: vz + share * line.cz },
      direction: { x: line.dx, y: line.dz },
    };
  }

  /**
   * The largest share `a` in [0, 1] of a velocity change `u` an agent can
   * take within its speed cap, `|v + a u| <= top`: the larger root of the
   * quadratic when the cap holds at `a = 0`, and nothing when it does not.
   *
   * @param vx The velocity's x, metres per second.
   * @param vz The velocity's z.
   * @param ux The change's x.
   * @param uz The change's z.
   * @param top The speed cap, metres per second.
   * @returns The share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound solved and its two ends.
   * @evidence contracts/development/implementation.md#principled-implementation The closed-form root of `|v + a u|^2 = top^2`, clipped to the unit interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One discriminant and one root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A change too small to measure is taken whole; a velocity already past its cap can take none.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * The first contact of two discs moving at constant velocities, or null: `|p - u t| = R` with `p` from the agent to the other and `u` the agent's velocity relative to the other; the normal at contact points toward the agent. Two discs that already overlap are in contact now: time 0, the normal from the other's centre toward the agent's.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation The smaller root of the quadratic when the discs approach, and time 0 when they already overlap, the collision Karamouzas, Skinner and Guy's time to collision reads as zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One discriminant and one root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A parting returns null and an overlap time 0, never a guessed time; coincident centres, which name no direction, return null.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * The first contact of a disc of radius `r` moving at `u` with a still convex polygon, or null: the earliest of its edges offset by `r` and its corners' rounded caps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation The Minkowski sum of a convex polygon and a disc is its edges pushed out by the radius and a disc at each corner; each is met by a ray in closed form.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the edges, each tested as a pushed-out segment and a corner disc.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outward normals are turned away from the centroid, so either winding works.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * The signed distance from a point to a convex polygon, negative inside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation Inside, the greatest signed distance to the edges' lines; outside, the least distance to the edges as segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the edges.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
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
   * An obstacle's footprint in the world at a second: as given when still, placed by its motion when moving (its own x to its left, z ahead).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid placement on the floor plan by the motion's position and heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch and one map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the corners.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new list the caller keeps.
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
   * An obstacle's velocity at a second, by a central difference of its motion over a millisecond; zero for a still one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it computes, its inputs' frames and units, and its result.
   * @evidence contracts/development/implementation.md#principled-implementation A central difference, second-order accurate in its step, of the motion's position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two reads of the motion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step is named here; a motion that is not differentiable there gives its difference quotient.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
}
