import type { AutoMovieVector2Tuple, AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieHumanConicSection, IAutoMovieViewChain } from "@automovie/interface";

import { FamilyConicJunctionMember } from "./FamilyConicJunctionMember";

/**
 * A composed end's junction read on its own curves (joints-one-shot.md, "2026-11-23: the fairing fit's cost, measured, and its
 * redesign"): each member's rings at the stations of its fairing window and its guide-phase lines through them, and its cut by the end
 * plane, all from the family's fields at those stations, with no declaration and no loft.
 *
 * A loft's ring at a station is its section there exactly: the engine's derived outlines interpolate through the stations, and the
 * section at a station is the engine's native chain of the fields' resolved input (`AutoMovieHumanConicSection.chain`), read at a phase
 * by `AutoMovieViewChain.read` and carried by the course's frame (`AutoMovieHumanConicLoft.axis`, which holds the origin line and the
 * roll). So the rings and lines equal the loft's at its stations. The cut by the end plane is read between the stations that bracket
 * the plane, along each phase by the natural cubic through those stations' points (four of them, or the two nearest when fewer stand
 * there), the same interpolation along the station the loft's outlines make; the composed end's own admission reads the lofted cut.
 *
 * Every section the model reads goes through one provider (`ISections`), so a caller can count them: a reading's cost is that count.
 */
export namespace FamilyConicJunction {
  type V = AutoMovieVector3Tuple;
  type P = AutoMovieVector2Tuple;
  type Resolve = (values: readonly number[]) => IAutoMovieHumanConicSection.IChain;
  type Family = IAutoMovieHumanConicLoft.IFamily;

  /** The engine sections of a family by station: one preparation per family, then one section per call. */
  export interface ISections {
    /** Prepare `family` once (its fields' reader); the returned function gives its engine section at a station, mm. */
    prepare: (family: Family, resolve?: Resolve) => (station: number) => IAutoMovieViewChain.ISection;
  }

  /** The counted provider for exact and locally perturbed sections. */
  export const sections: typeof FamilyConicJunctionMember.sections = FamilyConicJunctionMember.sections;

  /** Prepare one member's immutable sample layout before any fit readings. */
  export const prepareMember: typeof FamilyConicJunctionMember.prepareMember = FamilyConicJunctionMember.prepareMember;

  /** The end plane: its origin, its in-plane axes and its normal toward the children. */
  export interface IPlane {
    /** A point of the plane, mm. */
    origin: V;
    /** The first in-plane axis, a unit vector. */
    x: V;
    /** The second in-plane axis, a unit vector. */
    y: V;
    /** The normal toward the children, a unit vector. */
    z: V;
  }

  /** One member of a junction: a child (or the host) by face, with its own family and where it is read. */
  export interface IMember {
    /** The member's face name. */
    face: string;
    /** The member's family at the state read (a twin already mirrored). */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Stations of its fairing rings, mm, increasing. */
    rings: readonly number[];
    /** Stations of its guide-phase lines, mm, increasing. */
    lines: readonly number[];
    /** Phases each ring is read at, radians. */
    phases: readonly number[];
    /** Phases of its guide-phase lines, radians. */
    guides: readonly number[];
    /** Stations bracketing the end plane, mm, increasing: its cut is read between them; empty for a member not cut. */
    bracket: readonly number[];
    /** Phases its cut is read at, radians. */
    cut: readonly number[];
    /** Stations its wedge lines are read at through the cut phases, mm, increasing; absent, none. */
    wedge?: readonly number[];
  }

  /** What one reading of a member gives. */
  export interface IRead {
    /** The member's face name. */
    face: string;
    /** Each ring's world points, by ring station then phase. */
    rings: V[][];
    /** Each guide line's world points, by guide phase then line station. */
    lines: V[][];
    /** The cut: in-plane points `[x, y]` by cut phase, and their world points; null where a phase's line does not cross the plane. */
    cut: ([number, number] | null)[];
    /** The course's section plane normal at each ring station (the rings' curvature is signed by it). */
    normals: V[];
    /**
     * The member's axis at its cut: the mean of the unit station tangents of its phase lines where they cross the plane, as the composed
     * end's section axis is (`AutoMovieConstructionComposedEnd.section`), along increasing station; null without a cut.
     */
    axis: V | null;
    /** By cut phase, the unit station tangent's rate across the end plane where the line crosses it (transversal when positive). */
    crossing: (number | null)[];
    /** By cut phase, the line's points at the wedge stations. */
    wedgeLines: V[][];
  }

  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  /**
   * Read one member at its stations.
   *
   * @param member The member.
   * @param plane The end plane (its cut is read only when `bracket` is not empty).
   * @param provider The section provider.
   */
  export function read(member: IMember, plane: IPlane, provider: ISections): IRead {
    return prepareMember(member, plane).read(member.family, provider);
  }

