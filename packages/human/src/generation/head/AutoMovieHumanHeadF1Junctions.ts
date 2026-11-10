import { AutoMovieCurveMath64, generateAutoMovieContourLoft64, tessellateAutoMovieContourStrip64, type IAutoMovieContourLoft64, type IAutoMovieCurve64 } from "@automovie/engine";

import { AutoMovieHumanLoftMesh } from "../../lofting/AutoMovieHumanLoftMesh";
import floorInputs from "./AutoMovieHumanHeadF1Floor.json";

import inputs from "./AutoMovieHumanHeadF1JunctionInputs.json";

/** Original triangle range from the existing contour realization. */
type Primitive = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];
/** Previously recorded ordinary controls and branch incidence. */
type Recorded = (typeof inputs)[number];

/** The accepted contour-owned F1 head junctions in their observed world charts. */
export namespace AutoMovieHumanHeadF1Junctions {
  /** One locally generated indexed skin and the exact named boundary walks it emits. */
  export interface IOutput {
    /** Absolute ISB world millimetres and newly generated triangles. */
    mesh: { positions: number[]; indices: number[] };

    /** Actual ordered indices of the output's named rails. */
    rails: Map<string, number[]>;
  }


  /**
   * Loft the actual recorded turned open arcs across all their lateral width.
   * Only the stated inner world-Y domain is retained. The two extra triangles
   * that a periodic zipper would use to close each open arc are discarded by
   * their indexed end-edge identity, never published as skin. Finite ordinary
   * bands meet the unchanged outer Y rims. Source-edge clocks are explicit
   * numeric inputs; their between-anchor interpolation is not a G1 claim.
   */
  export function floor(mesh: AutoMovieHumanLoftMesh.IContext, lower: readonly number[], upper: readonly number[]): string {
    /** World-mm vector and local generated buffers. */
    type V = AutoMovieCurveMath64.V;
    const source: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanLoftMesh.create();
    const rows: number[][][] = floorInputs.sections.map((row: typeof floorInputs.sections[number]): number[][] =>
      row.curves.map((curve: typeof row.curves[number]): number[] =>
        AutoMovieHumanLoftMesh.vertices(source, curve.pointsMm.map(AutoMovieCurveMath64.clone))));
    for (const link of floorInputs.links) {
      const a: number[] = rows[link.before]![link.a]!.slice(link.loStart, link.loEnd + 1);
      const raw: number[] = rows[link.after]![link.b]!;
      const b: number[] = (link.reverse ? raw.slice().reverse() : raw).slice(link.hiStart, link.hiEnd + 1);
      const first: number = source.indices.length;
      AutoMovieHumanLoftMesh.zipper(source, a, link.lower.map((p: number): number => Math.PI * p),
        b, link.upper.map((p: number): number => Math.PI * p));
      const emitted: number[] = source.indices.splice(first);
      for (let i: number = 0; i < emitted.length; i += 3) {
        const face: number[] = emitted.slice(i, i + 3);
        const closes: boolean = (face.includes(a[0]!) && face.includes(a.at(-1)!))
          || (face.includes(b[0]!) && face.includes(b.at(-1)!));
        if (!closes) source.indices.push(...face);
      }
    }
    const low: number = floorInputs.innerBoundsMm[0]!, high: number = floorInputs.innerBoundsMm[1]!;
    const intersections: Map<string, number> = new Map();
    /** One generated edge owns each exact clipping-plane intersection. */
    const split: (a: number, b: number, y: number) => number = (a: number, b: number, y: number): number => {
      const p: V = AutoMovieHumanLoftMesh.position(source, a), q: V = AutoMovieHumanLoftMesh.position(source, b);
      if (p[1] === y) return a; if (q[1] === y) return b;
      const key: string = Math.min(a, b) + ":" + Math.max(a, b) + ":" + y;
      const found: number | undefined = intersections.get(key); if (found !== undefined) return found;
      const t: number = (y - p[1]) / (q[1] - p[1]);
      const point: V = AutoMovieCurveMath64.mix(p, q, t); point[1] = y;
      const id: number = AutoMovieHumanLoftMesh.vertices(source, [point])[0]!;
      intersections.set(key, id); return id;
    };
    /** Restrict a newly lofted triangle to the local physical domain, with no cap. */
    const clip: (polygon: number[], y: number, sense: 1 | -1) => number[] =
      (polygon: number[], y: number, sense: 1 | -1): number[] => {
        const output: number[] = [];
        for (let i: number = 0; i < polygon.length; i++) {
          const a: number = polygon[i]!, b: number = polygon[(i + 1) % polygon.length]!;
          const ina: boolean = sense * (source.positions[3 * a + 1]! - y) >= 0;
          const inb: boolean = sense * (source.positions[3 * b + 1]! - y) >= 0;
          if (ina) output.push(a);
          if (ina !== inb) output.push(split(a, b, y));
        }
        return output.filter((id: number, i: number): boolean => id !== output[(i + output.length - 1) % output.length]);
      };
    const clipped: number[] = [];
    for (let i: number = 0; i < source.indices.length; i += 3) {
      const polygon: number[] = clip(clip(source.indices.slice(i, i + 3), low, 1), high, -1);
      for (let j: number = 1; j + 1 < polygon.length; j++)
        if (new Set([polygon[0]!, polygon[j]!, polygon[j + 1]!]).size === 3)
          clipped.push(polygon[0]!, polygon[j]!, polygon[j + 1]!);
    }
    source.indices = clipped;
    const edges: Map<string, { face: number; a: number; b: number }[]> = new Map();
    for (let i: number = 0; i < clipped.length; i += 3) for (let j: number = 0; j < 3; j++) {
      const a: number = clipped[i + j]!, b: number = clipped[i + (j + 1) % 3]!;
      const key: string = Math.min(a, b) + ":" + Math.max(a, b);
      const list: { face: number; a: number; b: number }[] = edges.get(key) ?? [];
      list.push({ face: i / 3, a, b }); edges.set(key, list);
    }
    const adjacency: { face: number; opposite: boolean }[][] = Array.from({ length: clipped.length / 3 }, (): { face: number; opposite: boolean }[] => []);
    for (const list of edges.values()) {
      if (list.length > 2) throw new Error("The local turned-arc loft has multiple indexed edge incidence", { cause: source });
      if (list.length === 2) {
        const a: typeof list[number] = list[0]!, b: typeof list[number] = list[1]!;
        adjacency[a.face]!.push({ face: b.face, opposite: a.a === b.a });
        adjacency[b.face]!.push({ face: a.face, opposite: a.a === b.a });
      }
    }
    const flips: Map<number, boolean> = new Map();
    let components: number = 0;
    for (let seed: number = 0; seed < adjacency.length; seed++) {
      if (flips.has(seed)) continue;
      components++; flips.set(seed, false); const queue: number[] = [seed];
      for (let i: number = 0; i < queue.length; i++) for (const neighbor of adjacency[queue[i]!]!) {
        const expected: boolean = flips.get(queue[i]!) !== neighbor.opposite;
        if (flips.has(neighbor.face)) {
          if (flips.get(neighbor.face) !== expected) throw new Error("The local turned-arc loft is not orientable", { cause: source });
        } else { flips.set(neighbor.face, expected); queue.push(neighbor.face); }
      }
    }
    if (components !== 1) throw new Error("The local turned-arc floor is not one connected surface", { cause: source });
    for (const [face, flip] of flips) if (flip)
      [source.indices[3 * face + 1], source.indices[3 * face + 2]] = [source.indices[3 * face + 2]!, source.indices[3 * face + 1]!];
    const next: Map<number, number> = new Map();
    for (const list of edges.values()) if (list.length === 1) {
      const edge: typeof list[number] = list[0]!;
      const a: number = flips.get(edge.face) ? edge.b : edge.a, b: number = flips.get(edge.face) ? edge.a : edge.b;
      if (next.has(a)) throw new Error("The local turned-arc boundary has more than one outgoing edge", { cause: source });
      next.set(a, b);
    }
    const cycles: number[][] = [];
    while (next.size !== 0) {
      const first: number = next.keys().next().value!;
      const cycle: number[] = []; let at: number = first;
      do {
        cycle.push(at); const to: number | undefined = next.get(at);
        if (to === undefined) throw new Error("The local turned-arc boundary is open", { cause: source });
        next.delete(at); at = to;
      } while (at !== first);
      cycles.push(cycle);
    }
    const lowerCycle: number[] | undefined = cycles.find((ring: number[]): boolean => ring.every((id: number): boolean => source.positions[3 * id + 1] === low));
    const upperCycle: number[] | undefined = cycles.find((ring: number[]): boolean => ring.every((id: number): boolean => source.positions[3 * id + 1] === high));
    if (cycles.length !== 2 || lowerCycle === undefined || upperCycle === undefined)
      throw new Error("The local turned-arc loft does not expose exactly its two physical Y ports", { cause: { source, cycles } });
    const ids: Map<number, number> = new Map();
    /** Transfer each generated identity once; there is no coordinate weld. */
    const index: (id: number) => number = (id: number): number => {
      const found: number | undefined = ids.get(id); if (found !== undefined) return found;
      const value: number = AutoMovieHumanLoftMesh.vertices(mesh, [AutoMovieHumanLoftMesh.position(source, id)])[0]!;
      ids.set(id, value); return value;
    };
    for (const id of source.indices) mesh.indices.push(index(id));
    /** Match whole-cycle order, retaining every original caller index. */
    const area: (ring: readonly number[]) => number = (ring: readonly number[]): number => ring.reduce((sum: number, id: number, i: number): number => {
      const a: V = AutoMovieHumanLoftMesh.position(mesh, id), b: V = AutoMovieHumanLoftMesh.position(mesh, ring[(i + 1) % ring.length]!);
      return sum + a[2] * b[0] - a[0] * b[2];
    }, 0);
    /** Existing ordinary tiler consumes actual complete curves and their shared indices. */
    const band: (a: number[], b: number[]) => void = (a: number[], b: number[]): void => {
      const points: Map<V, number> = new Map();
      const point: (id: number) => V = (id: number): V => { const p: V = AutoMovieHumanLoftMesh.position(mesh, id); points.set(p, id); return p; };
      tessellateAutoMovieContourStrip64(a.map(point), b.map(point), (a: V, b: V, c: V): void => { mesh.indices.push(points.get(a)!, points.get(b)!, points.get(c)!); }, (p: V): string => String(points.get(p)!));
    };
    const lo: number[] = lowerCycle.map(index), hi: number[] = upperCycle.map(index).reverse();
    band(area(lower) * area(lo) > 0 ? Array.from(lower) : Array.from(lower).reverse(), lo);
    band(hi, area(upper) * area(hi) > 0 ? Array.from(upper) : Array.from(upper).reverse());
    return "Local turned floor: complete recorded open arcs with persistent source-edge clocks; physical Y domain only; no auxiliary closing faces";
  }

