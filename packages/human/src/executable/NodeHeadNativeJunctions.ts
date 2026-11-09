import fs from "node:fs";
import type { AutoMovieMeshCourse, AutoMovieMeshExtract, IAutoMovieLoftChain } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeHeadJunction } from "./NodeHeadJunction";
import { NodeHeadTrace } from "./NodeHeadTrace";

type Patch = NodeHeadJunction.IResult;
type Link = { groups: [number[], number[]][] };
type V3 = [number, number, number];
type Edge = { a: number; b: number; uses: number };
type Clip = (points: number[], faces: readonly number[], plane: AutoMovieMeshCourse.IPlane, sign: 1 | -1) => number[];
type Connect = (before: readonly number[], after: readonly number[], a: number[], b: number[], point: (id: number) => V3) => number[];
type ArchivedJoin = NodeHeadJunction.ILayout & { seams: { chain: string; end: "top" | "bottom"; rail: string }[]; replace?: string };

/** Repair exposed head cuts using the same indexed source contours on both sides. */
export namespace NodeHeadNativeJunctions {
  /** Continue the oral wall to the recorded lower branches and the upper terminal. */
  export function oralWall(archive: string, mesh: AutoMovieMeshExtract.IMesh, mouth: Patch): Patch {
    const links: Link[] = (JSON.parse(fs.readFileSync(HumanNodePaths.resolve(`${archive}/links.json`), "utf8")) as { intervals: Link[] }).intervals;
    const first: number = 336;
    const lower: number[][] = [[1]];
    // Follow only the observed cavity's ancestors. The exterior and its openings
    // remain in the existing mouth patch, with the same source edge indices.
    for (let row: number = 420; row >= first; --row)
      lower.unshift(links[row]!.groups.filter(([, after]): boolean => after.some((id: number): boolean => lower[0]!.includes(id)))
        .flatMap(([before]): number[] => before).sort((a: number, b: number): number => a - b));
    const below: Patch = NodeHeadJunction.create(archive, {
      name: "lower original oral wall", file: "sections/head/002.json", first, ordinals: lower,
      events: ["critical.104", "critical.107", "critical.112", "critical.114", "critical.115", "critical.116", "critical.117"],
    }, mesh);
    const above: Patch = NodeHeadJunction.create(archive, {
      name: "upper original oral wall", file: ["sections/head/003.json", "sections/head/004.json"], first: 633,
      ordinals: Array.from({ length: 316 }, (): number[] => [1]).concat([[]]), events: ["critical.410"],
    }, mesh);
    return append(append(mouth, below, "0:1", `${lower.length - 1}:0`), above, "212:1", "0:0");
  }

  /** Follow both signed nasal saddles and the three original inner wall terminals. */
  const NOSE: NodeHeadJunction.ILayout = {
      name: "original nostril saddles", file: "sections/head/004.json", first: 944, lastExterior: 947,
      ordinals: [[0], [0, 2], [0, 2], [0, 2, 3], [0, 2, 3], [0, 1, 2], [0, 1, 2], [0, 1, 2],
        [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2], [0, 1, 2], [0, 1], [0, 1], [0]],
      events: ["critical.408", "critical.409", "critical.411", "critical.412", "critical.413", "critical.414"],
  };

  /** The original shared face ring and the regular left earlobe birth. */
  export const ARCHIVED: ArchivedJoin[] = [
    { name: "original shared lower face rail", file: "sections/head/004.json", first: 881, ordinals: [[0], [0], [0]], events: [], seams: [
      { chain: "head.face.1525.8068084716797.0", end: "top", rail: "0:0" }, { chain: "head.face-linked.882", end: "bottom", rail: "2:0" },
    ] },
    { name: "original left ear terminal", file: "sections/head/004.json", first: 923, ordinals: [[], [2], [2]], events: ["critical.398"], seams: [
      { chain: "head.left-lobe", end: "bottom", rail: "2:0" },
    ] },
    { ...NOSE, replace: "head.face-linked.945", seams: [
      { chain: "head.face-linked.936", end: "top", rail: "0:0" }, { chain: "head.face-linked.947", end: "bottom", rail: "3:0" },
    ] },
  ];

