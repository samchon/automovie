import { AutoMovieViewChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { AutoMovieVector3Tuple, IAutoMovieHumanConicLoft, IAutoMovieViewAxis, IAutoMovieViewChain } from "@automovie/interface";

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

  /** The engine sections of a family by station: one preparation per family, then one section per call. */
  export interface ISections {
    /** Prepare `family` once (its fields' reader); the returned function gives its engine section at a station, mm. */
    prepare: (family: IAutoMovieHumanConicLoft.IFamily) => (station: number) => IAutoMovieViewChain.ISection;
  }

  /**
   * The provider every reading uses by default: a family prepared into its fields' reader, whose closure resolves and chains the fields
   * at each station it is asked. It keeps no results: each call builds its section, and `count` counts them.
   */
  export function sections(): ISections & { count: number } {
    const made = {
      count: 0,
      prepare: (family: IAutoMovieHumanConicLoft.IFamily): ((station: number) => IAutoMovieViewChain.ISection) => {
        const read = AutoMovieHumanConicLoft.reader(family);
        return (station: number): IAutoMovieViewChain.ISection => {
          ++made.count;
          return AutoMovieHumanConicSection.chain(read(station), family.layout);
        };
      },
    };
    return made;
  }

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
    // Prepared once per reading of this member: its course and its section function, then its distinct stations in order, each
    // section and frame built once by the preparation and held by the closures below (no lookup table: a station's index is its place
    // in the prepared list).
    const axis: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(member.family);
    const sectionAt = provider.prepare(member.family);
    const distinct: number[] = [...new Set([...member.rings, ...member.lines, ...member.bracket, ...(member.wedge ?? [])])].sort((a, b) => a - b);
    const prepared = distinct.map((s: number) => {
      const frame = axis.at(s);
      return { s, section: sectionAt(s), origin: [...frame.origin] as V, u: [...frame.u] as V, v: [...frame.v] as V };
    });
    const at = (s: number) => {
      let lo = 0, hi = prepared.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (prepared[mid]!.s < s) lo = mid + 1; else hi = mid; }
      const found = prepared[lo];
      if (found === undefined || found.s !== s) throw new Error(member.face + ": the station " + s + " mm was not prepared");
      return found;
    };
    const point = (s: number, phi: number): V => {
      const q = at(s), r = AutoMovieViewChain.read(q.section, phi);
      if (r === null) throw new Error(member.face + ": the section at " + s + " mm has no point at phase " + phi);
      return add(q.origin, add(scale(q.u, r.point[0]), scale(q.v, r.point[1])));
    };
    const rings: V[][] = member.rings.map((s: number): V[] => member.phases.map((phi: number): V => point(s, phi)));
    const lines: V[][] = member.guides.map((phi: number): V[] => member.lines.map((s: number): V => point(s, phi)));
    const normals: V[] = member.rings.map((s: number): V => { const q = at(s); return cross(q.u, q.v); });
    let along: V = [0, 0, 0];
    const crossing: (number | null)[] = [];
    const tangent = (first: V): void => {
      const l = Math.hypot(...first);
      if (l > 0) along = add(along, scale(first, 1 / l));
      crossing.push(l > 0 ? dot(first, plane.z) / l : 0);
    };
    const cut: ([number, number] | null)[] = member.bracket.length < 2 ? [] : member.cut.map((phi: number): [number, number] | null => {
      // The line of this phase through the bracketing stations, its height over the plane, and the crossing between the stations whose
      // heights change sign, on the natural cubic through the line's points (the loft's own interpolation along the station).
      const points: V[] = member.bracket.map((s: number): V => point(s, phi));
      const heights: number[] = points.map((p: V): number => dot(sub(p, plane.origin), plane.z));
      const curve = cubic(member.bracket, points);
      for (let i = 0; i + 1 < points.length; ++i) {
        const [h0, h1] = [heights[i]!, heights[i + 1]!];
        if (h0 === 0) { tangent(curve(member.bracket[i]!).first); return inPlane(points[i]!, plane); }
        if (h0 * h1 > 0) continue;
        const x = (k: number) => member.bracket[k]!;
        let [a, b] = [x(i), x(i + 1)];
        let [ha, hb] = [h0, h1];
        for (let n = 0; n < 60 && b - a > 1e-12 * Math.max(1, Math.abs(b)); ++n) {
          const m = ha === hb ? (a + b) / 2 : Math.min(b, Math.max(a, a + (b - a) * ha / (ha - hb)));
          const mid = m === a || m === b ? (a + b) / 2 : m;
          const hm = dot(sub(curve(mid).at, plane.origin), plane.z);
          if (hm === 0) { a = mid; b = mid; break; }
          if (hm * ha < 0) { b = mid; hb = hm; } else { a = mid; ha = hm; }
        }
        const met = curve((a + b) / 2);
        tangent(met.first);
        return inPlane(met.at, plane);
      }
      crossing.push(null);
      return null;
    });
    const length: number = Math.hypot(...along);
    const wedgeStations: readonly number[] = member.wedge ?? [];
    const wedgeLines: V[][] = wedgeStations.length === 0 ? [] : member.cut.map((phi: number): V[] => wedgeStations.map((s: number): V => point(s, phi)));
    return { face: member.face, rings, lines, cut, normals, axis: cut.length > 0 && length > 0 ? scale(along, 1 / length) : null, crossing, wedgeLines };
  }

  /** A world point's coordinates in the plane. */
  function inPlane(p: V, plane: IPlane): [number, number] {
    const q = sub(p, plane.origin);
    return [dot(q, plane.x), dot(q, plane.y)];
  }

  /** The natural cubic through points at stations, componentwise: its point and its first derivative along the station. */
  function cubic(stations: readonly number[], points: readonly V[]): (s: number) => { at: V; first: V } {
    const n: number = stations.length;
    if (n === 2) return (s: number): { at: V; first: V } => {
      const w = stations[1]! - stations[0]!, t = (s - stations[0]!) / w;
      return { at: add(points[0]!, scale(sub(points[1]!, points[0]!), t)), first: scale(sub(points[1]!, points[0]!), 1 / w) };
    };
    // Second derivatives of the natural cubic by the tridiagonal recurrence, per component.
    const moments: V[] = Array.from({ length: n }, (): V => [0, 0, 0]);
    const h: number[] = stations.slice(1).map((s: number, i: number): number => s - stations[i]!);
    const c: number[] = new Array<number>(n).fill(0), d: V[] = Array.from({ length: n }, (): V => [0, 0, 0]);
    for (let i = 1; i < n - 1; ++i) {
      const diag = 2 * (h[i - 1]! + h[i]!) - h[i - 1]! * c[i - 1]!;
      const rhs: V = sub(scale(sub(points[i + 1]!, points[i]!), 6 / h[i]!), scale(sub(points[i]!, points[i - 1]!), 6 / h[i - 1]!));
      c[i] = h[i]! / diag;
      d[i] = scale(sub(rhs, scale(d[i - 1]!, h[i - 1]!)), 1 / diag);
    }
    for (let i = n - 2; i >= 1; --i) moments[i] = sub(d[i]!, scale(moments[i + 1]!, c[i]!));
    return (s: number): { at: V; first: V } => {
      let i = 0;
      while (i < n - 2 && s > stations[i + 1]!) ++i;
      const [a, b] = [stations[i]!, stations[i + 1]!], w = b - a;
      const [A, B] = [(b - s) / w, (s - a) / w];
      // With dA/ds = -1/w and dB/ds = 1/w, the moment terms (A^3 - A) w^2 / 6 and (B^3 - B) w^2 / 6 change by -(3 A^2 - 1) w / 6 and
      // (3 B^2 - 1) w / 6.
      return {
        at: add(add(scale(points[i]!, A), scale(points[i + 1]!, B)),
          add(scale(moments[i]!, ((A * A * A - A) * w * w) / 6), scale(moments[i + 1]!, ((B * B * B - B) * w * w) / 6))),
        first: add(scale(sub(points[i + 1]!, points[i]!), 1 / w),
          add(scale(moments[i]!, (-(3 * A * A - 1) * w) / 6), scale(moments[i + 1]!, ((3 * B * B - 1) * w) / 6))),
      };
    };
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
    let count = 0;
    const side = (p: readonly [number, number], q: readonly [number, number], r: readonly [number, number]): number =>
      Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    for (let i = 0; i < a.length; ++i) {
      const [p, q] = [a[i]!, a[(i + 1) % a.length]!];
      for (let j = 0; j < b.length; ++j) {
        const [r, s] = [b[j]!, b[(j + 1) % b.length]!];
        if (side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0) ++count;
      }
    }
    return count;
  }

  /** Where two closed polygons' boundaries cross, by the same proper-crossing test as `crossings`, each at its segments' meeting. */
  export function forks(a: readonly (readonly [number, number])[], b: readonly (readonly [number, number])[]): [number, number][] {
    const found: [number, number][] = [];
    const side = (p: readonly [number, number], q: readonly [number, number], r: readonly [number, number]): number =>
      Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
    for (let i = 0; i < a.length; ++i) {
      const [p, q] = [a[i]!, a[(i + 1) % a.length]!];
      for (let j = 0; j < b.length; ++j) {
        const [r, s] = [b[j]!, b[(j + 1) % b.length]!];
        if (!(side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0)) continue;
        const den = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
        const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / den;
        found.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
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
    return lines.map((line: readonly V[]): number => Math.max(...line.map((p: V): number =>
      Math.min(...planes.map(({ point, normal }): number => dot(normal, sub(p, add(point, shift))))))));
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
    const { plane, host } = input;
    const turn: number = 2 * Math.PI, m: number = host.length;
    const world = (p: readonly [number, number]): V => add(plane.origin, add(scale(plane.x, p[0]), scale(plane.y, p[1])));
    const unit = (v: V): V | null => { const l = Math.hypot(...v); return l > 0 ? scale(v, 1 / l) : null; };
    const polygons = input.cuts.map((cut) => cut.filter((p): p is [number, number] => p !== null));
    const centres: V[] = polygons.map((q): V => world([q.reduce((s, p) => s + p[0], 0) / q.length, q.reduce((s, p) => s + p[1], 0) / q.length]));
    const out: [number, number][] = [];
    const planes: { point: V; normal: V }[] = [];
    const refuse = (refusal: string): ISeams => ({ seams: out, margins: [], nested: false, refusal, planes });
    for (let j = 0; j + 1 < polygons.length; ++j) {
      const met = forks(polygons[j]!, polygons[j + 1]!);
      if (met.length !== 2) return refuse(`cuts ${j} and ${j + 1} cross ${met.length} times in the end plane, not twice`);
      const across: V = sub(centres[j + 1]!, centres[j]!);
      const side = (f: V): number => dot(cross(across, sub(f, centres[j]!)), plane.z);
      const [f0, f1] = met.map(world) as [V, V];
      const [first, second] = side(f0) >= side(f1) ? [f0, f1] : [f1, f0];
      const chord = unit(sub(second, first));
      const [lower, upper] = [input.axes[j], input.axes[j + 1]];
      const heading = lower === null || upper === null || lower === undefined || upper === undefined ? null : unit(add(lower, upper));
      if (chord === null || heading === null) return refuse(`seam ${j} has no chord or no bisector`);
      const square = unit(sub(heading, scale(chord, dot(heading, chord))));
      if (square === null) return refuse(`seam ${j}'s bisector runs along its chord`);
      const raw: V = cross(chord, square), toward: number = dot(raw, across);
      if (toward === 0) return refuse(`seam ${j}'s plane holds the line through the centres`);
      const normal: V = scale(raw, Math.sign(toward));
      planes.push({ point: first, normal });
      const values: number[] = host.map((p: V): number => dot(normal, sub(p, first)));
      const falls: number[] = [], rises: number[] = [];
      for (let k = 0; k < m; ++k) {
        const [here, next] = [values[k]!, values[(k + 1) % m]!];
        if (here > 0 === next > 0) continue;
        (here > 0 ? falls : rises).push((turn * (k + here / (here - next))) / m);
      }
      if (falls.length !== 1 || rises.length !== 1)
        return refuse(`seam ${j}'s plane crosses the host's end ring ${falls.length + rises.length} times, not twice`);
      let a: number = falls[0]!, b: number = rises[0]!;
      if (turns !== undefined) {
        a += turn * Math.round((turns[j]![0] - a) / turn);
        b += turn * Math.round((turns[j]![1] - b) / turn);
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
    // The margins from the principal differences, each in (-pi, pi]: the split moves `a_j` below `a_(j-1)` by whole turns, so a seam whose
    // fall stands just past the one before lands a turn lower and its `b_j - b_(j-1)` jumps by a turn (the leg's trials of 2026-11-24 read
    // 172.67 mm of ring for 0.4 rad). With the differences wrapped the rows are continuous, and they hold exactly when the split's test
    // does: `a_j` within a turn below `a_(j-1)` with `b_j` past `b_(j-1)` is `wrap(a_(j-1) - a_j) > 0` and `wrap(b_j - b_(j-1)) > 0`, and
    // `b_j < a_j + turn` is the seam's arc `b_j - a_j`, in (0, turn], short of the turn.
    const wrap = (x: number): number => x - turn * Math.round(x / turn);
    const margins: [number, number, number][] = out.slice(1).map(([a, b], i): [number, number, number] =>
      [wrap(b - out[i]![1]), wrap(out[i]![0] - a), turn - (b - a)]);
    return { seams: out, margins, nested: margins.every((row) => row.every((x) => x > 0)), refusal: null, planes };
  }
}
