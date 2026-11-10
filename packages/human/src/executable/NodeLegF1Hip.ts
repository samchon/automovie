import { AutoMovieMeshCourse, AutoMovieMeshExtract, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec as Geometry } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { NodeLegF1Archive } from "./NodeLegF1Archive";
import { NodeLegF1Foot } from "./NodeLegF1Foot";
import type { NodeLegF1Loft } from "./NodeLegF1Loft";
import { NodeLegF1Rings } from "./NodeLegF1Rings";

type V3 = NodeLegF1Archive.V3;
type Frame = NodeLegF1Archive.Frame;
type Face = [number, number, number];
type Skin = { points: V3[]; faces: Face[] };
type Edge = { a: number; b: number; uses: number; balance: number };
type Section = { frame: Frame; points: V3[] };
type Reading = { key: string; point: V3; t: number };
type Arc = "posterior" | "medial" | "lateral";

/**
 * Native F1 proximal skin and the measured collar to the surveyed fork.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the native fork-to-thigh attachment with the leg provider.
 */
export namespace NodeLegF1Hip {
  const { mix, place, scale, sub }: typeof NodeLegF1Archive = NodeLegF1Archive;
  const tolerance: number = AutoMovieHumanF1Trace.TOLERANCE;

  /**
   * Append the original skin between two strict native cuts.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the native triangle sheet and binds its actual clipped rims by index.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses changed source contours or ambiguous winding before touching the destination.
   */
  export function append(
    mesh: AutoMovieMeshExtract.IMesh,
    fork: NodeLegF1Loft.ILegFork,
    start: Section,
    end: Section,
    positions: number[],
    indices: number[],
    diagnostics: string[],
  ): { upper: number[]; lower: number[]; triangles: number } | null {
    const refuse = (reason: string): null => {
      diagnostics.push("Native proximal skin refused: " + reason + ".");
      return null;
    };
    const skin = nativeSkin(mesh, fork, start, end);
    if (skin === null) return refuse("the reference did not yield one connected slab");
    const edges = [...incidence(skin.faces).values()];
    if (edges.some(({ uses, balance }): boolean => uses !== 1 && (uses !== 2 || balance !== 0))) return refuse("the source sheet is not consistently oriented");
    if (skin.faces.some(([a, b, c]): boolean => Math.hypot(...Geometry.cross(sub(skin.points[b]!, skin.points[a]!), sub(skin.points[c]!, skin.points[a]!))) === 0))
      return refuse("the source sheet has a zero-area face");
    const free = edges.filter(({ uses }): boolean => uses === 1);
    const on = (edge: Edge, frame: Frame): boolean => {
      const normal = AutoMovieViewAxis.normal(frame) as V3;
      return [edge.a, edge.b].every((id): boolean => Math.abs(Geometry.dot(sub(skin.points[id]!, frame.origin as V3), normal)) < 1e-6);
    };
    const upperEdges = free.filter((edge): boolean => on(edge, start.frame));
    const lowerEdges = free.filter((edge): boolean => on(edge, end.frame));
    if (upperEdges.length + lowerEdges.length !== free.length) return refuse("the source sheet contains an unrelated boundary");
    const upper = ordered(upperEdges), lower = ordered(lowerEdges);
    if (upper === null || lower === null || !close(upper, start.points, skin.points) || !close(lower, end.points, skin.points))
      return refuse("the source rims do not match the measured thigh cuts");
    const reversed = chartArea(upper, start.frame, skin.points) > 0;
    const entry = reversed ? upper : [...upper].reverse();
    const exit = reversed ? [...lower].reverse() : lower;
    if (chartArea(entry, start.frame, skin.points) <= 0 || chartArea(exit, end.frame, skin.points) <= 0)
      return refuse("the two native rims do not carry opposite seam directions");
    const local = new Map<number, number>();
    const transfer = (id: number): number => {
      const existing = local.get(id);
      if (existing !== undefined) return existing;
      const index = positions.length / 3;
      positions.push(...skin.points[id]!);
      local.set(id, index);
      return index;
    };
    for (const [a, b, c] of skin.faces)
      for (const id of reversed ? [a, c, b] : [a, b, c]) indices.push(transfer(id));
    const row = (rim: number[], frame: Frame): number[] => {
      const u = frame.u as V3;
      const first = rim.reduce((best, id, i): number => Geometry.dot(skin.points[id]!, u) > Geometry.dot(skin.points[rim[best]!]!, u) ? i : best, 0);
      return [...rim.slice(first), ...rim.slice(0, first)].map(transfer);
    };
    return { upper: row(entry, start.frame), lower: row(exit, end.frame), triangles: skin.faces.length };
  }

