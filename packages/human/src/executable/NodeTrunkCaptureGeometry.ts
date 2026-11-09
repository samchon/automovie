import { AutoMovieMeshExtract, AutoMovieViewAxis, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkF1Section } from "../generation/trunk/AutoMovieHumanTrunkF1Section";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";

type V3 = CaptureModel.Vec3;
type V2 = [number, number];
type Spec = AutoMovieHumanArmCurveSpec.ICurveSpec;

/** Shared geometry and capture settings for the original F1 trunk. */
export namespace NodeTrunkCaptureGeometry {
  /** Height of the level loop whose centroid the course's middle passes, mm (her mid trunk, the probe of the earlier study). */
  export const MID: number = 1100;

  /** Cut spacing along the course, mm (her cuts every 2 mm), and layer spacing, mm (S00's 6 mm gap). */
  export const STEP: { cut: number; layer: number } = { cut: 2, layer: 6 };

  /** Station spacing of the drawn original lines, mm: display samples of the engine evaluator, the capture's own `CaptureSpecs.STEP`. */
  export const DRAW: number = CaptureSpecs.STEP;

  /** Section order and ring samples: S00's (`AutoMovieHumanTrunkS00.of`: order 64, 160 samples). */
  export const LOFT: { order: number; samples: number } = { order: 64, samples: 160 };

  /** Project a world vector onto an arm-plane direction, or compare their orientation. */
  export function armDot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Largest measured vertex-to-segment deviation between two physical port polygons. */
  export function armBoundaryGap(from: readonly V2[], to: readonly V2[]): number {
    let gap: number = 0;
    for (const [x, y] of from) {
      let distance: number = Infinity;
      for (let i: number = 0; i < to.length; ++i) {
        const [a, b]: V2 = to[i]!;
        const [c, d]: V2 = to[(i + 1) % to.length]!;
        const dx: number = c - a;
        const dy: number = d - b;
        const square: number = dx * dx + dy * dy;
        const t: number = square === 0 ? 0 : Math.max(0, Math.min(1, ((x - a) * dx + (y - b) * dy) / square));
        distance = Math.min(distance, Math.hypot(x - a - t * dx, y - b - t * dy));
      }
      gap = Math.max(gap, distance);
    }
    return gap;
  }

  /** Census the actual triangle indices and separately identify exact coincident free edges. */
  export function indexedTrunkReceipt(clay: CaptureModel.ITriangles): string[] {
    const parents: Int32Array = Int32Array.from({ length: clay.positions.length / 3 }, (_: unknown, i: number): number => i);
    const root = (vertex: number): number => {
      while (parents[vertex] !== vertex) {
        parents[vertex] = parents[parents[vertex]!]!;
        vertex = parents[vertex]!;
      }
      return vertex;
    };
    const incidence: Map<string, { a: number; b: number; uses: number }> = new Map();
    for (let i: number = 0; i + 2 < clay.indices.length; i += 3) {
      const owner: number = root(clay.indices[i]!);
      parents[root(clay.indices[i + 1]!)] = owner;
      parents[root(clay.indices[i + 2]!)] = owner;
      for (let j: number = 0; j < 3; ++j) {
        const a: number = clay.indices[i + j]!;
        const b: number = clay.indices[i + ((j + 1) % 3)]!;
        const key: string = a < b ? `${a},${b}` : `${b},${a}`;
        const edge = incidence.get(key);
        if (edge === undefined) incidence.set(key, { a, b, uses: 1 });
        else ++edge.uses;
      }
    }
    const components: Map<number, { low: number; high: number; free: number; multiple: number }> = new Map();
    for (const index of new Set(clay.indices)) {
      const owner: number = root(index);
      const y: number = clay.positions[3 * index + 1]!;
      const component = components.get(owner) ?? { low: y, high: y, free: 0, multiple: 0 };
      component.low = Math.min(component.low, y);
      component.high = Math.max(component.high, y);
      components.set(owner, component);
    }
    const point = (index: number): string => clay.positions.slice(3 * index, 3 * index + 3).join(",");
    const physicalFree: Set<string> = new Set();
    let coincident: number = 0;
    let free: number = 0;
    let multiple: number = 0;
    for (const { a, b, uses } of incidence.values()) {
      const component = components.get(root(a))!;
      if (uses === 1) {
        ++free;
        ++component.free;
        const start: string = point(a);
        const end: string = point(b);
        const key: string = start < end ? `${start}:${end}` : `${end}:${start}`;
        if (physicalFree.has(key)) ++coincident;
        physicalFree.add(key);
      } else if (uses > 2) {
        ++multiple;
        ++component.multiple;
      }
    }
    return [
      `indexed skin: ${components.size} components, ${free} free edges, ${multiple} multiple edges, ${coincident} additional free edges coincident by exact position`,
      ...Array.from(components.values()).sort((a, b): number => a.low - b.low).map(({ low, high, free, multiple }): string =>
        `indexed component ${low.toFixed(3)} to ${high.toFixed(3)} mm: ${free} free edges, ${multiple} multiple edges`),
    ];
  }