  /** Whether a point lies inside a closed polygon, by the even-odd rule. */
  export function inside(p: readonly [number, number], polygon: readonly (readonly [number, number])[]): boolean {
    let odd = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [a, b] = [polygon[i]!, polygon[j]!];
      if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) odd = !odd;
    }
    return odd;
  }

  /** The nearest point of a closed polygon's boundary to a point: its distance, the segment and its parameter. */
  export function nearest(p: readonly [number, number], polygon: readonly (readonly [number, number])[]): { distance: number; segment: number; t: number; at: [number, number] } {
    let best = { distance: Infinity, segment: -1, t: 0, at: [0, 0] as [number, number] };
    for (let i = 0; i < polygon.length; ++i) {
      const [a, b] = [polygon[i]!, polygon[(i + 1) % polygon.length]!];
      const [ex, ey] = [b[0] - a[0], b[1] - a[1]];
      const l2 = ex * ex + ey * ey;
      const t = l2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / l2)) : 0;
      const at: [number, number] = [a[0] + t * ex, a[1] + t * ey];
      const distance = Math.hypot(p[0] - at[0], p[1] - at[1]);
      if (distance < best.distance) best = { distance, segment: i, t, at };
    }
    return best;
  }

  /** One point of a polygon and its depth in another closed polygon. */
  export interface IDepth {
    /** The depth: the distance to the other's boundary, positive inside it, negative outside, mm. */
    depth: number;
    /** The point's index in its polygon. */
    k: number;
    /** The nearest segment of the other polygon. */
    segment: number;
    /** The share along that segment of the nearest point. */
    t: number;
    /** The rate of minus the depth in the point, a unit vector (zero on the boundary). */
    u: [number, number];
  }

  /**
   * The deepest and the least deep of a polygon's points in another closed polygon. Neighbouring cuts cross, rather than one holding the
   * other, when the deepest depth is positive both ways and the least is at most zero both ways: one point inside, one outside.
   *
   * @param points The polygon whose points are read.
   * @param polygon The closed polygon they are read in.
   */
  export function depths(points: readonly (readonly [number, number])[], polygon: readonly (readonly [number, number])[]): { deepest: IDepth; least: IDepth } {
    let deepest: IDepth | null = null, least: IDepth | null = null;
    for (const [k, p] of points.entries()) {
      const near = nearest(p, polygon), within = inside(p, polygon);
      const depth: number = within ? near.distance : -near.distance;
      const sign: number = within ? -1 : 1;
      const u: [number, number] = near.distance > 0 ? [(p[0] - near.at[0]) / near.distance * sign, (p[1] - near.at[1]) / near.distance * sign] : [0, 0];
      const row: IDepth = { depth, k, segment: near.segment, t: near.t, u };
      if (deepest === null || depth > deepest.depth) deepest = row;
      if (least === null || depth < least.depth) least = row;
    }
    if (deepest === null || least === null) throw new Error("a depth needs at least one point");
    return { deepest, least };
  }

  /** A piece of the composed outline: the part `[from, to]` of the segment from cut `c`'s point `k0` to its next point `k1`. */
  export interface ISegment {
    /** The cut's member index. */
    c: number;
    /** The segment's first cut phase index. */
    k0: number;
    /** The segment's second cut phase index. */
    k1: number;
    /** Where the kept share of the segment starts, from its first point. */
    from: number;
    /** Where the kept share of the segment ends. */
    to: number;
    /** The segment's first point in the plane. */
    a: [number, number];
    /** The segment's second point in the plane. */
    b: [number, number];
  }

  /**
   * The composed outline of cuts as the compose makes it: each cut's segments outside every other cut, a segment that enters another
   * cut clipped at the fork where it crosses that cut's boundary.
   */
  export function outline(cuts: readonly (readonly ([number, number] | null)[])[]): ISegment[] {
    const polygons = cuts.map((cut) => cut.filter((p): p is [number, number] => p !== null));
    const segments: ISegment[] = [];
    cuts.forEach((cut, c: number): void => {
      const rest = polygons.filter((o, j): boolean => j !== c && o.length > 2), n = cut.length;
      for (let k = 0; k < n; ++k) {
        const a = cut[k], b = cut[(k + 1) % n];
        if (a === null || a === undefined || b === null || b === undefined) continue;
        const ina = rest.some((o) => inside(a, o)), inb = rest.some((o) => inside(b, o));
        if (ina && inb) continue;
        let [from, to] = [0, 1];
        if (ina !== inb) {
          let fork = ina ? 0 : 1;
          for (const o of rest) for (let m = 0; m < o.length; ++m) {
            const [p, q] = [o[m]!, o[(m + 1) % o.length]!];
            const den = (b[0] - a[0]) * (q[1] - p[1]) - (b[1] - a[1]) * (q[0] - p[0]);
            if (den === 0) continue;
            const t = ((p[0] - a[0]) * (q[1] - p[1]) - (p[1] - a[1]) * (q[0] - p[0])) / den;
            const w = ((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / den;
            if (t >= 0 && t <= 1 && w >= 0 && w <= 1) fork = ina ? Math.max(fork, t) : Math.min(fork, t);
          }
          [from, to] = ina ? [fork, 1] : [0, fork];
        }
        segments.push({ c, k0: k, k1: (k + 1) % n, from, to, a, b });
      }
    });
    return segments;
  }

  /** A point's nearest point on the composed outline: its distance, the active segment and the share along it. */
  export function onOutline(h: readonly [number, number], segments: readonly ISegment[]): { distance: number; segment: ISegment | null; t: number; at: [number, number] } {
    let best: { distance: number; segment: ISegment | null; t: number; at: [number, number] } = { distance: Infinity, segment: null, t: 0, at: [0, 0] };
    for (const g of segments) {
      const [ex, ey] = [g.b[0] - g.a[0], g.b[1] - g.a[1]], l2 = ex * ex + ey * ey;
      const t = Math.min(g.to, Math.max(g.from, l2 > 0 ? ((h[0] - g.a[0]) * ex + (h[1] - g.a[1]) * ey) / l2 : 0));
      const at: [number, number] = [g.a[0] + t * ex, g.a[1] + t * ey], distance = Math.hypot(h[0] - at[0], h[1] - at[1]);
      if (distance < best.distance) best = { distance, segment: g, t, at };
    }
    return best;
  }

  /** How many times two closed polygons' boundaries cross. */
  export function crossings(a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]): number {
    return forks(a, b).length;
  }

  /** Where two closed polygons' boundaries cross, by the same proper-crossing test as `crossings`, each at its segments' meeting. */
  export function forks(a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]): [number, number][] {
    return intersections(edges(a), edgeTree(edges(b)));
  }

  /** A conservative axis-aligned bound on one or more closed-polygon edges in the end plane. */
  interface IBounds { x0: number; x1: number; y0: number; y1: number }

  /** A cut boundary segment in traversal order. */
  interface IEdge extends IBounds { p: readonly [number, number]; q: readonly [number, number] }

  /** A contiguous interval of traversal order with the union of its edge bounds. */
  type EdgeTree = IEdge | (IBounds & { left: EdgeTree; right: EdgeTree });

  /** Give each cut edge its exact interval in both plane coordinates. */
  function edges(points: readonly (readonly [number, number])[]): IEdge[] {
    return points.map((p, i: number): IEdge => {
      const q = points[(i + 1) % points.length]!;
      return { p, q, x0: Math.min(p[0], q[0]), x1: Math.max(p[0], q[0]), y0: Math.min(p[1], q[1]), y1: Math.max(p[1], q[1]) };
    });
  }

  /** Build an ordered AABB hierarchy by halving each contiguous run of polygon edges. */
  function edgeTree(edges: readonly IEdge[]): EdgeTree | null {
    const split = (a: number, b: number): EdgeTree => {
      if (b === a + 1) return edges[a]!;
      const m: number = a + Math.floor((b - a) / 2);
      const left: EdgeTree = split(a, m), right: EdgeTree = split(m, b);
      return { left, right, x0: Math.min(left.x0, right.x0), x1: Math.max(left.x1, right.x1), y0: Math.min(left.y0, right.y0), y1: Math.max(left.y1, right.y1) };
    };
    return edges.length === 0 ? null : split(0, edges.length);
  }

  /** Find the proper crossings in the original pair traversal order, visiting only potentially intersecting bounds. */
  function intersections(edges: readonly IEdge[], tree: EdgeTree | null): P[] {
    if (tree === null) return [];
    const found: P[] = [];
    const side = (p: readonly [number, number], q: readonly [number, number], r: readonly [number, number]): number =>
      Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    const visit = (a: IEdge, b: EdgeTree): void => {
      if (a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0) return;
      if ("left" in b) {
        visit(a, b.left);
        visit(a, b.right);
        return;
      }
      const { p, q } = a, { p: r, q: s } = b;
      if (!(side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0)) return;
      const den: number = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
      const t: number = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / den;
      found.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    };
    for (const edge of edges) visit(edge, tree);
    return found;
  }

  /** A composed end's seams on the host's end ring, as the split derives them. */
  export interface ISeams {
    /** Each seam's host phases `[a, b]`, radians, moved by whole turns as the split moves them. */
    seams: [number, number][];
    /**
     * Each seam after the first: its three nesting margins, radians, each positive when it nests: `b_j - b_(j-1)` and `a_(j-1) - a_j`,
     * each wrapped into (-pi, pi], and the turn less the seam's arc `b_j - a_j`.
     */
    margins: [number, number, number][];
    /** Whether every seam encloses the one before, the split's own verdict. */
    nested: boolean;
    /** Why no seams stand: a neighbour pair that does not cross twice, or a seam plane that does not cross the ring twice. */
    refusal: string | null;
    /** Each seam's plane: a point (its first fork) and its unit normal toward the upper cut. */
    planes: { point: V; normal: V }[];
  }

  /**
   * Each child's wedge depth by phase, the split's boundary and rail cut (`AutoMovieConstructionSplitCompose.derive`, its `wedge`): along
   * each phase's line through the child's stations, the largest over the stations of the smallest signed distance to the end plane
   * and the child's seam planes (each turned toward the child), all moved along the child's axis by `shift`. A phase whose depth is not
   * positive is one the skin never enters, the skin cut's refusal "never enters the cut inside its domain".
   *
   * @param lines The child's points by phase, then station.
   * @param planes The end plane and the child's seam planes, each with its normal into the child's side.
   * @param shift The planes' move along the child's axis, mm (the rail), as a vector.
   */
  export function wedge(lines: readonly (readonly V[])[], planes: readonly { point: V; normal: V }[], shift: V): number[] {
    const land = planes.map(({ point, normal }) => ({ point: add(point, shift), normal }));
    return lines.map((line: readonly V[]): number => {
      let deepest: number = -Infinity;
      for (const p of line) {
        let depth: number = Infinity;
        for (const { point, normal } of land)
          depth = Math.min(depth, normal[0] * (p[0] - point[0]) + normal[1] * (p[1] - point[1]) + normal[2] * (p[2] - point[2]));
        deepest = Math.max(deepest, depth);
      }
      return deepest;
    });
  }

  /**
   * Whether one cut's points lie inside another in two runs, as a continuous row: two inside runs exist exactly when two depth maxima
   * are both positive and both arcs between them dip below zero, so the row is `min(M2, -m)`, `M2` the smaller of the two maxima and
   * `m` the shallower of the two arcs' minima, the largest over all pairs of maxima. At most zero, the cuts cross twice, not four times;
   * a second run appears with the row passing zero. The active point is the one whose depth sets the row, with `sign` the row's sign on
   * that depth (+1 at a maximum, -1 at a minimum).
   *
   * @param points The cut whose points are read.
   * @param polygon The closed polygon they are read in.
   */
  export function secondRun(points: readonly (readonly [number, number])[], polygon: readonly (readonly [number, number])[]): { value: number; at: IDepth; sign: 1 | -1 } {
    const rows: IDepth[] = points.map((p, k: number): IDepth => {
      const near = nearest(p, polygon), within = inside(p, polygon);
      const sign: number = within ? -1 : 1;
      return { depth: within ? near.distance : -near.distance, k, segment: near.segment, t: near.t,
        u: near.distance > 0 ? [(p[0] - near.at[0]) / near.distance * sign, (p[1] - near.at[1]) / near.distance * sign] : [0, 0] };
    });
    const n: number = rows.length;
    const maxima: number[] = rows.flatMap((r, k: number): number[] => (r.depth >= rows[(k + n - 1) % n]!.depth && r.depth > rows[(k + 1) % n]!.depth ? [k] : []));
    const least = (from: number, to: number): IDepth => {
      let best: IDepth = rows[(from + 1) % n]!;
      for (let k = (from + 1) % n; k !== to; k = (k + 1) % n) if (rows[k]!.depth < best.depth) best = rows[k]!;
      return best;
    };
    let result: { value: number; at: IDepth; sign: 1 | -1 } = { value: -Infinity, at: rows[0]!, sign: 1 };
    for (let i = 0; i < maxima.length; ++i) for (let j = i + 1; j < maxima.length; ++j) {
      const [a, b] = [maxima[i]!, maxima[j]!];
      const low = rows[a]!.depth <= rows[b]!.depth ? rows[a]! : rows[b]!;
      const one = least(a, b), two = least(b, a), shallow = one.depth >= two.depth ? one : two;
      const value: number = Math.min(low.depth, -shallow.depth);
      if (value > result.value) result = low.depth <= -shallow.depth ? { value, at: low, sign: 1 } : { value, at: shallow, sign: -1 };
    }
    if (result.value === -Infinity) {
      // One maximum: no second run can stand; the row is how far the deepest point is from making one, minus its depth's least.
      const deepest = rows.reduce((p, q): IDepth => (q.depth > p.depth ? q : p));
      return { value: -Math.abs(deepest.depth), at: deepest, sign: deepest.depth >= 0 ? -1 : 1 };
    }
    return result;
  }

  /**
   * The seams a composed end derives (`AutoMovieConstructionSplitCompose.derive`, its host-ring crossings and their nesting), on the
   * junction's own cuts.
   *
   * Each neighbour pair's forks are where their cuts cross; ordered and oriented as the composition orders them
   * (`AutoMovieConstructionComposedEnd.create`): the first fork is the one on the left of the line from the lower cut's centre to the
   * upper's, and the seam plane holds the chord between the forks and the bisector of the two axes, its normal toward the upper cut.
   * The plane's crossings with the host's end ring, `a` where the ring passes to the lower side and `b` where it returns, are read
   * between the ring's points by linear interpolation of their signed distances, and moved by whole turns exactly as the split moves
   * them, so each seam's margins are the split's nesting test written as rows. With `turns`, each phase is instead moved to the whole
   * turn nearest that phase, so a moved reading keeps a base reading's turns and its margins change smoothly.
   *
   * @param input The end plane, the cuts in order, each cut's axis, and the host's end ring at evenly spaced phases from zero.
   * @param turns A base reading's seams whose turns a moved reading keeps.
   */
  export function seams(input: {
    plane: IPlane; cuts: readonly (readonly ([number, number] | null)[])[]; axes: readonly (V | null)[]; host: readonly V[];
  }, turns?: readonly [number, number][]): ISeams {
    return prepareSeams(input, turns).base;
  }

  /** A single member's cut and oriented axis, changed while its neighbours stand. */
  interface ISeamChange { index: number; cut: readonly (P | null)[]; axis: V | null }

  /** One pair's forks, seam plane and host crossings before any whole-turn adjustment. */
  interface ISeamPair {
    count: number;
    plane?: { point: V; normal: V };
    phases?: [number, number];
    refusal?: string;
  }

  /** Prepare a reading's cut polygons, forks and host crossings for partial seam evaluation. */
  export function prepareSeams(input: {
    plane: IPlane; cuts: readonly (readonly (P | null)[])[]; axes: readonly (V | null)[]; host: readonly V[];
  }, turns?: readonly [number, number][]) {
    const { plane, host } = input;
    const turn: number = 2 * Math.PI;
    const world = (p: readonly [number, number]): V => add(plane.origin, add(scale(plane.x, p[0]), scale(plane.y, p[1])));
    const unit = (v: V): V | null => { const l = Math.hypot(...v); return l > 0 ? scale(v, 1 / l) : null; };
    const member = (cut: readonly (P | null)[], axis: V | null) => {
      const polygon: P[] = cut.filter((p): p is P => p !== null);
      const segments: IEdge[] = edges(polygon);
      return { axis, edges: segments, tree: edgeTree(segments), centre: world([
        polygon.reduce((sum, p): number => sum + p[0], 0) / polygon.length,
        polygon.reduce((sum, p): number => sum + p[1], 0) / polygon.length,
      ]) };
    };
    const pair = (a: ReturnType<typeof member>, b: ReturnType<typeof member>, j: number): ISeamPair => {
      const met: P[] = intersections(a.edges, b.tree);
      const count: number = met.length;
      if (count !== 2) return { count, refusal: `cuts ${j} and ${j + 1} cross ${count} times in the end plane, not twice` };
      const across: V = sub(b.centre, a.centre);
      const side = (f: V): number => dot(cross(across, sub(f, a.centre)), plane.z);
      const [f0, f1] = met.map(world) as [V, V];
      const [first, second] = side(f0) >= side(f1) ? [f0, f1] : [f1, f0];
      const chord = unit(sub(second, first));
      const heading = a.axis === null || b.axis === null ? null : unit(add(a.axis, b.axis));
      if (chord === null || heading === null) return { count, refusal: `seam ${j} has no chord or no bisector` };
      const square = unit(sub(heading, scale(chord, dot(heading, chord))));
      if (square === null) return { count, refusal: `seam ${j}'s bisector runs along its chord` };
      const raw: V = cross(chord, square), toward: number = dot(raw, across);
      if (toward === 0) return { count, refusal: `seam ${j}'s plane holds the line through the centres` };
      const normal: V = scale(raw, Math.sign(toward));
      return { count, plane: { point: first, normal } };
    };
    const land = (result: ISeamPair, j: number, ring: readonly V[]): ISeamPair => {
      const cut = result.plane;
      if (cut === undefined) return result;
      const { point, normal } = cut;
      const m: number = ring.length;
      const values: number[] = ring.map((p: V): number => dot(normal, sub(p, point)));
      const falls: number[] = [], rises: number[] = [];
      for (let k = 0; k < m; ++k) {
        const [here, next] = [values[k]!, values[(k + 1) % m]!];
        if (here > 0 === next > 0) continue;
        (here > 0 ? falls : rises).push((turn * (k + here / (here - next))) / m);
      }
      if (falls.length !== 1 || rises.length !== 1)
        return { ...result, refusal: `seam ${j}'s plane crosses the host's end ring ${falls.length + rises.length} times, not twice` };
      return { ...result, phases: [falls[0]!, rises[0]!] };
    };
    const combine = (pairs: readonly ISeamPair[], near?: readonly [number, number][]): ISeams => {
      const out: [number, number][] = [];
      const planes: { point: V; normal: V }[] = [];
      for (const [j, row] of pairs.entries()) {
        if (row.plane !== undefined) planes.push(row.plane);
        if (row.phases === undefined) return { seams: out, margins: [], nested: false, refusal: row.refusal!, planes };
        let [a, b] = row.phases;
        if (near !== undefined) {
          a += turn * Math.round((near[j]![0] - a) / turn);
          b += turn * Math.round((near[j]![1] - b) / turn);
        } else {
          // The split's own moves (`AutoMovieConstructionSplitCompose.derive`).
          if (j > 0) {
            const before = out[j - 1]!;
            a -= turn * Math.ceil((a - before[0]) / turn);
            if (a === before[0]) a -= turn;
          } else if (a > Math.PI) a -= turn;
          b += turn * Math.ceil((a - b) / turn);
          if (b === a) b += turn;
        }
        out.push([a, b]);
      }
      // The split moves falls by whole turns. Principal differences keep the margins continuous across the turn boundary.
      const wrap = (x: number): number => x - turn * Math.round(x / turn);
      const margins: [number, number, number][] = out.slice(1).map(([a, b], i): [number, number, number] =>
        [wrap(b - out[i]![1]), wrap(out[i]![0] - a), turn - (b - a)]);
      return { seams: out, margins, nested: margins.every((row) => row.every((x) => x > 0)), refusal: null, planes };
    };
    const members = input.cuts.map((cut, i: number) => member(cut, input.axes[i] ?? null));
    const planes: ISeamPair[] = members.slice(1).map((b, j: number): ISeamPair => pair(members[j]!, b, j));
    const pairs: ISeamPair[] = planes.map((row: ISeamPair, j: number): ISeamPair => land(row, j, host));
    const base: ISeams = combine(pairs, turns);
    return {
      base,
      crossings: pairs.map(({ count }): number => count),
      moved: (changes: readonly ISeamChange[], ring: readonly V[] = host): ISeams => {
        const affected = members.map((): boolean => false);
        const moved = [...members];
        for (const { index, cut, axis } of changes) {
          moved[index] = member(cut, axis);
          affected[index] = true;
        }
        const next: ISeamPair[] = pairs.map((row, j: number): ISeamPair => {
          if (affected[j] || affected[j + 1]) return land(pair(moved[j]!, moved[j + 1]!, j), j, ring);
          return ring === host ? row : land(planes[j]!, j, ring);
        });
        return combine(next, base.refusal === null ? base.seams : turns);
      },
    };
  }
}
