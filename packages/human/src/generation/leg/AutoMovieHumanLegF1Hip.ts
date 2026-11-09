import { AutoMovieCurveMath64 as M, triangulateAutoMovieRegion } from "@automovie/engine";

import { AutoMovieHumanLoftMesh as Mesh } from "../../lofting/AutoMovieHumanLoftMesh";
import type { AutoMovieHumanF1Fork } from "../trunk/AutoMovieHumanF1Fork";
import { AutoMovieHumanLegF1Lines as Lines } from "./AutoMovieHumanLegF1Lines";
import { AutoMovieHumanLegF1World as World } from "./AutoMovieHumanLegF1World";
import native from "./AutoMovieHumanLegF1Native.json";

type V3 = M.V;
type Context = Mesh.IContext;
type Row = { station: number; ids: number[]; ends: [number, number] };
type Point = { id: number; x: number; y: number };

/**
 * F1's original open proximal sections, in absolute ISB world millimetres.
 * Their ends run on the measured nonparallel s136 rim. They are not closed
 * horizontal sections: closing each chord would fill the thigh's cut plane.
 */
export namespace AutoMovieHumanLegF1Hip {
  /**
   * Loft all 47 observed open curves to the same exact fork and s136 rails.
   * Source curve coordinates remain unchanged; only triangles are generated.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses ordered original section curves and the measured exit boundary, with the original fork collar retained.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses a missing boundary correspondence or inconsistent oriented sheet instead of moving a port or importing source triangles.
   */
  export function attach(mesh: Context, side: "left" | "right", fork: AutoMovieHumanF1Fork.IResult): void {
    const source = native.patches.find(piece => piece.name === `leg.${side}.hip.native`);
    if (source?.info.entry === undefined || source.info.exit === undefined || source.info.start === undefined)
      throw new Error("The measured F1 proximal surface has no original boundary curves");
    const { frame, entry, arcs } = Lines.fixedHip(side);
    const boundary: number[] = Mesh.vertices(mesh, World.forkClock(fork[side], frame));
    const start: number[] = Mesh.vertices(mesh, World.forkClock(entry, frame));
    World.fixedCollar(boundary, start, arcs, mesh.positions, mesh.indices);
    const axes: V3[] = source.frame.axes.map(M.clone);
    const n: V3 = axes[0]!;
    const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const at = (id: number): V3 => Mesh.position(mesh, id);
    // The two authored views retain the same 98 source knots but start at
    // different phases. Match this declared boundary, never global vertices.
    const regular: V3[] = source.info.exit.map((_, i: number): V3 => at(i));
    const firstExit: V3 = M.clone(source.info.exit[0]!);
    const starts: number[] = regular.flatMap((p: V3, i: number): number[] =>
      p.every((value: number, axis: number): boolean => value === firstExit[axis]) ? [i] : []);
    if (starts.length !== 1 || new Set(regular.map((p: V3): string => p.join(","))).size !== regular.length)
      throw new Error("The regular F1 s136 boundary has no unique original source start");
    const exit: number[] = source.info.exit.map((_, i: number): number => (starts[0]! + i) % regular.length);
    const points: V3[] = exit.map(at);
    if (source.info.exit.some((p, i): boolean => p.some((value: number, axis: number): boolean => value !== points[i]![axis])))
      throw new Error("The regular F1 thigh does not retain the full exact oriented s136 source cycle");
    const distances: number[] = [0];
    for (const [i, p] of points.entries())
      distances.push(distances[i]! + Math.hypot(...M.sub(points[(i + 1) % points.length]!, p)));
    const perimeter: number = distances.at(-1)!;
    const insertions: Map<number, { t: number; id: number }[]> = new Map();
    const ends: { id: number; arc: number }[] = [];
    const endpoint = (p: V3): { id: number; arc: number } => {
      let best: { edge: number; t: number; distance: number } | undefined;
      for (let i: number = 0; i < points.length; ++i) {
        const a: V3 = points[i]!, d: V3 = M.sub(points[(i + 1) % points.length]!, a);
        const length: number = dot(d, d);
        const t: number = length === 0 ? 0 : Math.max(0, Math.min(1, dot(M.sub(p, a), d) / length));
        const distance: number = Math.hypot(...M.sub(p, M.add(a, M.scale(d, t))));
        if (best === undefined || distance < best.distance) best = { edge: i, t, distance };
      }
      if (best === undefined || best.distance > 1e-8)
        throw new Error("An original open F1 curve does not end on its measured s136 boundary");
      const { edge, t } = best;
      const a: number = exit[edge]!, b: number = exit[(edge + 1) % exit.length]!;
      // These equalities identify floating-point copies of the same source
      // vertex; they never change a geometrically distinct observed point.
      let id: number;
      if (t === 0) id = a;
      else if (t === 1) id = b;
      else {
        id = Mesh.vertices(mesh, [p])[0]!;
        const list = insertions.get(edge) ?? [];
        list.push({ id, t });
        insertions.set(edge, list);
      }
      const result = { id, arc: distances[edge]! + t * (distances[edge + 1]! - distances[edge]!) };
      ends.push(result);
      return result;
    };
    const rows: Row[] = source.rows.map(({ station, loops }): Row => {
      if (loops.length !== 1 || loops[0]!.closed) throw new Error("The original F1 hip ribbon is not one open curve");
      const raw: V3[] = loops[0]!.points.map(([a, b]): V3 => [
        n[0] * station + axes[1]![0] * a! + axes[2]![0] * b!,
        n[1] * station + axes[1]![1] * a! + axes[2]![1] * b!,
        n[2] * station + axes[1]![2] * a! + axes[2]![2] * b!,
      ]);
      const first = endpoint(raw[0]!), last = endpoint(raw.at(-1)!);
      return { station, ids: [first.id, ...Mesh.vertices(mesh, raw.slice(1, -1)), last.id], ends: [first.arc, last.arc] };
    });
    splitExit(mesh, exit, insertions);
    const exitSamples: { id: number; arc: number }[] = [
      ...exit.map((id: number, i: number) => ({ id, arc: distances[i]! })), ...ends,
    ].sort((a, b): number => a.arc - b.arc).filter((item, i, list): boolean => i === 0 || item.id !== list[i - 1]!.id);
    const walk = (from: number, to: number, direction: 1 | -1): number[] => {
      let distance: number = direction * (to - from);
      while (distance < 0) distance += perimeter;
      const list = exitSamples.map(item => {
        let delta: number = direction * (item.arc - from);
        while (delta < -1e-9) delta += perimeter;
        return { ...item, delta };
      }).filter(item => item.delta > 1e-9 && item.delta < distance - 1e-9)
        .sort((a, b): number => a.delta - b.delta);
      return list.map(item => item.id);
    };
    for (let i: number = 1; i < rows.length; ++i)
      for (const end of [0, 1] as const) {
        let delta: number = rows[i]!.ends[end] - rows[i - 1]!.ends[end];
        if (delta > perimeter / 2) delta -= perimeter;
        if (delta < -perimeter / 2) delta += perimeter;
        if ((end === 0 ? delta : -delta) <= 0) throw new Error("The measured F1 exit rails reverse their physical order");
      }
    const pending: number[] = [];
    const first: Row = rows[0]!;
    const initial: number[] = [...first.ids, ...walk(first.ends[1], first.ends[0], 1)];
    const initialPoints: V3[] = initial.map(at);
    const initialIds: Map<V3, number> = new Map(initialPoints.map((point, i): [V3, number] => [point, initial[i]!]));
    World.stitchRows(start, World.forkClock(initialPoints, frame).map(point => initialIds.get(point)!), mesh.positions, pending, "length");
    const chart = (row: Row): Point[] => {
      let length: number = 0;
      const values: number[] = [0];
      for (let i: number = 1; i < row.ids.length; ++i) {
        length += Math.hypot(...M.sub(at(row.ids[i]!), at(row.ids[i - 1]!)));
        values.push(length);
      }
      return row.ids.map((id: number, i: number): Point => ({ id, x: values[i]! / length, y: row.station / 1000 }));
    };
    for (let i: number = 1; i < rows.length; ++i) {
      const a: Row = rows[i - 1]!, b: Row = rows[i]!;
      const rail = (ids: number[], x: number): Point[] => ids.map((id: number): Point => ({ id, x, y: dot(at(id), n) / 1000 }));
      polygon([
        ...chart(a), ...rail(walk(a.ends[1], b.ends[1], -1), 1),
        ...chart(b).reverse(), ...rail(walk(b.ends[0], a.ends[0], -1), 0),
      ], pending);
    }
    const last: Row = rows.at(-1)!;
    const closing: number[] = walk(last.ends[1], last.ends[0], -1);
    const capLength: number = closing.reduce((length: number, id: number, i: number): number =>
      length + Math.hypot(...M.sub(at(id), at(i === 0 ? last.ids.at(-1)! : closing[i - 1]!))), 0)
      + Math.hypot(...M.sub(at(last.ids[0]!), at(closing.length === 0 ? last.ids.at(-1)! : closing.at(-1)!)));
    let progress: number = 0;
    const cap: Point[] = closing.map((id: number, i: number): Point => {
      progress += Math.hypot(...M.sub(at(id), at(i === 0 ? last.ids.at(-1)! : closing[i - 1]!)));
      return { id, x: 1 - progress / capLength, y: dot(at(id), n) / 1000 };
    });
    polygon([...chart(last), ...cap], pending);
    orient(mesh.indices, pending);
    mesh.indices.push(...pending);
  }