  /**
   * Loft the exact fork to the first inboard rim along its original posterior sections.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Samples one connected raw contour per physical plane and reuses both exact rims.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the surveyed medial boundary and refuses disjoint curve correspondence.
   */
  export function collar(
    boundary: number[],
    next: number[],
    section: Section,
    fork: NodeLegF1Loft.ILegFork,
    mesh: AutoMovieMeshExtract.IMesh,
    positions: number[],
    indices: number[],
    appendPoints: (points: V3[]) => number[],
    native: boolean,
  ): V3[][] {
    const strip: number[] = [];
    NodeLegF1Rings.stitchRows(boundary, next, positions, strip, "length");
    // The tilted parent admits a 0.5 mm inset on its posterior arc. This is
    // a curve observation only: clipping the entire skin there would cut
    // the already measured anterior ring. Keep the independent midpoint
    // and add whole original arcs only when their physical order agrees.
    const middle = posteriorRail(strip, section, fork, mesh, positions, 0.5);
    const admitted: Reading[][] = middle === null ? [] : [middle];
    if (native) for (const [fraction, inset, arc] of [
      [0, tolerance, "posterior"], [1 / 3, 0, "posterior"], [2 / 3, 0, "posterior"],
      [2 / 3, 0, "medial"], [0.5, 0, "lateral"],
    ] as const) {
      const candidate = posteriorRail(strip, section, fork, mesh, positions, fraction, inset, arc);
      if (candidate !== null && admitted.every((arc): boolean => separateArcs(arc, candidate))) admitted.push(candidate);
    }
    const rails: V3[][] = [];
    const samples = admitted.map((arc) => {
      const rail = arc.map(({ point }): V3 => point);
      rails.push(rail);
      return new Map(appendPoints(rail).map((id, i) => [arc[i]!.key, { id, t: admitted.length === 1 ? 0.5 : arc[i]!.t }] as const));
    });
    const upper = new Set(boundary);
    const path = (from: number, to: number): { id: number; t: number }[] => {
      const k = key(from, to);
      const inside = samples.flatMap((sample): { id: number; t: number }[] => {
        const point = sample.get(k);
        return point === undefined ? [] : [{ id: point.id, t: upper.has(from) ? point.t : 1 - point.t }];
      }).sort((a, b): number => a.t - b.t);
      return [{ id: from, t: 0 }, ...inside, { id: to, t: 1 }];
    };
    for (let i = 0; i < strip.length; i += 3) {
      const face = strip.slice(i, i + 3);
      const k = face.findIndex((id, j): boolean => upper.has(id) === upper.has(face[(j + 1) % 3]!));
      const a = face[k]!, b = face[(k + 1) % 3]!, c = face[(k + 2) % 3]!;
      const left = path(a, c), right = path(b, c);
      let l = 0, r = 0;
      while (l + 1 < left.length || r + 1 < right.length) {
        const first = left[l]!.id, second = right[r]!.id;
        const third = (left[l + 1]?.t ?? Infinity) < (right[r + 1]?.t ?? Infinity) ? left[++l]!.id : right[++r]!.id;
        if (first !== third && second !== third) indices.push(first, second, third);
      }
    }
    return rails;
  }

  /** Refuse rails that swap physical order across their common posterior interval. */
  function separateArcs(a: Reading[], b: Reading[]): boolean {
    const station = new Map(a.map(({ key, t }): [string, number] => [key, t]));
    const direction = new Set(b.flatMap(({ key, t }): number[] => {
      const other = station.get(key);
      return other === undefined ? [] : [Math.sign(t - other)];
    }));
    return direction.size <= 1 && !direction.has(0);
  }