  /** Keep the world's positive horizontal phase order without changing any point. */
  export const increasingPhase: typeof AutoMovieHumanTrunkF1Section.increasingPhase = AutoMovieHumanTrunkF1Section.increasingPhase;

  /** Sum the directed uses of this exact boundary's consecutive edges. */
  export const edgeSense: typeof AutoMovieHumanTrunkF1Section.edgeSense = AutoMovieHumanTrunkF1Section.edgeSense;

  /** Select the source trunk triangles by median connectivity inside a height slab. */
  export function medianReference(mesh: AutoMovieMeshExtract.IMesh, [from, to]: [number, number], midZ: number): CaptureModel.ITriangles {
    // Match the reference crop's existing 15 mm margin.
    const low: number = from - 15;
    const high: number = to + 15;
    const positions: number[] = mesh.positions as number[];
    const y = (vertex: number): number => positions[3 * vertex + 1]!;
    const z = (vertex: number): number => positions[3 * vertex + 2]!;
    const parent: Int32Array = Int32Array.from({ length: positions.length / 3 }, (_: unknown, i: number): number => i);
    const root = (vertex: number): number => {
      while (parent[vertex] !== vertex) {
        parent[vertex] = parent[parent[vertex]!]!;
        vertex = parent[vertex]!;
      }
      return vertex;
    };
    const slab: number[] = [];
    const seeds: number[] = [];
    const tolerance: number = AutoMovieHumanF1Trace.TOLERANCE;
    for (let i: number = 0; i + 2 < mesh.indices.length; i += 3) {
      const a: number = mesh.indices[i]!;
      const b: number = mesh.indices[i + 1]!;
      const c: number = mesh.indices[i + 2]!;
      if (Math.max(y(a), y(b), y(c)) < low || Math.min(y(a), y(b), y(c)) > high) continue;
      slab.push(a, b, c);
      const owner: number = root(a);
      parent[root(b)] = owner;
      parent[root(c)] = owner;
      if (Math.min(z(a), z(b), z(c)) <= midZ + tolerance && Math.max(z(a), z(b), z(c)) >= midZ - tolerance) seeds.push(a);
    }
    const median: Set<number> = new Set(seeds.map(root));
    const indices: number[] = [];
    for (let i: number = 0; i < slab.length; i += 3)
      if (median.has(root(slab[i]!))) indices.push(slab[i]!, slab[i + 1]!, slab[i + 2]!);
    if (indices.length === 0) throw new Error("trunk: no raw surface touches the median inside the capture slab");
    console.log(`trunk reference: ${indices.length / 3} original median skin triangles of ${slab.length / 3} slab triangles, ${median.size} components`);
    return { positions, indices };
  }

