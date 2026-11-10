import { AutoMovieCurveMath64, AutoMovieViewAxis } from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
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
/** Cut-rim knots and their exact removed-band incidence at each retained knot. */
type RootGuide = { rim: V3[]; neighbors: number[][] };
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
   * Remove the original single indexed toe band and retain its source incidence.
   * The removal and remaining inner cycle are the same as the original F1
   * operation. Each retained knot records the cut-rim vertices joined to it
   * by those generated faces; a stepped inner rim needs no polar chart.
   */
  export function withdrawBand(skin: INativeSkin, trim: readonly number[]): { before: number[]; guide: RootGuide } {
    const rim: Set<number> = new Set(trim);
    const removed: Face[] = skin.faces.filter((face: Face): boolean => face.some((id: number): boolean => rim.has(id)));
    skin.faces = skin.faces.filter((face: Face): boolean => face.every((id: number): boolean => !rim.has(id)));
    const wanted: Set<string> = new Set();
    for (const face of removed)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!;
        if (!rim.has(a) && !rim.has(b)) wanted.add(edgeKey(a, b));
      }
    const next: Map<number, number> = new Map();
    for (const face of skin.faces)
      for (let i: number = 0; i < 3; ++i) {
        const a: number = face[i]!, b: number = face[(i + 1) % 3]!;
        if (!wanted.has(edgeKey(a, b))) continue;
        if (next.has(a)) throw new Error("The generated toe band has a branching inner rail");
        next.set(a, b);
      }
    const start: number | undefined = next.keys().next().value;
    if (start === undefined) throw new Error("The generated toe band has no remaining inner rail");
    const before: number[] = [start];
    for (let id: number | undefined = next.get(start); id !== start; id = next.get(id)) {
      if (id === undefined || before.length >= next.size) throw new Error("The generated toe band has an open inner rail");
      before.push(id);
    }
    if (before.length !== next.size) throw new Error("The generated toe band has separate inner rails");
    const neighbors: number[][] = before.map((id: number): number[] => {
      const touching: Set<number> = new Set();
      for (const face of removed)
        if (face.includes(id)) for (const other of face) if (rim.has(other)) touching.add(other);
      return trim.flatMap((other: number, i: number): number[] => touching.has(other) ? [i] : []);
    });
    return { before, guide: { rim: trim.map((id: number): V3 => skin.points[id]!), neighbors } };
  }

  /**
   * Ordinary loft inside the existing F1 root band, in absolute world mm.
   * The caller supplies its retained indexed rail, original exact toe root
   * and the actual neighboring web/toe faces. No healthy plane cuts or new
   * authored positions are introduced.
   *
   * The exact toe polygon supplies the common curve parameter. The selected
   * cut rim is projected to that same known root curve, not to a new domain.
   * Its removed-face incidence carries this parameter to the stepped inner
   * rail, including local radial reversals; that rail is never required to
   * be star-shaped. Each neighbor interval follows the original cut cycle.
   * Projection is geometric correspondence, not measured material identity.
   * The ab98127fa5 CPU/GPU round exposed folded finite bands despite that
   * boundary ownership. Their interior artifact knots are not constraints:
   * area-weighted normals of the unchanged neighboring faces infer transverse
   * directions for a complete Hermite row loft. Native JSON remains the
   * reversible observation record. This is not a final G1/embedding claim.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Carries the original generated cut-to-inner incidence onto the exact root polygon parameter and supplies complete adjacent curves to the existing ordinary strip; no polar condition is imposed on the stepped inner boundary.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source faces, outside source row, minimum-area fan, tolerance widening or coordinate weld supplies this band.
   */
  export function f1RootLoft(
    positions: number[], lower: number[], upper: number[], frame: Frame, guide: RootGuide, existingIndices: readonly number[],
  ): number[] {
    /** Read an existing indexed point without moving either shared boundary. */
    const point: (id: number) => V3 = (id: number): V3 => [positions[3 * id]!, positions[3 * id + 1]!, positions[3 * id + 2]!];

    const root: V3[] = upper.map(point);
    const distances: number[] = [0];
    for (let i: number = 0; i < root.length; ++i)
      distances.push(distances[i]! + Math.hypot(...sub(root[(i + 1) % root.length]!, root[i]!)));
    const perimeter: number = distances.at(-1)!;

    /** Locate a geometric point on this already selected exact root polygon. */
    const phase: (p: V3) => number = (p: V3): number => {
      const q: V3 = sub(p, frame.origin as V3);
      const xy: V2 = [Geometry.dot(q, frame.u as V3), Geometry.dot(q, frame.v as V3)];
      let nearest: number = Infinity, parameter: number = 0;
      for (let i: number = 0; i < root.length; ++i) {
        const a: V3 = sub(root[i]!, frame.origin as V3), b: V3 = sub(root[(i + 1) % root.length]!, frame.origin as V3);
        const x: number = Geometry.dot(a, frame.u as V3), y: number = Geometry.dot(a, frame.v as V3);
        const dx: number = Geometry.dot(sub(b, a), frame.u as V3), dy: number = Geometry.dot(sub(b, a), frame.v as V3);
        const l2: number = dx * dx + dy * dy;
        const t: number = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((xy[0] - x) * dx + (xy[1] - y) * dy) / l2));
        const distance: number = (xy[0] - x - t * dx) ** 2 + (xy[1] - y - t * dy) ** 2;
        const at: number = (distances[i]! + t * (distances[i + 1]! - distances[i]!)) % perimeter;
        if (distance < nearest) { nearest = distance; parameter = at; }
        else if (distance === nearest && parameter !== at)
          throw new Error("An observed F1 root support has ambiguous exact-polygon correspondence");
      }
      return parameter;
    };
    const cut: number[] = guide.rim.map(phase);
    const lowerPhases: number[] = guide.neighbors.map((neighbors: number[]): number => {
      const owners: Set<number> = new Set(neighbors);
      const starts: number[] = neighbors.filter((id: number): boolean => !owners.has((id + cut.length - 1) % cut.length));
      if (starts.length !== 1) throw new Error("The removed F1 root band has no single contiguous cut-curve owner");
      const start: number = starts[0]!;
      let end: number = start;
      while (owners.has((end + 1) % cut.length)) end = (end + 1) % cut.length;
      const first: number = cut[start]!, last: number = cut[end]!;
      const delta: number = last - first;
      return (first + (delta < -perimeter / 2 ? delta + perimeter : delta > perimeter / 2 ? delta - perimeter : delta) / 2 + perimeter) % perimeter;
    });

    /** Rotate or reverse only the declared cyclic walk; never sort unrelated knots. */
    const order: (row: number[], values: number[]) => { row: number[]; clock: number[] } = (row: number[], values: number[]): { row: number[]; clock: number[] } => {
      const start: number = values.reduce((best: number, value: number, i: number): number => value < values[best]! ? i : best, 0);
      const forward: number[] = row.map((_: number, i: number): number => (start + i) % row.length);
      const direction: 1 | -1 = forward.every((id: number, i: number): boolean => i === 0 || values[id]! >= values[forward[i - 1]!]!) ? 1 : -1;
      const cycle: number[] = row.map((_: number, i: number): number => (start + direction * i + row.length) % row.length);
      if (cycle.some((id: number, i: number): boolean => i > 0 && values[id]! < values[cycle[i - 1]!]!))
        throw new Error("The adjacent F1 root curves disagree with their indexed cut-curve correspondence");
      const phases: number[] = cycle.map((id: number): number => values[id]!);
      return { row: cycle.map((id: number): number => row[id]!), clock: [...phases.slice(1), phases[0]! + perimeter] };
    };
    const ordered: { row: number[]; clock: number[] }[] = [order(lower, lowerPhases), order(upper, distances.slice(0, -1))];
    const rails: Parameters<typeof AutoMovieHumanLegF1World.fairBand>[0][] = ordered.map(
      ({ row, clock }: typeof ordered[number]): Parameters<typeof AutoMovieHumanLegF1World.fairBand>[0] =>
        ({ row, phase: [clock.at(-1)! - perimeter, ...clock.slice(0, -1)].map((value: number): number => value / perimeter) }));
    const normals: number[] = AutoMovieHumanLoftMesh.normals({ positions, indices: [...existingIndices], groups: [] });

    /** Evaluate an existing boundary and its healthy neighboring normal field. */
    const evaluate: (rail: typeof rails[number], u: number) => { p: V3; n: V3 } = (rail: typeof rails[number], u: number): { p: V3; n: V3 } => {
      const x: number = u < rail.phase[0]! ? u + 1 : u;
      const ends: number[] = [...rail.phase.slice(1), rail.phase[0]! + 1];
      const i: number = ends.findIndex((end: number): boolean => x <= end), j: number = (i + 1) % rail.row.length;
      const t: number = (x - rail.phase[i]!) / (ends[i]! - rail.phase[i]!);
      const a: number = rail.row[i]!, b: number = rail.row[j]!;
      const n0: V3 = [normals[3 * a]!, normals[3 * a + 1]!, normals[3 * a + 2]!], n1: V3 = [normals[3 * b]!, normals[3 * b + 1]!, normals[3 * b + 2]!];
      return { p: mix(point(a), point(b), t), n: Geometry.unit(mix(n0, n1, t)) };
    };
    const parameters: number[] = [...new Set(rails.flatMap((rail: typeof rails[number]): number[] => rail.phase))].sort((a: number, b: number): number => a - b);
    const columns: Parameters<typeof AutoMovieHumanLegF1World.fairBand>[2] = parameters.map(
      (u: number): Parameters<typeof AutoMovieHumanLegF1World.fairBand>[2][number] => {
        const a: { p: V3; n: V3 } = evaluate(rails[0]!, u), b: { p: V3; n: V3 } = evaluate(rails[1]!, u), chord: V3 = sub(b.p, a.p);
        const da: V3 = sub(chord, AutoMovieCurveMath64.scale(a.n, Geometry.dot(chord, a.n)));
        const db: V3 = sub(chord, AutoMovieCurveMath64.scale(b.n, Geometry.dot(chord, b.n)));
        return { phase: u, span: AutoMovieCurveMath64.hermite(a.p, b.p, da, db, 1) };
      });
    const indices: number[] = [];
    AutoMovieHumanLegF1World.fairBand(rails[0]!, rails[1]!, columns, positions, indices, true);

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