  /** Triangulate one physical ribbon's parameter domain without adding a 3D point. */
  function polygon(raw: Point[], indices: number[]): void {
    const points: Point[] = raw.filter((p, i): boolean => p.id !== raw[(i + raw.length - 1) % raw.length]!.id);
    const result = triangulateAutoMovieRegion({ outer: points.map(({ x, y }) => ({ x, y })) });
    for (const index of result.triangles) indices.push(points[result.sourceIndices[index]!]!.id);
  }

  /** Split only the existing s136 boundary triangles at exact measured rail endpoints. */
  function splitExit(mesh: Context, exit: number[], insertions: Map<number, { id: number; t: number }[]>): void {
    for (const [edge, values] of insertions) {
      const a: number = exit[edge]!, b: number = exit[(edge + 1) % exit.length]!;
      const row: number[] = [a, ...values.sort((x, y): number => x.t - y.t).map(({ id }) => id), b];
      let found: boolean = false;
      for (let i: number = 0; i < mesh.indices.length; i += 3)
        for (let j: number = 0; j < 3; ++j) {
          const p: number = mesh.indices[i + j]!, q: number = mesh.indices[i + (j + 1) % 3]!;
          if (!((p === a && q === b) || (p === b && q === a))) continue;
          if (found) throw new Error("The original F1 s136 boundary is not free");
          found = true;
          const c: number = mesh.indices[i + (j + 2) % 3]!;
          const ordered: number[] = p === a ? row : row.slice().reverse();
          const triangles: number[] = [];
          for (let k: number = 1; k < ordered.length; ++k) triangles.push(ordered[k - 1]!, ordered[k]!, c);
          mesh.indices.splice(i, 3, ...triangles);
          i += triangles.length - 3;
          break;
        }
      if (!found) throw new Error("An exact F1 exit rail has no existing regular-thigh boundary edge");
    }
  }

