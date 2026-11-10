import { AutoMovieCurveMath64, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanLegF1World } from "../leg/AutoMovieHumanLegF1World";

/** Absolute world-mm point or same-frame direction. */
type V3 = AutoMovieCurveMath64.V;
/** Millimetre coordinates in one declared orthonormal section plane. */
type V2 = [number, number];
/** Original world frame; its axes and orientation are never inferred by matching. */
type Frame = ReturnType<AutoMovieViewAxis.IAxis["at"]>;
/** Three vertex identities in the owning indexed skin. */
type Face = [number, number, number];
/** Independent indexed sheet, regardless of whether its source was observed or generated. */
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
    const origin: V3 = frame.origin as V3;
    const normal: V3 = AutoMovieViewAxis.normal(frame) as V3;
    const distance: number[] = skin.points.map((p: V3): number => {
      const d: number = Geometry.dot(sub(p, origin), normal);
      return Math.abs(d) < 1e-9 ? 0 : d;
    });
    const edgeCuts: Map<string, number> = new Map();

    /** Share the one linear intersection belonging to this original indexed edge. */
    const crossing: (a: number, b: number) => number = (a: number, b: number): number => {
      if (distance[a] === 0) return a;
      if (distance[b] === 0) return b;
      const edge: string = edgeKey(a, b);
      const existing: number | undefined = edgeCuts.get(edge);
      if (existing !== undefined) return existing;
      const t: number = distance[a]! / (distance[a]! - distance[b]!);
      const index: number = skin.points.length;
      skin.points.push(mix(skin.points[a]!, skin.points[b]!, t));
      edgeCuts.set(edge, index);
      return index;
    };

    /** Preserve the original face traversal on either declared half-plane. */
    const polygon: (face: Face, sign: number) => number[] = (face: Face, sign: number): number[] => {
      const result: number[] = [];
      for (let k: number = 0; k < 3; ++k) {
        const a: number = face[k]!;
        const b: number = face[(k + 1) % 3]!;
        const da: number = sign * distance[a]!;
        const db: number = sign * distance[b]!;
        if (da >= 0) result.push(a);
        if (da * db < 0) result.push(crossing(a, b));
      }
      return result;
    };

    /** Tessellate only this convex clipped triangle, retaining shared vertex IDs. */
    const append: (target: Face[], poly: number[]) => void = (target: Face[], poly: number[]): void => {
      for (let i: number = 1; i + 1 < poly.length; ++i) {
        const face: Face = [poly[0]!, poly[i]!, poly[i + 1]!];
        if (new Set(face).size === 3) target.push(face);
      }
    };
    const positive: Face[] = [];
    const negative: Face[] = [];
    for (const face of skin.faces) {
      if (face.every((id: number): boolean => distance[id] === 0)) throw new Error("A native web clipping plane contains a complete face");
      append(positive, polygon(face, 1));
      append(negative, polygon(face, -1));
    }
    return { positive, negative };
  }

  /** Undirected edge identity; geometrically close points remain distinct. */
  function edgeKey(a: number, b: number): string {
    return a < b ? `${a},${b}` : `${b},${a}`;
  }

  /**
   * Keep native triangle components by shared edges.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native components are selected by actual indexed edge incidence.
   */
  export function skinComponents(faces: Face[]): Face[][] {
    const edgeFaces: Map<string, number[]> = new Map();
    for (const [i, face] of faces.entries()) for (let k: number = 0; k < 3; ++k) {
      const key: string = edgeKey(face[k]!, face[(k + 1) % 3]!);
      const incident: number[] | undefined = edgeFaces.get(key);
      if (incident === undefined) edgeFaces.set(key, [i]);
      else incident.push(i);
    }
    const seen: Set<number> = new Set();
    const output: Face[][] = [];
    for (let i: number = 0; i < faces.length; ++i) {
      if (seen.has(i)) continue;
      const queue: number[] = [i];
      seen.add(i);
      for (let j: number = 0; j < queue.length; ++j) {
        const face: Face = faces[queue[j]!]!;
        for (let k: number = 0; k < 3; ++k) for (const next of edgeFaces.get(edgeKey(face[k]!, face[(k + 1) % 3]!))!) {
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push(next);
        }
      }
      output.push(queue.map((id: number): Face => faces[id]!));
    }
    return output;
  }

  /** Match the clipped component's actual boundary to its observed root. */
  export function matchingRims(points: V3[], faces: Face[], port: { frame: Frame; points: readonly V3[] }, tolerance: number): { faces: Face[]; ring: number[]; deviation: number }[] {
    const origin: V3 = port.frame.origin as V3;
    const normal: V3 = AutoMovieViewAxis.normal(port.frame) as V3;
    const edges: Map<string, { edge: [number, number]; uses: number }> = new Map();
    for (const face of faces) for (let k: number = 0; k < 3; ++k) {
      const a: number = face[k]!;
      const b: number = face[(k + 1) % 3]!;
      if ([a, b].some((id: number): boolean => Math.abs(Geometry.dot(sub(points[id]!, origin), normal)) > 1e-8)) continue;
      const key: string = edgeKey(a, b);
      const value: { edge: [number, number]; uses: number } | undefined = edges.get(key);
      if (value === undefined) edges.set(key, { edge: [a, b], uses: 1 });
      else ++value.uses;
    }
    const next: Map<number, number> = new Map();
    const previous: Set<number> = new Set();
    for (const { edge: [a, b], uses } of edges.values()) if (uses === 1) {
      if (next.has(a) || previous.has(b)) return [];
      next.set(a, b);
      previous.add(b);
    }
    if (next.size < 3) return [];
    const first: number = next.keys().next().value!;
    const ring: number[] = [first];
    for (let at: number | undefined = next.get(first); at !== first; at = next.get(at!)) {
      if (at === undefined || ring.length >= next.size) return [];
      ring.push(at);
    }
    if (ring.length !== next.size) return [];

    /** Project both observed and emitted loops into this same physical plane. */
    const chart: (p: V3) => V2 = (p: V3): V2 => {
      const d: V3 = sub(p, origin);
      return [Geometry.dot(d, port.frame.u as V3), Geometry.dot(d, port.frame.v as V3)];
    };
    const deviation: number = sectionDeviation(ring.map((id: number): V2 => chart(points[id]!)), port.points.map(chart));
    return deviation <= tolerance ? [{ faces, ring, deviation }] : [];
  }

  /**
   * Compare the two actual plane sections by distance to the other polygon.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sectionDeviation(a: readonly V2[], b: readonly V2[]): number {
    /** Directed vertex-to-segment polygon distance, in the plane millimetres. */
    const directed: (source: readonly V2[], target: readonly V2[]) => number = (source: readonly V2[], target: readonly V2[]): number => {
      let largest: number = 0;
      for (const [x, y] of source) {
        let nearest: number = Infinity;
        for (let i: number = 0; i < target.length; ++i) {
          const [ax, ay]: V2 = target[i]!;
          const [bx, by]: V2 = target[(i + 1) % target.length]!;
          const dx: number = bx - ax;
          const dy: number = by - ay;
          const lengthSquared: number = dx * dx + dy * dy;
          const along: number = lengthSquared === 0 ? 0 : ((x - ax) * dx + (y - ay) * dy) / lengthSquared;
          const t: number = Math.max(0, Math.min(1, along));
          nearest = Math.min(nearest, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
        }
        largest = Math.max(largest, nearest);
      }
      return Math.sqrt(largest);
    };
    return Math.max(directed(a, b), directed(b, a));
  }

  /**
   * Ordinary loft inside the existing F1 root band, in absolute world mm.
   * The caller supplies its retained indexed rail, original exact toe root
   * and only observed polylines wholly between those rails along the root
   * normal. No healthy plane cuts or new authored positions are introduced.
   *
   * The existing closed-curve operator orders each ring at its measured
   * root-frame +u extent and uses geometric perimeter length. That clock is
   * not a material correspondence or a G1 guarantee. In particular the first
   * retained rail may be stepped and need not be a star-shaped plane cut.
   * Both indexed rims and every stored knot remain; the whole-body crossing,
   * normal and same-camera gates decide the resulting finite surface.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses the existing F1 closed-curve ordering and ordinary adjacent-ring loft on the unchanged physical root frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source faces, outside source row, minimum-area fan, tolerance widening or coordinate weld supplies this band.
   */
  export function f1RootLoft(
    positions: number[], lower: number[], upper: number[], frame: Frame, sections: readonly (readonly V3[])[],
  ): number[] {
    /** Read an existing indexed point without moving either shared boundary. */
    const point: (id: number) => V3 = (id: number): V3 => [positions[3 * id]!, positions[3 * id + 1]!, positions[3 * id + 2]!];

    /** Preserve the complete ring under the existing actual-frame ordering. */
    const order: (row: number[]) => number[] = (row: number[]): number[] => {
      const points: V3[] = row.map(point);
      const ids: Map<V3, number> = new Map(points.map((p: V3, i: number): [V3, number] => [p, row[i]!]));
      const ordered: V3[] = AutoMovieHumanLegF1World.forkClock(points, frame);
      if (ordered.length !== row.length)
        throw new Error("The finite F1 root loft cannot discard a retained boundary knot");
      return ordered.map((p: V3): number => ids.get(p)!);
    };
    const rows: number[][] = [lower];
    for (const section of sections) rows.push(section.map((p: V3): number => {
      const id: number = positions.length / 3;
      positions.push(p[0], p[1], p[2]);
      return id;
    }));
    rows.push(upper);
    const ordered: number[][] = rows.map(order);
    const indices: number[] = [];
    for (let i: number = 1; i < ordered.length; ++i)
      AutoMovieHumanLegF1World.stitchRows(ordered[i - 1]!, ordered[i]!, positions, indices, "length");

    // Bind both complete directed rims and reject exactly zero-area tiles.
    // Near-collinearity remains a separate same-body normal/crossing gate.
    for (let i: number = 0; i < indices.length; i += 3) {
      const a: V3 = point(indices[i]!), b: V3 = point(indices[i + 1]!), c: V3 = point(indices[i + 2]!);
      if (!(Math.hypot(...Geometry.cross(sub(b, a), sub(c, a))) > 0))
        throw new Error("Distinct measured F1 root knots collapse an ordinary loft tile");
    }
    return indices;
  }
}
