import fs from "node:fs";
import { AutoMovieMeshExtract, type AutoMovieMeshCourse, type IAutoMovieLoftChain } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeHeadJunction } from "./NodeHeadJunction";
import { NodeHeadSourceSkin } from "./NodeHeadSourceSkin";
import { NodeHeadTrace } from "./NodeHeadTrace";

type Patch = NodeHeadJunction.IResult;
type Link = { groups: [number[], number[]][] };
type V3 = [number, number, number];
type Edge = { a: number; b: number; uses: number; balance: number };
type Clip = (points: number[], faces: readonly number[], plane: AutoMovieMeshCourse.IPlane, sign: 1 | -1) => number[];
type Connect = (before: readonly number[], after: readonly number[], a: number[], b: number[], point: (id: number) => V3) => number[];
type ArchivedJoin = NodeHeadJunction.ILayout & { seams: { chain: string; end: "top" | "bottom"; rail: string }[]; replace?: string };
type Rim = { rail: number[]; component: number; side: 0 | 1 };
type V2 = [number, number];
type ExteriorBand = "neck" | "nose" | "midface" | "cheek";
type Band = "forehead" | "mouth" | ExteriorBand;

/** Repair exposed head cuts using the same indexed source contours on both sides. */
export namespace NodeHeadNativeJunctions {
  /** Continue the oral wall to the recorded lower branches and the upper terminal. */
  export function oralWall(archive: string, mesh: AutoMovieMeshExtract.IMesh, mouth: Patch, native: CaptureModel.ITriangles, clip: Clip, connect: Connect): Patch {
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
    return append(append(replaceIfQualified("mouth", mouth, native, clip, connect), below, "0:1", `${lower.length - 1}:0`), above, "212:1", "0:0");
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

  /**
   * Carry the observed near-horizontal skin using its own face adjacency.
   * Only the named eye or lip slab is replaced; the existing indexed outer
   * and oral rims remain the interfaces to the surrounding conic surfaces.
   */
  function replaceFoldedBand(name: Band, base: Patch, native: CaptureModel.ITriangles, clip: Clip, connect: Connect): Patch {
    const keys = name === "forehead" ? [["0:0"], ["192:0"]] as const
      : name === "mouth" ? [["mouth:first", "0:1"], ["mouth:last", "212:1"]] as const : [["lower"], ["upper"]] as const;
    const upper: number[] | undefined = base.rails.get(keys[1][0]);
    if (upper === undefined) throw new Error("the retained upper rail is missing");
    // The forehead and mouth use F1 rows 2688/2876 and 423/628.
    // The exterior cuts are observed midplanes between native vertex
    // heights, just inside the measured existing outer rails. The cheek
    // starts on the exact native plane that ends the nasal patch.
    const sourceCuts: Record<Band, [number, number]> = {
      forehead: [1598.3105087280273, 1602.3069763183594],
      mouth: [1518.1841659545898, 1525.7013702392578],
      neck: [1458.4367370605469, 1517.5642395019531],
      nose: [1549.2088317871094, 1558.627700805664],
      midface: [1526.2989807128906, 1548.5871887207031],
      cheek: [1558.627700805664, 1584.1547393798828],
    };
    const [from, to]: [number, number] = sourceCuts[name];
    if (to >= base.clay.positions[3 * upper[0]! + 1]!) throw new Error("the source cut must remain below the retained upper rail");
    const vault: number[] | undefined = name === "forehead" ? base.rails.get("forehead:top") : undefined;
    const retained: number[] = name === "forehead" ? upperStrip(base, upper, vault) : [];
    const plane = (station: number): AutoMovieMeshCourse.IPlane => ({ station, origin: [0, station, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const points: number[] = native.positions.slice();
    const source: number[] = clip(points, clip(points, native.indices, plane(from), 1), plane(to), -1);
    const patches: number[][] = components(source);
    const rims: Rim[] = patches.flatMap((part: number[], component: number): Rim[] => {
      const free: Edge[] = [...edges(part).values()].filter((edge: Edge): boolean => edge.uses === 1);
      return ([0, 1] as const).flatMap((side): Rim[] =>
        loops(free.filter((edge: Edge): boolean => onPlane(points, edge, side === 0 ? from : to))).map((rail: number[]): Rim => ({ rail, component, side })));
    });
    const at = (array: readonly number[], id: number): V3 => [array[id * 3]!, array[id * 3 + 1]!, array[id * 3 + 2]!];
    const xz = (array: readonly number[], rail: readonly number[]): V2[] => rail.map((id: number): V2 => [array[id * 3]!, array[id * 3 + 2]!]);
    const measured: { old: number[]; rim: Rim; residual: number }[] = ([0, 1] as const).flatMap((side) =>
      keys[side].map((key: string) => {
        const old: number[] | undefined = base.rails.get(key);
        const owner: readonly number[] = side === 1 && retained.length !== 0 ? retained : base.clay.indices;
        if (old === undefined || NodeHeadTrace.railDirection(owner, old) === 0) throw new Error(`missing indexed original rim ${key}`);
        const physical: V2[] = xz(base.clay.positions, old);
        const matches = rims.filter((rim: Rim): boolean => rim.side === side).map((rim: Rim) =>
          ({ rim, residual: ringGap(physical, xz(points, rim.rail)) })).sort((a, b): number => a.residual - b.residual);
        const found = matches[0];
        if (found === undefined || found.residual > 0.5 || (matches[1]?.residual ?? Infinity) <= 0.5)
          throw new Error(`no unique original ${name} rail for ${key} within 0.5 mm (nearest ${found?.residual.toFixed(3) ?? "unavailable"})`);
        return { old, ...found };
      }));
    if (new Set(measured.map(({ rim }): Rim => rim)).size !== measured.length) throw new Error("two original rims selected the same native rail");
    const selected: Set<number> = new Set(measured.map(({ rim }): number => rim.component));
    if (name !== "forehead" && name !== "mouth" && selected.size !== 1)
      throw new Error("the original exterior does not join both observed rails");
    const componentFaces: number[] = [...selected].flatMap((i: number): number[] => patches[i]!);
    const sourceEdges: Map<string, Edge> = edges(componentFaces);
    const expected: number = measured.reduce((sum: number, { rim }): number => sum + rim.rail.length, 0);
    if ([...sourceEdges.values()].filter((edge: Edge): boolean => edge.uses === 1).length !== expected ||
        [...sourceEdges.values()].some((edge: Edge): boolean => edge.uses > 2))
      throw new Error("the native slab has an additional physical opening or an invalid indexed edge");
    const positions: number[] = base.clay.positions.slice();
    const ids: Map<number, number> = new Map();
    // Consecutive native clips already intersect the same source edges.
    // Reuse their exact physical indices instead of lofting a zero-width strip.
    const shared: Set<Rim> = new Set();
    for (const { old, rim } of measured) {
      if (points[3 * rim.rail[0]! + 1] !== positions[3 * old[0]! + 1]) continue;
      const existing: Map<string, number> = new Map(old.map((id: number): [string, number] => [at(positions, id).join(":"), id]));
      const matched: number[] = rim.rail.map((id: number): number => {
        const index: number | undefined = existing.get(at(points, id).join(":"));
        if (index === undefined) throw new Error("the native cut has a different source crossing");
        return index;
      });
      if (matched.length !== old.length || new Set(matched).size !== old.length)
        throw new Error("the native cut does not match one complete indexed rail");
      rim.rail.forEach((id: number, i: number): void => { ids.set(id, matched[i]!); });
      shared.add(rim);
    }
    for (const id of new Set(componentFaces))
      if (!ids.has(id)) ids.set(id, positions.push(...at(points, id)) / 3 - 1);
    const core: number[] = componentFaces.map((id: number): number => ids.get(id)!);
    const reversed: number[] = base.clay.indices.map((_, i: number): number => base.clay.indices[i % 3 === 0 ? i : i % 3 === 1 ? i + 1 : i - 1]!);
    const lines: CaptureModel.ILine[] = [];
    const stitched: number[] = [];
    const errors: number[] = [];
    const midpoints: number[] = [];
    for (const [i, { old, rim, residual }] of measured.entries()) {
      const nativeRail: number[] = rim.rail.map((id: number): number => ids.get(id)!);
      const point = (id: number): V3 => at(positions, id);
      const faces: number[] = shared.has(rim) ? [] : rim.side === 0 ? connect(reversed, core, old, nativeRail, point)
        : connect(core, retained.length === 0 ? reversed : retained, nativeRail, old, point);
      const mid: number = (point(old[0]!)[1] + point(nativeRail[0]!)[1]) / 2;
      const error: number = shared.has(rim) ? 0 : midplaneGap(native, { positions, indices: faces }, mid, xz(positions, nativeRail));
      if (error > 0.5) throw new Error(`native ${name} rail ${i} midplane ${Number.isFinite(error) ? error.toFixed(3) : "unreadable"} mm`);
      errors.push(Math.max(error, residual));
      midpoints.push(error);
      stitched.push(...faces);
      for (const [kind, rail] of [["retained", old], ["native", nativeRail]] as const)
        lines.push({ id: `${name}.physical.${kind}.${i}`, points: rail.map(point), closed: true, colour: "9e4c74" });
    }
    if (vault !== undefined)
      lines.push({ id: "forehead.physical.retained.vault", points: vault.map((id: number): V3 => at(positions, id)), closed: true, colour: "9e4c74" });
    const indices: number[] = core.concat(stitched, retained);
    if (edgeSignature(indices) !== edgeSignature(base.clay.indices))
      throw new Error("the native strip changed an original oriented rim or created an invalid edge");
    return { ...base, clay: { positions, indices }, lines, receipt: `${name}: ${core.length / 3} actual source skin triangles; ${measured.length} unchanged indexed rims, ordinary seams ${errors.map((v: number): string => v.toFixed(3)).join("/")} mm, independent midplanes ${midpoints.map((v: number): string => v.toFixed(3)).join("/")} mm; ${retained.length / 3} original vault-transition faces retained` };
  }

  /** Rebuild the proved outer spans after their neighboring neck and cavity edges are assembled. */
  export function repairOuterSpans(capture: CaptureModel.IPart, native: CaptureModel.ITriangles, original: AutoMovieMeshExtract.IMesh, clip: Clip, connect: Connect): void {
    if (capture.loft.status !== "available") return;
    const loft: Extract<CaptureModel.ILoft, { status: "available" }> = capture.loft;
    // Use the retained oral, nasal and lower eye exterior rails. The cheek
    // begins on the physical nasal cut, before its generated transition.
    const spans: readonly (readonly [ExteriorBand, number, number])[] = [
      ["neck", 1458, 1518.0571746826172],
      ["nose", 1548.9590644836426, 1558.7013574838638],
      ["midface", 1525.8068084716797, 1548.9590644836426],
      ["cheek", 1558.627700805664, 1584.6522521972656],
    ];
    for (const [name, low, high] of spans) {
      let receipt: string;
      try {
        const base: Patch = exteriorSpan(loft.clay, low, high);
        const patch: Patch = replaceFoldedBand(name, base, native, clip, connect);
        const removed: Set<string> = new Set();
        for (let i: number = 0; i < base.clay.indices.length; i += 3)
          removed.add(base.clay.indices.slice(i, i + 3).join(":"));
        const outside: number[] = [];
        for (let i: number = 0; i < loft.clay.indices.length; i += 3) {
          const face: number[] = loft.clay.indices.slice(i, i + 3);
          if (!removed.has(face.join(":"))) outside.push(...face);
        }
        loft.clay = { positions: patch.clay.positions, indices: outside.concat(patch.clay.indices) };
        loft.lines = loft.lines.filter((line: CaptureModel.ILine): boolean =>
          line.points.some(([, y]): boolean => y < low || y > high)).concat(patch.lines);
        receipt = patch.receipt;
      } catch (error) {
        receipt = `native ${name} exterior refused: ${error instanceof Error ? error.message : String(error)}`;
      }
      capture.diagnostics.push(receipt);
      loft.diagnostics.push(receipt);
      console.log(receipt);
    }
    NodeHeadSourceSkin.attach(capture, native, original, clip);
  }

  /** Select only the indexed outside component between the observed rails, leaving inner walls intact. */
  function exteriorSpan(clay: CaptureModel.ITriangles, low: number, high: number): Patch {
    const scoped: number[] = [];
    for (let i: number = 0; i < clay.indices.length; i += 3) {
      const face: number[] = clay.indices.slice(i, i + 3);
      if (face.every((id: number): boolean => clay.positions[3 * id + 1]! >= low - 1e-7 && clay.positions[3 * id + 1]! <= high + 1e-7))
        scoped.push(...face);
    }
    const matches: Patch[] = components(scoped).flatMap((faces: number[]): Patch[] => {
      const free: Edge[] = [...edges(faces).values()].filter((edge: Edge): boolean => edge.uses === 1);
      const ends: (number[] | undefined)[] = [low, high].map((y: number): number[] | undefined =>
        loops(free.filter((edge: Edge): boolean => onPlane(clay.positions, edge, y))).sort((a: number[], b: number[]): number => b.length - a.length)[0]);
      const [a, b] = ends;
      if (a === undefined || b === undefined || a.length + b.length !== free.length ||
          !a.some((id: number): boolean => clay.positions[3 * id]! < -40)) return [];
      return [{ clay: { positions: clay.positions, indices: faces }, lines: [], rails: new Map([["lower", a], ["upper", b]]), receipt: "", qualified: true }];
    });
    if (matches.length !== 1) throw new Error("the observed interval does not expose one exterior with two complete indexed rims");
    return matches[0]!;
  }

  /** Keep both incident rows of the original vault transition by their exact indexed ownership. */
  function upperStrip(base: Patch, lower: number[], upper: number[] | undefined): number[] {
    if (upper === undefined) throw new Error("the original vault boundary is missing");
    const owners: Set<number> = new Set(lower.concat(upper));
    const faces: number[] = [];
    for (let i: number = 0; i < base.clay.indices.length; i += 3) {
      const triangle: number[] = base.clay.indices.slice(i, i + 3);
      if (triangle.every((id: number): boolean => owners.has(id))) faces.push(...triangle);
    }
    if (NodeHeadTrace.railDirection(faces, lower) === 0 ||
        NodeHeadTrace.railDirection(faces, upper) !== NodeHeadTrace.railDirection(base.clay.indices, upper))
      throw new Error("the original vault-transition faces do not own both complete rims");
    return faces;
  }

  /** Read closed directed free-edge walks without forcing an open source arc into a ring. */
  function loops(free: readonly Edge[]): number[][] {
    const next: Map<number, number[]> = new Map();
    for (const { a, b } of free) next.set(a, [...(next.get(a) ?? []), b]);
    const seen: Set<number> = new Set();
    const out: number[][] = [];
    for (const start of next.keys()) {
      if (seen.has(start)) continue;
      const rail: number[] = [];
      for (let id: number | undefined = start; id !== undefined && !seen.has(id); id = next.get(id)?.length === 1 ? next.get(id)![0] : undefined) {
        seen.add(id);
        rail.push(id);
      }
      if (rail.length >= 3 && next.get(rail.at(-1)!)?.[0] === start) out.push(rail);
    }
    return out;
  }

  function ringGap(a: V2[], b: V2[]): number {
    return Math.sqrt(Math.max(NodeHeadTrace.directed(a, b), NodeHeadTrace.directed(b, a)));
  }

  /** Check the same physical loop in an independent raw horizontal plane. */
  function midplaneGap(raw: CaptureModel.ITriangles, clay: CaptureModel.ITriangles, y: number, support: V2[]): number {
    const frame: AutoMovieMeshExtract.IFrame = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
    const read = (mesh: CaptureModel.ITriangles): V2[][] => AutoMovieMeshExtract.outline(mesh, frame, [y], 1, 0.5, 0)[0]!.loops
      .filter((loop: AutoMovieMeshExtract.ILoop): boolean => loop.closed).map((loop: AutoMovieMeshExtract.ILoop): V2[] => loop.points.map(([z, x]): V2 => [x, z]));
    const built: V2[][] = read(clay);
    const nearest: V2[] | undefined = read(raw).sort((a: V2[], b: V2[]): number => ringGap(support, a) - ringGap(support, b))[0];
    return nearest === undefined || built.length !== 1 ? Infinity : ringGap(nearest, built[0]!);
  }

  /** Compare exact oriented indexed boundaries and refuse any additional incidence defect. */
  function edgeSignature(faces: readonly number[]): string {
    const free: string[] = [];
    for (const [id, edge] of edges(faces))
      if (edge.uses === 1) free.push(`${id}:${edge.a < edge.b ? 1 : -1}`);
      else if (edge.uses !== 2 || edge.balance !== 0) throw new Error("a patch has a nonreciprocal interior edge");
    return free.sort((a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0).join("|");
  }

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
    const baseline: Patch = { ...forehead, clay: { positions, indices: forehead.clay.indices.concat(skin, strip) },
      lines: forehead.lines.concat(patch.lines), receipt: `${forehead.receipt}\n${patch.receipt}; ${original.length}/${next.length} reciprocal edges, ${error.toFixed(3)} mm observed rail deviation` };
    return replaceIfQualified("forehead", baseline, native, clip, connect);
  }

  /** Preserve the already connected construction when the original local band is unsupported. */
  function replaceIfQualified(name: "forehead" | "mouth", baseline: Patch, native: CaptureModel.ITriangles, clip: Clip, connect: Connect): Patch {
    try { return replaceFoldedBand(name, baseline, native, clip, connect); }
    catch (error) { return { ...baseline, receipt: `${baseline.receipt}\nnative ${name} band refused: ${error instanceof Error ? error.message : String(error)}` }; }
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
        const direction: number = a < b ? 1 : -1;
        if (prior === undefined) found.set(id, { a, b, uses: 1, balance: direction });
        else { ++prior.uses; prior.balance += direction; }
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
