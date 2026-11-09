import { AutoMovieCurveMath64, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";

type V3 = AutoMovieCurveMath64.V;
type V2 = [number, number];
type Frame = ReturnType<AutoMovieViewAxis.IAxis["at"]>;
type Face = [number, number, number];
type INativeSkin = { points: V3[]; faces: Face[] };
const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
const { sub, mix }: typeof AutoMovieCurveMath64 = AutoMovieCurveMath64;

/** Indexed cuts and observed port matching for the F1 forefoot owner. */
export namespace AutoMovieHumanFootWebTrim {
  /**
   * Exact linear triangle clipping with one shared intersection per source edge.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Both half sheets reuse the same measured edge intersections.
   */
  export function splitSkin(skin: INativeSkin, frame: Frame): { positive: Face[]; negative: Face[] } {
    const origin = frame.origin as V3;
    const normal = AutoMovieViewAxis.normal(frame) as V3;
    const distance = skin.points.map((p): number => {
      const d = Geometry.dot(sub(p, origin), normal);
      return Math.abs(d) < 1e-9 ? 0 : d;
    });
    const edgeCuts = new Map<string, number>();
    const crossing = (a: number, b: number): number => {
      if (distance[a] === 0) return a;
      if (distance[b] === 0) return b;
      const edge = edgeKey(a, b);
      const existing = edgeCuts.get(edge);
      if (existing !== undefined) return existing;
      const t = distance[a]! / (distance[a]! - distance[b]!);
      const index = skin.points.length;
      skin.points.push(mix(skin.points[a]!, skin.points[b]!, t));
      edgeCuts.set(edge, index);
      return index;
    };
    const polygon = (face: Face, sign: number): number[] => {
      const result: number[] = [];
      for (let k = 0; k < 3; ++k) {
        const a = face[k]!;
        const b = face[(k + 1) % 3]!;
        const da = sign * distance[a]!;
        const db = sign * distance[b]!;
        if (da >= 0) result.push(a);
        if (da * db < 0) result.push(crossing(a, b));
      }
      return result;
    };
    const append = (target: Face[], poly: number[]): void => {
      for (let i = 1; i + 1 < poly.length; ++i) {
        const face: Face = [poly[0]!, poly[i]!, poly[i + 1]!];
        if (new Set(face).size === 3) target.push(face);
      }
    };
    const positive: Face[] = [];
    const negative: Face[] = [];
    for (const face of skin.faces) {
      if (face.every((id): boolean => distance[id] === 0)) throw new Error("A native web clipping plane contains a complete face");
      append(positive, polygon(face, 1));
      append(negative, polygon(face, -1));
    }
    return { positive, negative };
  }

  function edgeKey(a: number, b: number): string {
    return a < b ? `${a},${b}` : `${b},${a}`;
  }

  /**
   * Keep native triangle components by shared edges.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native components are selected by actual indexed edge incidence.
   */
  export function skinComponents(faces: Face[]): Face[][] {
    const edgeFaces = new Map<string, number[]>();
    for (const [i, face] of faces.entries()) for (let k = 0; k < 3; ++k) {
      const key = edgeKey(face[k]!, face[(k + 1) % 3]!);
      const incident = edgeFaces.get(key);
      if (incident === undefined) edgeFaces.set(key, [i]);
      else incident.push(i);
    }
    const seen = new Set<number>();
    const output: Face[][] = [];
    for (let i = 0; i < faces.length; ++i) {
      if (seen.has(i)) continue;
      const queue = [i];
      seen.add(i);
      for (let j = 0; j < queue.length; ++j) {
        const face = faces[queue[j]!]!;
        for (let k = 0; k < 3; ++k) for (const next of edgeFaces.get(edgeKey(face[k]!, face[(k + 1) % 3]!))!) {
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push(next);
        }
      }
      output.push(queue.map((id): Face => faces[id]!));
    }
    return output;
  }

  /** Match the clipped component's actual boundary to its observed root. */
  export function matchingRims(points: V3[], faces: Face[], port: { frame: Frame; points: readonly V3[] }, tolerance: number): { faces: Face[]; ring: number[]; deviation: number }[] {
    const origin = port.frame.origin as V3;
    const normal = AutoMovieViewAxis.normal(port.frame) as V3;
    const edges = new Map<string, { edge: [number, number]; uses: number }>();
    for (const face of faces) for (let k = 0; k < 3; ++k) {
      const a = face[k]!;
      const b = face[(k + 1) % 3]!;
      if ([a, b].some((id): boolean => Math.abs(Geometry.dot(sub(points[id]!, origin), normal)) > 1e-8)) continue;
      const key = edgeKey(a, b);
      const value = edges.get(key);
      if (value === undefined) edges.set(key, { edge: [a, b], uses: 1 });
      else ++value.uses;
    }
    const next = new Map<number, number>();
    const previous = new Set<number>();
    for (const { edge: [a, b], uses } of edges.values()) if (uses === 1) {
      if (next.has(a) || previous.has(b)) return [];
      next.set(a, b);
      previous.add(b);
    }
    if (next.size < 3) return [];
    const first = next.keys().next().value!;
    const ring = [first];
    for (let at = next.get(first); at !== first; at = next.get(at!)) {
      if (at === undefined || ring.length >= next.size) return [];
      ring.push(at);
    }
    if (ring.length !== next.size) return [];
    const chart = (p: V3): V2 => {
      const d = sub(p, origin);
      return [Geometry.dot(d, port.frame.u as V3), Geometry.dot(d, port.frame.v as V3)];
    };
    const deviation: number = sectionDeviation(ring.map((id): V2 => chart(points[id]!)), port.points.map(chart));
    return deviation <= tolerance ? [{ faces, ring, deviation }] : [];
  }

  /**
   * Compare the two actual plane sections by distance to the other polygon.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sectionDeviation(a: readonly V2[], b: readonly V2[]): number {
    const directed = (source: readonly V2[], target: readonly V2[]): number => {
      let largest = 0;
      for (const [x, y] of source) {
        let nearest = Infinity;
        for (let i = 0; i < target.length; ++i) {
          const [ax, ay] = target[i]!;
          const [bx, by] = target[(i + 1) % target.length]!;
          const dx = bx - ax;
          const dy = by - ay;
          const lengthSquared = dx * dx + dy * dy;
          const along = lengthSquared === 0 ? 0 : ((x - ax) * dx + (y - ay) * dy) / lengthSquared;
          const t = Math.max(0, Math.min(1, along));
          nearest = Math.min(nearest, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
        }
        largest = Math.max(largest, nearest);
      }
      return Math.sqrt(largest);
    };
    return Math.max(directed(a, b), directed(b, a));
  }

  /**
   * Loft actual parallel F1 root sections in one fixed physical ray chart.
   * World positions remain millimetres (+X forward, +Y up, left negative Z).
   * The chart is geometric correspondence, not a measured material label.
   * It refuses a non-single-valued contour; no minimum-area fan, source mesh,
   * tolerance change or coordinate weld supplies a missing correspondence.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Ordered observed cross-sections share the actual root axes; all boundary knots and every intermediate curve are retained by adjacent ordinary tiles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A reversed ray order or collapsed distinct tile is refused; the caller owns exact boundary orientation and the final independent surface gates.
   */
  export function f1RootLoft(
    positions: number[], lower: number[], upper: number[], frame: Frame, sections: readonly (readonly V3[])[],
  ): number[] {
    const point = (id: number): V3 => [positions[3 * id]!, positions[3 * id + 1]!, positions[3 * id + 2]!];
    const order = (raw: number[]): { ids: number[]; phases: number[] } => {
      const angles = raw.map(id => {
        const d = sub(point(id), frame.origin as V3);
        return Math.atan2(Geometry.dot(d, frame.v as V3), Geometry.dot(d, frame.u as V3));
      });
      const sorted = raw.map((_, i) => i).sort((a, b): number => angles[a]! - angles[b]!);
      const first = sorted[0]!, step = sorted[1] === (first + 1) % raw.length ? 1 : -1;
      if (sorted.some((index, i): boolean => index !== (first + step * i + raw.length) % raw.length) ||
        sorted.some((index, i): boolean => i > 0 && !(angles[index]! > angles[sorted[i - 1]!]!)))
        throw new Error("An observed F1 root curve is not single-valued on its actual ray chart");
      return { ids: sorted.map(i => raw[i]!), phases: sorted.map(i => angles[i]!) };
    };
    const rows: number[][] = [lower];
    for (const section of sections) rows.push(section.map(value => {
      const id = positions.length / 3;
      positions.push(value[0], value[1], value[2]); return id;
    }));
    rows.push(upper);
    const prepared = rows.map(order), indices: number[] = [];
    for (let k = 1; k < prepared.length; ++k) {
      const a = prepared[k - 1]!, b = prepared[k]!;
      const clocks = (row: typeof a): number[] => [...row.phases.slice(1), row.phases[0]! + 2 * Math.PI];
      const ca = clocks(a), cb = clocks(b);
      let i = 0, j = 0;
      while (i < a.ids.length || j < b.ids.length) {
        const x = a.ids[i % a.ids.length]!, y = b.ids[j % b.ids.length]!;
        if ((ca[i] ?? Infinity) < (cb[j] ?? Infinity)) indices.push(x, y, a.ids[++i % a.ids.length]!);
        else indices.push(x, y, b.ids[++j % b.ids.length]!);
      }
    }
    for (let i = 0; i < indices.length; i += 3) {
      const a = point(indices[i]!), b = point(indices[i + 1]!), c = point(indices[i + 2]!);
      if (!(Math.hypot(...Geometry.cross(sub(b, a), sub(c, a))) > 0))
        throw new Error("Distinct observed F1 transverse sections collapse an ordinary root tile");
    }
    return indices;
  }


}