  /** Continue only the forehead branch whose source traverses the change of signed winding. */
  export function eyelid(forehead: Patch, native: CaptureModel.ITriangles, clip: Clip, connect: Connect): Patch {
    const original: number[] | undefined = forehead.rails.get("70:1");
    if (original === undefined || NodeHeadTrace.railDirection(forehead.clay.indices, original) === 0)
      throw new Error("the recorded forehead saddle does not expose its daughter rail");
    // Use the next observed plane after the split and the actual upper extremum.
    // The intervening source skin passes the winding change without a synthetic cap.
    const patch: Patch = terminal(native, clip, 1598.7934875488281, 1600.105972290039,
      [106.34899139404297, 1600.1057434082031, 37.7602744102478], "bottom", "native upper eyelid branch");
    const offset: number = forehead.clay.positions.length / 3;
    const positions: number[] = forehead.clay.positions.concat(patch.clay.positions);
    const point = (id: number): V3 => [positions[id * 3]!, positions[id * 3 + 1]!, positions[id * 3 + 2]!];
    const next: number[] = patch.rails.get("rim")!.map((id: number): number => id + offset);
    const chart = (rail: readonly number[]): [number, number][] => rail.map((id: number): [number, number] => [point(id)[0], point(id)[2]]);
    const a = chart(original), b = chart(next);
    const error: number = Math.sqrt(Math.max(NodeHeadTrace.directed(a, b), NodeHeadTrace.directed(b, a)));
    if (error > 0.5) throw new Error(`the upper eyelid rail misses its native continuation by ${error.toFixed(3)} mm`);
    const skin: number[] = patch.clay.indices.map((id: number): number => id + offset);
    const strip: number[] = connect(forehead.clay.indices, skin, original, next, point);
    return { ...forehead, clay: { positions, indices: forehead.clay.indices.concat(skin, strip) },
      lines: forehead.lines.concat(patch.lines), receipt: `${forehead.receipt}\n${patch.receipt}; ${original.length}/${next.length} reciprocal edges, ${error.toFixed(3)} mm observed rail deviation` };
  }

  /** Drop the superseded two-row exterior bridge as complete indexed triangles. */
  export function withoutBridge(faces: readonly number[], chain: IAutoMovieLoftChain | undefined, lines: Set<string>,
    locate: (chain: IAutoMovieLoftChain, end: "top" | "bottom") => { end: number[]; ringLine: string }): number[] {
    if (chain === undefined || chain.layers.length !== 2 || chain.layers[1]!.y - chain.layers[0]!.y >= 1.5)
      throw new Error("the replaced bridge must have only its two original rows");
    const a = locate(chain, "bottom"), b = locate(chain, "top");
    const vertices: Set<number> = new Set(a.end.concat(b.end));
    lines.add(a.ringLine).add(b.ringLine);
    const kept: number[] = [];
    for (let i: number = 0; i < faces.length; i += 3) {
      const a: number = faces[i]!, b: number = faces[i + 1]!, c: number = faces[i + 2]!;
      if (!vertices.has(a) && !vertices.has(b) && !vertices.has(c)) kept.push(a, b, c);
    }
    return kept;
  }

  /** Retain the exact source continuation of each noncentral cut component that owns its whole rail. */
  export function sideSkin(points: readonly number[], inside: number[], outside: readonly number[], y: number): number[] {
    const used: Map<string, Edge> = edges(inside);
    const rim: Map<string, Edge> = new Map([...used].filter(([, edge]): boolean => edge.uses === 1 && onPlane(points, edge, y)));
    if (rim.size === 0) return inside;
    const primary: Set<number> = new Set();
    const rear: number = [...rim.values()].flatMap(({ a, b }): number[] => [a, b]).reduce((a, b): number => points[a * 3]! < points[b * 3]! ? a : b);
    const adjacency: Map<number, number[]> = new Map();
    for (const { a, b } of rim.values()) {
      adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
      adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
    }
    const pending: number[] = [rear];
    while (pending.length !== 0) {
      const id: number = pending.pop()!;
      if (primary.has(id)) continue;
      primary.add(id);
      pending.push(...(adjacency.get(id) ?? []));
    }
    const retained: number[] = inside.slice();
    for (const part of components(outside)) {
      const border: [string, Edge][] = [...edges(part)].filter(([, edge]): boolean => edge.uses === 1 && onPlane(points, edge, y));
      if (border.length === 0 || border.some(([key, edge]): boolean => {
        const shared: Edge | undefined = rim.get(key);
        return shared === undefined || shared.a !== edge.b || shared.b !== edge.a || primary.has(edge.a) || primary.has(edge.b);
      })) continue;
      retained.push(...part);
    }
    return retained;
  }