  /**
   * One domain's original lines on its own course frames, as display samples
   * of the engine evaluator the loft reads (every {@link DRAW} mm of station
   * over the domain): each guide at its chart point (its extent and touch
   * offset) and each split at its chart point, placed at `origin + a u + b v`.
   * A sampled polyline is written as a Bezier chain of straight spans
   * (handles at the thirds), so the capture draws exactly these samples. The
   * part's outlines are the ones its loft admitted, so an evaluator refusal
   * breaks that premise and throws with its name.
   */
  export function drawn(part: IAutoMovieViewPart, axis: AutoMovieViewAxis.IAxis, range: [number, number], prefix: string): Spec[] {
    const read = (outline: IAutoMovieViewPart.IOutline, name: string): ((s: number) => number) => {
      const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
      if ("contract" in prepared) throw new Error(`trunk: the outline evaluator refuses ${name}: ${prepared.contract}: ${prepared.detail}`);
      return (s: number): number => {
        const v: number | string = AutoMovieViewOutline.value(prepared, s);
        if (typeof v === "string") throw new Error(`trunk: ${name} at ${s} mm: ${v}`);
        return v;
      };
    };
    if (part.fullness.kind !== "top") throw new Error(`trunk: ${part.name} is not a top part`);
    const touch: ((s: number) => number)[] = part.fullness.touch?.map((o: IAutoMovieViewPart.IOutline, q: number): ((s: number) => number) => read(o, `touch${q}`)) ?? Array.from({ length: 4 }, (): (() => number) => (): number => 0);
    const pu: (s: number) => number = read(part.front.positive, "+u");
    const nu: (s: number) => number = read(part.front.negative, "-u");
    const pv: (s: number) => number = read(part.side.positive, "+v");
    const nv: (s: number) => number = read(part.side.negative, "-v");
    const guides: ((s: number) => [number, number])[] = [(s: number): [number, number] => [pu(s), touch[0]!(s)], (s: number): [number, number] => [touch[1]!(s), pv(s)], (s: number): [number, number] => [nu(s), touch[2]!(s)], (s: number): [number, number] => [touch[3]!(s), nv(s)]];
    const splits: ((s: number) => [number, number])[] = (part.fullness.pieces?.flat() ?? part.fullness.splits ?? []).map((split: IAutoMovieViewPart.ISplit, q: number): ((s: number) => [number, number]) => {
      const u: (s: number) => number = read(split.u, `split${q}.u`);
      const v: (s: number) => number = read(split.v, `split${q}.v`);
      return (s: number): [number, number] => [u(s), v(s)];
    });
    const stations: number[] = span(range[0], range[1], DRAW);
    const place = (s: number, [a, b]: [number, number]): V3 => {
      const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(s);
      return [f.origin[0]! + a * f.u[0]! + b * f.v[0]!, f.origin[1]! + a * f.u[1]! + b * f.v[1]!, f.origin[2]! + a * f.u[2]! + b * f.v[2]!];
    };
    const line = (name: string, points: V3[]): Spec => wire(name, points, `Engine outline samples every ${DRAW} mm on the course's own frames`);
    const names: string[] = ["anterior", "right", "posterior", "left"];
    return [
      ...guides.map((g: (s: number) => [number, number], k: number): Spec => line(`${prefix}.${names[k]}`, stations.map((s: number): V3 => place(s, g(s))))),
      ...splits.map((g: (s: number) => [number, number], q: number): Spec => line(`${prefix}.split${q}`, stations.map((s: number): V3 => place(s, g(s))))),
    ];
  }

  /** Draw the supplied coordinates with straight Bezier spans. */
  export function wire(name: string, points: V3[], rule: string): Spec {
    const chain: V3[] = [points[0]!];
    for (let i: number = 1; i < points.length; ++i) {
      const a: V3 = points[i - 1]!;
      const b: V3 = points[i]!;
      chain.push(add(a, scale(sub(b, a), 1 / 3)), add(a, scale(sub(b, a), 2 / 3)), b);
    }
    return { name, frame: "world", datums: [], constraints: [], representation: { kind: "bezier", points: chain, closed: false, handleRule: rule }, aids: [], consumers: ["trunk loft"] };
  }

  /** Stations from a to b every step, b included. */
  export function span(a: number, b: number, step: number): number[] {
    const out: number[] = [];
    for (let s: number = a; s < b - 1e-9; s += step) out.push(Number(s.toFixed(6)));
    out.push(b);
    return out;
  }

  /** The angle between two directions, radians. */
  export function angle(a: V3, b: V3): number {
    return Math.atan2(Math.hypot(...cross(a, b)), a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
  }

  /** a + b. */
  export function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** a - b. */
  export function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** a s. */
  export function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** a x b. */
  export function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
}
