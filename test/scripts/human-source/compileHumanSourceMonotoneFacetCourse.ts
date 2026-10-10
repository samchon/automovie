import { HumanExactFraction as F } from "@automovie/human/common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "@automovie/human/common/measure/IHumanExactFraction";
import type { IHumanFaceExactSkinSeat } from "@automovie/human/face/anatomy/skin/IHumanFaceExactSkinSeat";
import { identifyHumanFaceMaterialPoint } from "@automovie/human/face/basis/identifyHumanFaceMaterialPoint";
import { resolveHumanFaceApertureUp } from "@automovie/human/face/basis/resolveHumanFaceApertureUp";

import type { IHumanSourceLipMaterialCourseInput } from "./structures/IHumanSourceLipMaterialCourseInput.ts";

/** Persistent witnesses share prefixes across reachable critical ports. */
type CourseTrail = readonly [IHumanFaceExactSkinSeat, CourseTrail | null];

/**
 * Construct an ordered contact course inside the complete native component.
 * The source's represented vertex along/up readings define affine scalar
 * fields on its unchanged facets. Between consecutive vertex along levels,
 * a native edge either crosses the whole open slab or misses it. Connected
 * active facets therefore admit a strictly increasing polygonal corridor:
 * its edge crossings receive successive rational levels inside that slab.
 * Critical levels reconnect only identical native support, or a native
 * contour segment whose up reading is constant. A contour component is never
 * collapsed into one point. Original stops are visited in caller order.
 *
 * At an along-constant facet, up-fibers cross its native edges. Their incidence
 * changes at the critical contour's up values; the exact events and one
 * rational midpoint in every intervening open interval supply fiber ports.
 * Only equal-up ports reconnect through that facet. Refusal means this
 * construction is unsupported, not that no continuous path exists.
 * There is no shortest/geodesic claim. Canonical
 * binary64 interpolation and physical admission remain with the publisher;
 * exact affine scalar ordering alone does not certify those rounded reads.
 *
 * Returned seats include both incident representations of an edge crossing,
 * so each consecutive positive-length piece names its actual native facet.
 * The caller registers every used facet before publishing its material disk.
 * No source value, stop, triangle, axis, station or admission budget changes.
 * @author Samchon
 */
