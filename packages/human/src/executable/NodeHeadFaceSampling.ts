import { AutoMovieLoftChain, AutoMovieMeshExtract, type IAutoMovieLoftChain } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeHeadOrbit } from "./NodeHeadOrbit";
import { NodeHeadTrace } from "./NodeHeadTrace";

type V2 = [number, number];
type V3 = [number, number, number];
type Row = { start: number; count: number; y: number };
const phase72: number[] = Array.from({ length: 72 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 72);
const phase512: number[] = Array.from({ length: 512 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 512);

/** Tessellate the same measured face curves without changing their assembled rim vertices. */
export namespace NodeHeadFaceSampling {
  /** Retain both old rows at each end and replace only the interior triangles of each owned face chain. */
  export function refine(capture: CaptureModel.IPart, mesh: AutoMovieMeshExtract.IMesh, chains: readonly IAutoMovieLoftChain[]): void {
    if (capture.loft.status !== "available") return;
    const old: CaptureModel.ITriangles = capture.loft.clay;
    const points: number[] = old.positions.slice();
    const added: number[] = [];
    const replaced: [number, number][] = [];
    const source: CaptureModel.ITriangles = NodeHeadOrbit.skin(mesh);
    for (const chain of chains.filter((item: IAutoMovieLoftChain): boolean => (item.name ?? "").startsWith("head.face"))) {
      const stations: number[] = CaptureSpecs.steps(chain.layers[0]!.y, chain.layers.at(-1)!.y, 1.5);
      if (stations.length < 5) continue;
      const name: string = chain.name!;
      try {
        const boundary: number = oldRow(old.positions, chain, stations[0]!);
        const from: Row = { start: boundary + 72, count: 72, y: stations[1]! };
        const to: Row = { start: boundary + (stations.length - 2) * 72, count: 72, y: stations.at(-2)! };
        if (oldRow(old.positions, chain, from.y) !== from.start || oldRow(old.positions, chain, to.y) !== to.start)
          throw new Error("the retained face rims do not share the original grid");
        const local: number[] = [];
        const existing: number[] = chain.layers.map((layer: IAutoMovieLoftChain.ILayer): number => layer.y)
          .filter((y: number): boolean => y - from.y > 1e-8 && to.y - y > 1e-8);
        const knots: number[] = [from.y, ...existing, to.y];
        const sample: number[] = knots.slice(1).flatMap((y: number, i: number): number[] => CaptureSpecs.steps(knots[i]!, y, 1.5).slice(0, -1)).slice(1);
        const rows: Row[] = [from, ...sample.map((y: number): Row => {
          const start: number = (points.length + local.length) / 3;
          for (const p of AutoMovieLoftChain.ring(chain, y, phase512)) local.push(p[0]!, p[1]!, p[2]!);
          return { start, count: 512, y };
        }), to];
        const faces: number[] = rows.slice(1).flatMap((row: Row, i: number): number[] => strip(rows[i]!, row));
        // The joins locate these unchanged point triples by index and retain
        // the original first/second and penultimate/last rows.
        const start: number = from.start;
        const end: number = to.start + to.count;
        const previous: number[] = [];
        for (let i: number = 0; i < old.indices.length; i += 3) {
          const tri: number[] = old.indices.slice(i, i + 3);
          if (inside(tri, start, end)) previous.push(...tri);
        }
        if (previous.length !== (stations.length - 3) * 72 * 6) throw new Error("the replaced triangles do not belong to one sampled face grid");
        for (const row of [from, to]) {
          const rim: number[] = Array.from({ length: row.count }, (_: unknown, i: number): number => row.start + i);
          const direction: number = NodeHeadTrace.railDirection(previous, rim);
          if (direction === 0 || NodeHeadTrace.railDirection(faces, rim) !== direction) throw new Error("the new sampling changed a retained rim's indexed direction");
        }
        const checked: number[] = [0.25, 0.5, 0.75].map((f: number): number => from.y + f * (to.y - from.y));
        const before: string = residual(source, { positions: old.positions, indices: previous }, checked);
        const after: string = residual(source, { positions: points.concat(local), indices: faces }, checked);
        for (const coordinate of local) points.push(coordinate);
        for (const id of faces) added.push(id);
        replaced.push([start, end]);
        note(capture, `${name} actual phase sampling: ${rows.length - 2} interior rows at 512 phases; original 72-point first/second and penultimate/last rows retained; 3 native midplanes before ${before}, after ${after}`);
      } catch (error) {
        note(capture, `${name} face sampling refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    if (replaced.length === 0) return;
    const retained: number[] = [];
    for (let i: number = 0; i < old.indices.length; i += 3) {
      const tri: number[] = old.indices.slice(i, i + 3);
      if (!replaced.some(([a, b]): boolean => inside(tri, a, b))) retained.push(...tri);
    }
    capture.loft.clay = { positions: points, indices: retained.concat(added) };
  }

  function oldRow(positions: readonly number[], chain: IAutoMovieLoftChain, y: number): number {
    const row: number[] = AutoMovieLoftChain.ring(chain, y, phase72).flatMap((p: readonly number[]): number[] => [p[0]!, p[1]!, p[2]!]);
    for (let i: number = 0; i + row.length <= positions.length; i += 3)
      if (positions[i] === row[0] && positions[i + 1] === row[1] && positions[i + 2] === row[2] && row.every((p: number, k: number): boolean => positions[i + k] === p)) return i / 3;
    throw new Error("the original sampled face row is unavailable");
  }

  /** Advance along matching phase order, including the one periodic closing interval. */
  function strip(a: Row, b: Row): number[] {
    const out: number[] = [];
    let i: number = 0;
    let j: number = 0;
    while (i < a.count || j < b.count) {
      const lo: number = a.start + i % a.count;
      const hi: number = b.start + j % b.count;
      if (j === b.count || (i + 1) * b.count < (j + 1) * a.count) out.push(lo, hi, a.start + ++i % a.count);
      else out.push(lo, hi, b.start + ++j % b.count);
    }
    return out;
  }

  function inside(triangle: readonly number[], from: number, to: number): boolean {
    return triangle.every((i: number): boolean => i >= from && i < to);
  }

  function residual(original: AutoMovieMeshExtract.IMesh, clay: CaptureModel.ITriangles, stations: readonly number[]): string {
    const frame: AutoMovieMeshExtract.IFrame = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
    const read = (mesh: AutoMovieMeshExtract.IMesh): (V2[] | undefined)[] =>
      AutoMovieMeshExtract.outline(mesh, frame, stations, 1, 0.5, 0).map((cut: AutoMovieMeshExtract.ISection): V2[] | undefined =>
        cut.loops.find((loop: AutoMovieMeshExtract.ILoop): boolean => loop.closed && loop.points.some(([, x]: V2): boolean => x < -60))?.points);
    const source = read(original);
    const built = read(clay);
    return source.map((loop, i: number): string => {
      const other: V2[] | undefined = built[i];
      if (loop === undefined || other === undefined) return "unreadable";
      const distance: number = Math.sqrt(Math.max(NodeHeadTrace.directed(loop, other), NodeHeadTrace.directed(other, loop)));
      const spread = (ring: V2[], dimension: 0 | 1, sign: 1 | -1): number => Math.max(...ring.map((p: V2): number => p[dimension] * sign));
      const supports: number[] = ([0, 1] as const).flatMap(dimension => ([1, -1] as const).map(sign =>
        Math.abs(spread(loop, dimension, sign) - spread(other, dimension, sign)),
      ));
      return `${distance.toFixed(3)} mm (four-support max ${Math.max(...supports).toFixed(3)} mm)`;
    }).join("/");
  }

  function note(part: CaptureModel.IPart, value: string): void {
    part.diagnostics.push(value);
    if (part.loft.status === "available") part.loft.diagnostics.push(value);
    console.log(value);
  }
}