  /** Cut the one actual source sheet between the two holding leg contours. */
  function nativeSkin(mesh: AutoMovieMeshExtract.IMesh, fork: NodeLegF1Loft.ILegFork, start: Section, end: Section): Skin | null {
    const support = [...start.points, ...end.points];
    const margin = Math.hypot(...sub(start.frame.origin as V3, end.frame.origin as V3));
    const minima = support[0]!.map((_, i): number => Math.min(...support.map((p): number => p[i]!)) - margin);
    const maxima = support[0]!.map((_, i): number => Math.max(...support.map((p): number => p[i]!)) + margin);
    const skin: Skin = { points: [], faces: [] };
    const welded = new Map<string, number>();
    const add = (point: V3): number => {
      const name = point.join(","), existing = welded.get(name);
      if (existing !== undefined) return existing;
      const index = skin.points.length;
      skin.points.push(point);
      welded.set(name, index);
      return index;
    };
    for (let i = 0; i < mesh.indices.length; i += 3) {
      const points = [0, 1, 2].map((k): V3 => read(mesh.positions, mesh.indices[i + k]!));
      if (minima.some((low, k): boolean => points.every((p): boolean => p[k]! < low) || points.every((p): boolean => p[k]! > maxima[k]!))) continue;
      const face = points.map(add) as Face;
      if (new Set(face).size === 3) skin.faces.push(face);
    }
    skin.faces = NodeLegF1Foot.splitSkin(skin, start.frame).positive;
    skin.faces = NodeLegF1Foot.splitSkin(skin, end.frame).negative;
    const median: Frame = { origin: [0, 0, fork.midline], u: [1, 0, 0], v: [0, -fork.direction, 0] };
    skin.faces = NodeLegF1Foot.splitSkin(skin, median).positive;
    return NodeLegF1Foot.skinComponents(skin.faces).length === 1 ? skin : null;
  }

  /** Match a connected original arc at the same physical phase on a measured cut. */
  function posteriorRail(
    strip: number[],
    section: Section,
    fork: NodeLegF1Loft.ILegFork,
    mesh: AutoMovieMeshExtract.IMesh,
    positions: number[],
    fraction: number,
    inset: number = 0,
    branch: Arc = "posterior",
  ): Reading[] | null {
    const center = AutoMovieMeshCourse.centroid(section.points);
    if (center === null) return null;
    const lower = scale(AutoMovieViewAxis.normal(section.frame) as V3, -1);
    const mixed = mix(fork.parent.normal, lower, fraction);
    const normal = Geometry.unit(mixed);
    const level = (1 - fraction) * Geometry.dot(fork.parent.centroid, fork.parent.normal) + fraction * Geometry.dot(center, lower);
    const seed = mix(fork.parent.centroid, center, fraction);
    const shift = (level - Geometry.dot(seed, mixed)) / Math.hypot(...mixed);
    const origin: V3 = [seed[0] + (shift - inset) * normal[0], seed[1] + (shift - inset) * normal[1], seed[2] + (shift - inset) * normal[2]];
    const u = Geometry.unit(sub([0, 0, 1], scale(normal, normal[2])));
    const v = Geometry.cross(u, normal);
    const cut = AutoMovieMeshExtract.outline(mesh, { origin, axes: [normal, u, v] }, [0], 0, tolerance, 0)[0]!;
    const side = (p: V3): number => fork.direction * (p[2] - fork.midline);
    const phase = (p: V3): number => branch === "lateral" ? p[0] : side(p);
    const exterior = (p: V3): boolean => branch === "lateral"
      ? side(p) > side(center) && p[0] >= center[0]
      : side(p) > 0 && p[0] < (branch === "medial" ? fork.half.centroid[0] : center[0]);
    const arcs: V3[][] = [];
    for (const loop of cut.loops) {
      const points = loop.points.map((p): V3 => place({ origin, u, v }, p));
      const outside = points.findIndex((p): boolean => !exterior(p));
      const ordered = loop.closed && outside >= 0 ? [...points.slice(outside + 1), ...points.slice(0, outside + 1)] : points;
      let arc: V3[] = [];
      for (const p of ordered) {
        if (exterior(p) && Geometry.dot(sub(p, fork.parent.centroid), fork.parent.normal) < 0 && Geometry.dot(sub(p, center), lower) > 0) arc.push(p);
        else {
          if (arc.length > 1) arcs.push(arc);
          arc = [];
        }
      }
      if (arc.length > 1) arcs.push(arc);
    }
    // The measured medial mismatch ends at 30 mm from the sagittal plane.
    // Choose the posterior source arc that spans this band, including its healthy end.
    const medialEnd = 30;
    const sources = branch === "medial" ? arcs.filter((arc): boolean =>
      arc.some((p): boolean => side(p) <= 20) && arc.some((p): boolean => side(p) >= medialEnd)) : arcs;
    if (sources.length !== 1) return null;
    let source = sources[0]!;
    if (phase(source[0]!) > phase(source[source.length - 1]!)) source.reverse();
    if (branch === "lateral") {
      // X is the phase of the lateral arc while the source tangent advances
      // farther in X than in Z. At the turn into the front, this chart ends.
      const turn = source.findIndex((p, i): boolean =>
        i > 0 && p[0] - source[i - 1]![0] <= Math.abs(p[2] - source[i - 1]![2]));
      if (turn > 0) source = source.slice(0, turn);
    }
    if (source.some((p, i): boolean => i > 0 && phase(p) <= phase(source[i - 1]!))) return null;
    const readings = Array.from({ length: strip.length / 3 }, (_, i): Reading | null => {
      const first = strip[3 * i]!, second = strip[3 * i + 1]!;
      const a = read(positions, first), b = read(positions, second);
      const da = Geometry.dot(sub(a, origin), normal), db = Geometry.dot(sub(b, origin), normal);
      // A medial cross-edge may start on the survey, but every new reading
      // stays strictly on this leg. No surveyed vertex or edge is subdivided.
      const onSide = (p: V3): boolean => branch === "medial" ? side(p) >= 0 : side(p) > 0;
      if (!onSide(a) || !onSide(b) || da * db >= 0) return null;
      const t = da / (da - db), at = mix(a, b, t), value = phase(at);
      if (!exterior(at) || value < phase(source[0]!) || (branch === "medial" && value > medialEnd)) return null;
      const end = source.findIndex((p): boolean => phase(p) > value);
      if (end < 1) return null;
      const a0 = source[end - 1]!, a1 = source[end]!;
      return { key: key(first, second), point: mix(a0, a1, (value - phase(a0)) / (phase(a1) - phase(a0))), t };
    });
    const gap = readings.findIndex((sample): boolean => sample === null);
    if (gap < 0) return null;
    const ordered = [...readings.slice(gap + 1), ...readings.slice(0, gap + 1)];
    const first = ordered.findIndex((sample): boolean => sample !== null);
    if (first < 0) return null;
    const end = ordered.findIndex((sample, i): boolean => i > first && sample === null);
    if (end - first < 2 || ordered.slice(end).some((sample): boolean => sample !== null)) return null;
    const matched = ordered.slice(first, end).map((sample): Reading => sample!);
    if (branch === "lateral") {
      const direction = Math.sign(phase(matched[matched.length - 1]!.point) - phase(matched[0]!.point));
      if (matched.some(({ point }, i): boolean =>
        i > 0 && direction * (phase(point) - phase(matched[i - 1]!.point)) <= 0)) return null;
    }
    return matched;
  }