  /** Replay an accepted F1 contour branch using its exact knots and signed incidence. */
  export function of(name: string): IOutput {
    const data: Recorded | undefined = inputs.find((item: Recorded): boolean => item.name === name);
    if (data === undefined) throw new Error(`No recorded F1 head junction named ${name}`);
    const sections: IAutoMovieContourLoft64.ISection[] = data.sections.map(({ coordinateMm, loops }: Recorded["sections"][number]): IAutoMovieContourLoft64.ISection => ({
      coordinateMm,
      loops: loops.map(({ winding, curve }: (typeof loops)[number]): IAutoMovieContourLoft64.ISection["loops"][number] => ({
        winding: winding === -1 ? -1 : 1,
        curve: {
          type: "cubicBezier", name: curve.name, closed: true, unit: "mm", phaseUnit: "mm", phaseIntervals: curve.phaseIntervals,
          spans: curve.spans.map((span: (typeof curve.spans)[number]): IAutoMovieCurve64.Span => [
            AutoMovieCurveMath64.clone(span[0]!), AutoMovieCurveMath64.clone(span[1]!),
            AutoMovieCurveMath64.clone(span[2]!), AutoMovieCurveMath64.clone(span[3]!),
          ]),
        },
      })),
    }));
    const events: IAutoMovieContourLoft64.IEvent[] = data.events.map((event: Recorded["events"][number]): IAutoMovieContourLoft64.IEvent => {
      const kind: string = event.kind;
      if (kind !== "minimum" && kind !== "maximum" && kind !== "saddle") throw new Error(`Invalid F1 event at ${event.name}`);
      return { ...event, kind, terminal: event.terminal === null ? null : AutoMovieCurveMath64.clone(event.terminal) };
    });
    const positions: number[] = [];
    const indices: number[] = [];
    const vertices: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const rails: Map<string, number[]> = new Map();
    const result: ReturnType<typeof generateAutoMovieContourLoft64> = generateAutoMovieContourLoft64(
      { sections, intervals: data.intervals, events, chordToleranceMm: data.chordToleranceMm },
      {
        vertex: (index: number, point: IAutoMovieCurve64.Vector): void => { vertices.set(point, index); positions.push(point[0], point[1], -point[2]); },
        triangle: (a: number, b: number, c: number): void => { indices.push(a, c, b); },
        construction: (id: string, points: readonly IAutoMovieCurve64.Vector[]): void => {
          const key: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
          const row: (number | undefined)[] = points.map((point: IAutoMovieCurve64.Vector): number | undefined => vertices.get(point));
          if (key !== null && row.every((index: number | undefined): index is number => index !== undefined)) rails.set(`${key[1]}:${key[2]}`, row);
        },
      },
    );
    let keep: readonly Primitive[] | null = null;
    if (name === "forehead exterior") {
      keep = data.intervals.flatMap((interval: Recorded["intervals"][number]): Primitive[] => {
        const group: number = interval.groups.findIndex((item: (typeof interval.groups)[number]): boolean => item.supported && item.before.includes(0) && item.after.includes(0));
        const part: Primitive | undefined = result.primitiveRanges?.find((row: Primitive): boolean =>
          row.kind === "strip" && row.triangleCount > 0 && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group);
        const qualified: boolean = result.stripObservations?.some((row: NonNullable<typeof result.stripObservations>[number]): boolean =>
          row.qualified && row.beforeMm === interval.beforeMm && row.afterMm === interval.afterMm && row.group === group) === true;
        return part === undefined || !qualified ? [] : [part];
      });
      if (keep.length !== data.intervals.length) throw new Error("The recorded F1 forehead is incomplete");
      rails.set("forehead:top", rails.get(`${sections.length - 1}:0`)!);
    } else if (result.unresolved.length !== 0) throw new Error(`The fixed F1 head junction ${name} has unresolved source incidence`);
    if (data.lastExterior !== undefined) {
      const cutoff: number = sections[data.lastExterior - data.first]!.coordinateMm;
      keep = (result.primitiveRanges ?? []).filter((range: Primitive): boolean =>
        range.beforeMm < cutoff || !data.intervals.find((interval: Recorded["intervals"][number]): boolean => interval.beforeMm === range.beforeMm)?.groups[range.group]?.before.includes(0));
    }
    if (name === "mouth aperture") {
      rails.set("mouth:first", rails.get("0:0")!);
      rails.set("mouth:last", rails.get(`${sections.length - 1}:0`)!);
    }
    const faces: number[] = keep === null ? indices : keep.flatMap((range: Primitive): number[] =>
      indices.slice(3 * range.firstTriangle, 3 * (range.firstTriangle + range.triangleCount)));
    return { mesh: { positions, indices: faces }, rails };
  }
}