  /** Orient the new measured sheet by reciprocal index ownership at its retained rails. */
  function orient(existing: readonly number[], pending: number[]): void {
    const edge = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const outside: Map<string, number> = new Map();
    for (let i: number = 0; i < existing.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = existing[i + j]!, b: number = existing[i + (j + 1) % 3]!;
        const k: string = edge(a, b);
        outside.set(k, (outside.get(k) ?? 0) + (a < b ? 1 : -1));
      }
    const uses: Map<string, { face: number; direction: number }[]> = new Map();
    for (let i: number = 0; i < pending.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = pending[i + j]!, b: number = pending[i + (j + 1) % 3]!;
        const k: string = edge(a, b), list = uses.get(k) ?? [];
        list.push({ face: i / 3, direction: a < b ? 1 : -1 });
        uses.set(k, list);
      }
    const signs: Map<number, number> = new Map();
    const queue: number[] = [];
    const admit = (face: number, sign: number): void => {
      const old: number | undefined = signs.get(face);
      if (old !== undefined && old !== sign) throw new Error("The measured F1 ribbon has inconsistent oriented boundary ownership");
      if (old === undefined) { signs.set(face, sign); queue.push(face); }
    };
    for (const [k, list] of uses) {
      if (list.length > 2) throw new Error("The measured F1 ribbon repeats a physical edge");
      if (list.length === 1) {
        const direction: number = outside.get(k) ?? 0;
        if (Math.abs(direction) !== 1) throw new Error("The measured F1 ribbon leaves an unmatched boundary");
        admit(list[0]!.face, -direction * list[0]!.direction);
      }
    }
    for (let q: number = 0; q < queue.length; ++q) {
      const face: number = queue[q]!, sign: number = signs.get(face)!;
      for (let j: number = 0; j < 3; ++j) {
        const a: number = pending[3 * face + j]!, b: number = pending[3 * face + (j + 1) % 3]!;
        const list = uses.get(edge(a, b))!;
        if (list.length !== 2) continue;
        const mine = list.find(item => item.face === face)!, other = list.find(item => item.face !== face)!;
        admit(other.face, -sign * mine.direction * other.direction);
      }
    }
    if (signs.size !== pending.length / 3) throw new Error("A measured F1 ribbon is detached from both retained rails");
    for (const [face, sign] of signs)
      if (sign < 0) [pending[3 * face + 1], pending[3 * face + 2]] = [pending[3 * face + 2]!, pending[3 * face + 1]!];
  }
}