  function close(rim: number[], reference: V3[], points: V3[]): boolean {
    const loop = rim.map((id): V3 => points[id]!);
    const near = (p: V3, ring: V3[]): boolean => ring.some((a, i): boolean => {
      const d = sub(ring[(i + 1) % ring.length]!, a), offset = sub(p, a);
      const square = Geometry.dot(d, d);
      const t = square === 0 ? 0 : Math.max(0, Math.min(1, Geometry.dot(offset, d) / square));
      return Math.hypot(...sub(offset, scale(d, t))) <= tolerance;
    });
    return loop.every((p): boolean => near(p, reference)) && reference.every((p): boolean => near(p, loop));
  }

  function chartArea(rim: number[], frame: Frame, points: V3[]): number {
    const chart = rim.map((id): [number, number] => [Geometry.dot(points[id]!, frame.u as V3), Geometry.dot(points[id]!, frame.v as V3)]);
    return chart.reduce((sum, [x, y], i): number => {
      const [u, v] = chart[(i + 1) % chart.length]!;
      return sum + x * v - y * u;
    }, 0);
  }

  function ordered(edges: Edge[]): number[] | null {
    const next = new Map(edges.map(({ a, b }): [number, number] => [a, b]));
    if (next.size < 3 || next.size !== edges.length || new Set(next.values()).size !== edges.length) return null;
    const first = edges[0]!.a;
    const ring = [first];
    for (let id = next.get(first); id !== first; id = next.get(id!)) {
      if (id === undefined || ring.length >= next.size) return null;
      ring.push(id);
    }
    return ring.length === edges.length ? ring : null;
  }

  function incidence(faces: Face[]): Map<string, Edge> {
    const edges = new Map<string, Edge>();
    for (const face of faces) for (let k = 0; k < 3; ++k) {
      const a = face[k]!, b = face[(k + 1) % 3]!, name = key(a, b);
      const edge = edges.get(name) ?? { a, b, uses: 0, balance: 0 };
      ++edge.uses;
      edge.balance += a < b ? 1 : -1;
      edges.set(name, edge);
    }
    return edges;
  }

  function read(values: ArrayLike<number>, i: number): V3 {
    return [values[3 * i]!, values[3 * i + 1]!, values[3 * i + 2]!];
  }

  function key(a: number, b: number): string {
    return a < b ? a + "," + b : b + "," + a;
  }
}