export function compileHumanSourceMonotoneFacetCourse(
  input: IHumanSourceLipMaterialCourseInput,
): IHumanFaceExactSkinSeat[] {
  const source = input.surface;
  const members = new Set(input.component);
  if (input.stops.length < 2 || input.stops.some((v) => !members.has(v)))
    throw new Error("Native monotone course needs ordered resident component stops.");
  const zero = F.create(0n), one = F.create(1n);
  const up = resolveHumanFaceApertureUp(input.axis);
  const along = new Map<number, IHumanExactFraction>();
  const height = new Map<number, IHumanExactFraction>();
  for (const vertex of input.component) {
    const p = source.positions.slice(3 * vertex, 3 * vertex + 3);
    along.set(vertex, F.from(p[0] * input.axis[0] + p[1] * input.axis[1] + p[2] * input.axis[2]));
    height.set(vertex, F.from(p[0] * up.x + p[1] * up.y + p[2] * up.z));
  }
  const native = new Map<string, number>();
  for (let at = 0; at < source.indices.length; at += 3)
    native.set(source.indices.slice(at, at + 3).join("/"), at / 3);
  const faces = new Map<number, readonly number[]>();
  const edges = new Map<string, readonly [number, number]>();
  const edgeFaces = new Map<string, number[]>();
  const vertexFaces = new Map<number, number[]>();
  const edgeKey = (a: number, b: number): string => a < b ? `${a}/${b}` : `${b}/${a}`;
  for (let at = 0; at < input.regionIndices.length; at += 3) {
    const corners = input.regionIndices.slice(at, at + 3);
    if (!corners.every((v) => members.has(v))) continue;
    const face = native.get(corners.join("/"));
    if (face === undefined)
      throw new Error("Native monotone region has no identical oriented source facet.");
    if (faces.has(face)) continue;
    faces.set(face, corners);
    for (let axis = 0; axis < 3; axis++) {
      const vertex = corners[axis];
      vertexFaces.set(vertex, [...(vertexFaces.get(vertex) ?? []), face]);
      const next = corners[(axis + 1) % 3], key = edgeKey(vertex, next);
      edges.set(key, vertex < next ? [vertex, next] : [next, vertex]);
      edgeFaces.set(key, [...(edgeFaces.get(key) ?? []), face]);
    }
  }
  if ([...edgeFaces.values()].some((incident) => incident.length > 2))
    throw new Error("Native monotone component has a nonmanifold source edge.");
  const seat = (face: number, weights: ReadonlyMap<number, IHumanExactFraction>): IHumanFaceExactSkinSeat => {
    const corners = faces.get(face)!;
    return { triangle: face, weights: [weights.get(corners[0]) ?? zero, weights.get(corners[1]) ?? zero, weights.get(corners[2]) ?? zero] };
  };
  const support = (point: IHumanFaceExactSkinSeat): Map<number, IHumanExactFraction> => {
    const corners = faces.get(point.triangle)!;
    return new Map(corners.map((v, at) => [v, point.weights[at]] as const).filter((entry) => entry[1].numerator !== 0n));
  };
  // Parent aliases share publication identity, but distinct native incidences
  // cannot be merged as traversal ports without their actual native support.
  const identity = (point: IHumanFaceExactSkinSeat): string =>
    `${identifyHumanFaceMaterialPoint(source, point.triangle, point.weights)}@${[...support(point)].sort((a, b) => a[0] - b[0])
      .map(([v, w]) => `${v}:${w.numerator}/${w.denominator}`).join("|")}`;
  const value = (point: IHumanFaceExactSkinSeat, field: ReadonlyMap<number, IHumanExactFraction>): IHumanExactFraction =>
    [...support(point)].reduce((sum, [v, w]) => F.add(sum, F.multiply(w, field.get(v)!)), zero);
  const vertexSeat = (vertex: number): IHumanFaceExactSkinSeat => {
    const face = vertexFaces.get(vertex)?.[0];
    if (face === undefined)
      throw new Error(`Native monotone stop ${vertex} has no resident facet.`);
    return seat(face, new Map([[vertex, one]]));
  };
  const edgeSeat = (key: string, level: IHumanExactFraction, face: number): IHumanFaceExactSkinSeat => {
    const [a, b] = edges.get(key)!;
    const t = F.divide(F.subtract(level, along.get(a)!), F.subtract(along.get(b)!, along.get(a)!));
    return seat(face, new Map([[a, F.subtract(one, t)], [b, t]]));
  };
  const ports = (level: IHumanExactFraction): Map<string, IHumanFaceExactSkinSeat> => {
    const out = new Map<string, IHumanFaceExactSkinSeat>();
    for (const [key, [a, b]] of edges) {
      const ca = F.compare(along.get(a)!, level), cb = F.compare(along.get(b)!, level);
      if (ca === 0) { const point = vertexSeat(a); out.set(identity(point), point); }
      if (cb === 0) { const point = vertexSeat(b); out.set(identity(point), point); }
      if (ca * cb < 0) {
        const point = edgeSeat(key, level, edgeFaces.get(key)![0]);
        out.set(identity(point), point);
      }
    }
    const plateau = [...faces.values()].some((corners) =>
      corners.every((v) => F.compare(along.get(v)!, level) === 0));
    if (plateau) {
      const events = [...new Map([...out.values()].map((point) => {
        const h = value(point, height);
        return [`${h.numerator}/${h.denominator}`, h] as const;
      })).values()].sort(F.compare);
      const fibers = [...events];
      for (let at = 1; at < events.length; at++)
        fibers.push(F.divide(F.add(events[at - 1], events[at]), F.create(2n)));
      for (const [key, [a, b]] of edges) {
        if (F.compare(along.get(a)!, level) !== 0 || F.compare(along.get(b)!, level) !== 0) continue;
        const ha = height.get(a)!, hb = height.get(b)!;
        if (F.compare(ha, hb) === 0) continue;
        for (const h of fibers) {
          if (F.compare(h, ha) * F.compare(h, hb) >= 0) continue;
          const t = F.divide(F.subtract(h, ha), F.subtract(hb, ha));
          const point = seat(edgeFaces.get(key)![0], new Map([[a, F.subtract(one, t)], [b, t]]));
          out.set(identity(point), point);
        }
      }
    }
    return out;
  };
  const incident = (point: IHumanFaceExactSkinSeat): number[] => {
    const vertices = [...support(point).keys()];
    return vertices.length === 1 ? vertexFaces.get(vertices[0])! : edgeFaces.get(edgeKey(vertices[0], vertices[1]))!;
  };
  const inFace = (point: IHumanFaceExactSkinSeat, face: number): IHumanFaceExactSkinSeat => seat(face, support(point));
  const flatAdvance = (
    current: Map<string, CourseTrail>,
    levelPorts: ReadonlyMap<string, IHumanFaceExactSkinSeat>,
  ): void => {
    const facePorts = new Map<number, string[]>();
    for (const [key, point] of levelPorts)
      for (const face of incident(point)) facePorts.set(face, [...(facePorts.get(face) ?? []), key]);
    const queue = [...current.keys()];
    for (let at = 0; at < queue.length; at++) {
      const key = queue[at], point = levelPorts.get(key)!;
      for (const face of incident(point))
        for (const next of facePorts.get(face) ?? []) {
          if (current.has(next)) continue;
          const target = levelPorts.get(next)!;
          if (F.compare(value(point, height), value(target, height)) !== 0) continue;
          current.set(next, [inFace(target, face), [inFace(point, face), current.get(key)!]]);
          queue.push(next);
        }
    }
  };
  const out: IHumanFaceExactSkinSeat[] = [];
  for (let stop = 1; stop < input.stops.length; stop++) {
    const start = vertexSeat(input.stops[stop - 1]), target = vertexSeat(input.stops[stop]);
    const from = value(start, along), to = value(target, along);
    if (F.compare(from, to) > 0)
      throw new Error("Native monotone stops decrease along the source axis.");
    const levels = [...new Map([...along.values()].filter((f) => F.compare(f, from) >= 0 && F.compare(f, to) <= 0)
      .map((f) => [`${f.numerator}/${f.denominator}`, f])).values()].sort(F.compare);
    let current = new Map<string, CourseTrail>([[identity(start), [start, null]]]);
    let lowerPorts = ports(from);
    flatAdvance(current, lowerPorts);
    for (let layer = 1; layer < levels.length; layer++) {
      const low = levels[layer - 1], high = levels[layer];
      const active = new Set<number>();
      for (const [face, corners] of faces)
        if (corners.some((v) => F.compare(along.get(v)!, low) <= 0) &&
            corners.some((v) => F.compare(along.get(v)!, high) >= 0)) active.add(face);
      const dual = new Map<number, Map<number, string>>();
      for (const face of active) dual.set(face, new Map());
      for (const [key, [a, b]] of edges) {
        const va = along.get(a)!, vb = along.get(b)!;
        const minimum = F.compare(va, vb) < 0 ? va : vb, maximum = F.compare(va, vb) < 0 ? vb : va;
        if (F.compare(minimum, low) > 0 || F.compare(maximum, high) < 0) continue;
        const adjacent = edgeFaces.get(key)!.filter((face) => active.has(face));
        if (adjacent.length === 2) {
          dual.get(adjacent[0])!.set(adjacent[1], key);
          dual.get(adjacent[1])!.set(adjacent[0], key);
        }
      }
      const upperPorts = ports(high), next = new Map<string, CourseTrail>();
      // Multi-source dual search retains one deterministic witness per slab.
      const parent = new Map<number, readonly [number | null, string]>();
      const queue: number[] = [];
      for (const [key] of current)
        for (const face of incident(lowerPorts.get(key)!))
          if (active.has(face) && !parent.has(face)) { parent.set(face, [null, key]); queue.push(face); }
      for (let at = 0; at < queue.length; at++)
        for (const [face, edge] of dual.get(queue[at])!)
          if (!parent.has(face)) { parent.set(face, [queue[at], edge]); queue.push(face); }
      for (const [key, point] of upperPorts) {
        const last = incident(point).find((face) => parent.has(face));
        if (last === undefined) continue;
        const corridor: number[] = [last], cuts: string[] = [];
        let face = last;
        while (parent.get(face)![0] !== null) {
          const [previous, edge] = parent.get(face)!;
          cuts.unshift(edge); corridor.unshift(previous!); face = previous!;
        }
        const origin = parent.get(face)![1];
        let path: CourseTrail = [inFace(lowerPorts.get(origin)!, corridor[0]), current.get(origin)!];
        for (let crossing = 0; crossing < cuts.length; crossing++) {
          const fraction = F.create(BigInt(crossing + 1), BigInt(cuts.length + 1));
          const level = F.add(low, F.multiply(F.subtract(high, low), fraction));
          path = [edgeSeat(cuts[crossing], level, corridor[crossing + 1]),
            [edgeSeat(cuts[crossing], level, corridor[crossing]), path]];
        }
        path = [inFace(point, last), path];
        next.set(key, path);
      }
      current = next; lowerPorts = upperPorts;
      flatAdvance(current, lowerPorts);
    }
    const path = current.get(identity(target));
    if (path === undefined)
      throw new Error(`Native monotone facet construction is unsupported between original stops ${input.stops[stop - 1]} and ${input.stops[stop]}; continuous path existence is unproven.`);
    const course: IHumanFaceExactSkinSeat[] = [];
    for (let trail: CourseTrail | null = path; trail !== null; trail = trail[1])
      course.push(trail[0]);
    course.reverse();
    // Two consecutive pieces in one convex native facet can share their
    // outer endpoints; affine along/up retain the same admitted direction.
    const reduced: IHumanFaceExactSkinSeat[] = [];
    for (const point of course) {
      if (reduced.length >= 2 && reduced.at(-1)!.triangle === point.triangle &&
          reduced.at(-2)!.triangle === point.triangle) reduced.pop();
      reduced.push(point);
    }
    out.push(...reduced);
  }
  return out;
}