  /** Isolate one native terminal without inferring a cap from an irregular event. */
  export function terminal(native: CaptureModel.ITriangles, clip: Clip, a: number, b: number, seed: V3, open: "top" | "bottom", name: string): Patch {
    const plane = (station: number): AutoMovieMeshCourse.IPlane => ({ station, origin: [0, station, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const points: number[] = native.positions.slice();
    const faces: number[] = clip(points, clip(points, native.indices, plane(a), 1), plane(b), -1);
    const source: number = points.findIndex((value, i): boolean => i % 3 === 0 && value === seed[0] && points[i + 1] === seed[1] && points[i + 2] === seed[2]) / 3;
    const part: number[] | undefined = components(faces).find((group: number[]): boolean => group.includes(source));
    if (part === undefined) throw new Error(`the exact native terminal of ${name} was not retained`);
    const free: Edge[] = [...edges(part).values()].filter((edge): boolean => edge.uses === 1);
    const y: number = open === "top" ? b : a;
    const cut: Edge[] = free.filter((edge): boolean => onPlane(points, edge, y));
    if (free.length !== cut.length || cut.length < 3) throw new Error(`${name} has ${cut.length} cut edges and ${free.length - cut.length} other source edges`);
    const next: Map<number, number> = new Map(cut.map(({ a, b }): [number, number] => [a, b]));
    const rail: number[] = [cut[0]!.a];
    for (let id: number | undefined = next.get(rail[0]!); id !== undefined && id !== rail[0] && rail.length <= cut.length; id = next.get(id)) rail.push(id);
    if (rail.length !== cut.length || next.get(rail.at(-1)!) !== rail[0]) throw new Error(`${name} has no single indexed original rim`);
    const used: number[] = [...new Set(part)];
    const ids: Map<number, number> = new Map(used.map((id, i): [number, number] => [id, i]));
    const at = (id: number): V3 => [points[3 * id]!, points[3 * id + 1]!, points[3 * id + 2]!];
    return { clay: { positions: used.flatMap(at), indices: part.map((id): number => ids.get(id)!) },
      lines: [{ id: `original.${name}.rim`, points: rail.map(at), closed: true, colour: "9e4c74" }],
      rails: new Map([["rim", rail.map((id): number => ids.get(id)!)] ]), qualified: true,
      receipt: `${name}: ${part.length / 3} clipped native triangles, ${rail.length} original rim edges` };
  }

  function onPlane(points: readonly number[], edge: Edge, y: number): boolean {
    return Math.abs(points[edge.a * 3 + 1]! - y) < 1e-8 && Math.abs(points[edge.b * 3 + 1]! - y) < 1e-8;
  }

  function key(a: number, b: number): string { return a < b ? `${a}:${b}` : `${b}:${a}`; }

  function edges(faces: readonly number[]): Map<string, Edge> {
    const found: Map<string, Edge> = new Map();
    for (let i: number = 0; i < faces.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = faces[i + j]!, b: number = faces[i + (j + 1) % 3]!;
        const id: string = key(a, b);
        const prior: Edge | undefined = found.get(id);
        if (prior === undefined) found.set(id, { a, b, uses: 1 });
        else ++prior.uses;
      }
    return found;
  }

  /** A native component is connected by original edges, including shared cut vertices. */
  function components(faces: readonly number[]): number[][] {
    const parent: number[] = Array.from({ length: faces.length / 3 }, (_, i): number => i);
    const root = (i: number): number => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; }
      return i;
    };
    const owner: Map<string, number> = new Map();
    for (let i: number = 0; i < faces.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const edge: string = key(faces[i + j]!, faces[i + (j + 1) % 3]!);
        const prior: number | undefined = owner.get(edge);
        if (prior === undefined) owner.set(edge, i / 3);
        else parent[root(i / 3)] = root(prior);
      }
    const groups: Map<number, number[]> = new Map();
    for (let i: number = 0; i < faces.length; i += 3) {
      const id: number = root(i / 3);
      const group: number[] = groups.get(id) ?? [];
      group.push(faces[i]!, faces[i + 1]!, faces[i + 2]!);
      groups.set(id, group);
    }
    return [...groups.values()];
  }

  /** Share one exact sampled source ring and keep all other native indices distinct. */
  function append(base: Patch, added: Patch, baseKey: string, addedKey: string): Patch {
    if (!added.qualified) throw new Error(added.receipt);
    const a: number[] | undefined = base.rails.get(baseKey);
    const b: number[] | undefined = added.rails.get(addedKey);
    if (a === undefined || b === undefined || a.length !== b.length) throw new Error("the signed oral walls do not expose the same original rail");
    const pointKey = (positions: readonly number[], id: number): string => positions.slice(3 * id, 3 * id + 3).join(":");
    const existing: Map<string, number> = new Map(a.map((id: number): [string, number] => [pointKey(base.clay.positions, id), id]));
    const ids: Map<number, number> = new Map(b.map((id: number): [number, number] => {
      const found: number | undefined = existing.get(pointKey(added.clay.positions, id));
      if (found === undefined) throw new Error("a signed oral rail coordinate differs from the original wall");
      return [id, found];
    }));
    const mapped: number[] = b.map((id: number): number => ids.get(id)!);
    const direction: number = NodeHeadTrace.railDirection(base.clay.indices, mapped);
    if (new Set(mapped).size !== a.length || direction === 0 || NodeHeadTrace.railDirection(added.clay.indices, b) !== -direction)
      throw new Error("the original signed oral rail is not shared in opposite pairs");
    const positions: number[] = base.clay.positions.slice();
    const faces: number[] = added.clay.indices.map((id: number): number => {
      const shared: number | undefined = ids.get(id);
      if (shared !== undefined) return shared;
      const next: number = positions.push(...added.clay.positions.slice(3 * id, 3 * id + 3)) / 3 - 1;
      ids.set(id, next);
      return next;
    });
    return { ...base, clay: { positions, indices: base.clay.indices.concat(faces) }, lines: base.lines.concat(added.lines),
      receipt: `${base.receipt}\n${added.receipt}; ${b.length} exact reciprocal oral wall edges` };
  }
}
