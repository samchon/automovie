import fs from "node:fs";

import { AutoMovieContourLoftCurves64, AutoMovieMeshCourse, AutoMovieMeshExtract, generateAutoMovieContourLoft64, type IAutoMovieContourLoft64, type IAutoMovieCurve64 } from "@automovie/engine";

import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeHeadSourceSkin } from "./NodeHeadSourceSkin";
import { NodeHeadTrace } from "./NodeHeadTrace";

type V2 = [number, number];
type V3 = [number, number, number];
type Span = { start: V3; end: V3; startDerivative: V3; endDerivative: V3 };
type SavedCurve = { kind: string; ordinal: number; winding: 1 | -1; curve: { name: string; closed: boolean; phaseIntervals: number[]; spans: Span[] } };
type SavedRow = { index: number; coordinateMm: number; curves: SavedCurve[] };
type SavedLink = { beforeMm: number; afterMm: number; groups: [number[], number[]][] };
type PrimitiveRange = NonNullable<IAutoMovieContourLoft64.IResult["primitiveRanges"]>[number];
type IArchive = { source: SavedRow[]; links: SavedLink[]; loft: { events: IAutoMovieContourLoft64.IEvent[]; chordToleranceMm: number } };

/** Stage 1 head junctions built from the original signed F1 contour incidence. */
export namespace NodeHeadJunction {
  /** A declared subset of native section rows and events. */
  export interface ILayout {
    /** Name used in diagnostics for this source junction. */
    name: string;
    /** Path to the original region rows, relative to the F1 archive. */
    file: string | readonly string[];
    /** Global index of the first published section. */
    first: number;
    /** Ordered original contour ordinals retained at each section. */
    ordinals: number[][];
    /** Original critical events allowed in this section range. */
    events: string[];
    /** Last archive section whose outer rail is still owned by this local patch. */
    lastExterior?: number;
  }

  /** Exact indexed output and its original rail identities in the capture world. */
  export interface IResult {
    /** Tessellated physical surface in the capture world, in millimetres. */
    clay: CaptureModel.ITriangles;
    /** Observed construction lines and their original contour identities. */
    lines: CaptureModel.ILine[];
    /** Ordered vertex indices into clay for each complete source rim. */
    rails: Map<string, number[]>;
    /** Source ranges, topology results, and measured refusals. */
    receipt: string;
    /** Whether the selected original groups emitted their required surface. */
    qualified: boolean;
  }

  /** Read each closed source globe and its signed curve track, using the original loft if closure refuses. */
  export function globes(archive: string, mesh: AutoMovieMeshExtract.IMesh): IResult {
    const data: IArchive = readArchive(archive, Array.from({ length: 25 }, (_: unknown, i: number): string =>
      `sections/head_detail/${String(i + 8).padStart(3, "0")}.json`));
    const { links, loft }: IArchive = data;
    const positions: number[] = [];
    const indices: number[] = [];
    const lines: CaptureModel.ILine[] = [];
    const receipts: string[] = [];
    const roots: Int32Array = nativeComponents(mesh);
    const originalGlobe = NodeHeadSourceSkin.globeReader(mesh);
    for (const [side, birth, death] of [["right", "critical.416", "critical.1378"], ["left", "critical.415", "critical.1377"]] as const) {
      const name: string = `head.globe.${side}`;
      try {
        const minimum = loft.events.find((event): boolean => event.name === birth && event.kind === "minimum" && event.regular);
        const maximum = loft.events.find((event): boolean => event.name === death && event.kind === "maximum" && event.regular);
        if (minimum === undefined || minimum.terminal === null || maximum === undefined || maximum.terminal === null)
          throw new Error("the original regular globe endpoints are unavailable");
        const first: number = links.findIndex((link: SavedLink): boolean => link.beforeMm === minimum.beforeMm && link.afterMm === minimum.afterMm);
        const last: number = links.findIndex((link: SavedLink): boolean => link.beforeMm === maximum.beforeMm && link.afterMm === maximum.afterMm);
        const ordinals: number[][] = globeOrdinals(links, first, last, minimum, maximum);
        const raw: AutoMovieMeshExtract.IMesh = globeSource(mesh, roots, world(minimum.terminal), world(maximum.terminal));
        let native: CaptureModel.ITriangles | undefined;
        let refusal: string = "";
        try { native = originalGlobe(world(minimum.terminal), world(maximum.terminal)); }
        catch (error) { refusal = error instanceof Error ? error.message : String(error); }
        const result: IResult = build({ name, first, ordinals, events: [birth, death] }, raw, data, native);
        if (!result.qualified) throw new Error(result.receipt);
        const topology: ReturnType<typeof globeTopology> = globeTopology(result.clay);
        if (topology.open !== 0 || topology.invalid !== 0) throw new Error(`${topology.open} free and ${topology.invalid} non-reciprocal indexed edges`);
        const drawnSource: string = native === undefined
          ? `${topology.paired} reciprocal loft edges, 0 free, 0 invalid; original loft retained (${refusal})`
          : `${result.clay.indices.length / 3} closed source faces, 0 free, 0 invalid`;
        const centre: V3 = minimum.terminal.map((coordinate: number, i: number): number => (coordinate + maximum.terminal![i]!) / 2) as V3;
        const planes: AutoMovieMeshCourse.IPlane[] = CaptureSpecs.steps(minimum.coordinateMm + 0.0625, maximum.coordinateMm - 0.0625, 1)
          .map((station: number): AutoMovieMeshCourse.IPlane => horizontalPlane(station, centre));
        const offset: number = positions.length / 3;
        for (const value of result.clay.positions) positions.push(value);
        for (const value of result.clay.indices) indices.push(offset + value);
        for (const line of result.lines) lines.push({ ...line, id: `${name}:${line.id}` });
        receipts.push(`${result.receipt}; ${ordinals.length - 2} original closed profiles; ${drawnSource}; ${surfaceResidual(raw, result.clay, planes, false)}`);
      } catch (error) {
        receipts.push(`${name} refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return { clay: { positions, indices }, lines, rails: new Map(), receipt: receipts.join("\n"), qualified: receipts.every((receipt: string): boolean => !receipt.includes(" refused:")) };
  }

  function globeOrdinals(links: readonly SavedLink[], first: number, last: number, minimum: IAutoMovieContourLoft64.IEvent, maximum: IAutoMovieContourLoft64.IEvent): number[][] {
    if (first < 0 || last <= first || minimum.before.length !== 0 || minimum.after.length !== 1 || maximum.before.length !== 1 || maximum.after.length !== 0)
      throw new Error("the original globe is missing its single-loop birth or death");
    let ordinal: number = minimum.after[0]!;
    const rows: number[][] = [[], [ordinal]];
    for (let i: number = first + 1; i < last; ++i) {
      const matches: SavedLink["groups"] = links[i]!.groups.filter(([before]): boolean => before.includes(ordinal));
      if (matches.length !== 1 || matches[0]![0].length !== 1 || matches[0]![1].length !== 1)
        throw new Error(`original globe section ${i} lacks a unique one-to-one continuation`);
      ordinal = matches[0]![1][0]!;
      rows.push([ordinal]);
    }
    if (ordinal !== maximum.before[0]) throw new Error("the original globe does not reach its recorded maximum");
    return rows.concat([[]]);
  }

  function globeTopology(clay: CaptureModel.ITriangles): { paired: number; open: number; invalid: number } {
    const uses: Map<number, [number, number]> = new Map();
    const vertices: number = clay.positions.length / 3;
    for (let i: number = 0; i < clay.indices.length; i += 3)
      for (let j: number = 0; j < 3; ++j) {
        const a: number = clay.indices[i + j]!;
        const b: number = clay.indices[i + (j + 1) % 3]!;
        const key: number = Math.min(a, b) * vertices + Math.max(a, b);
        const [forward, backward]: [number, number] = uses.get(key) ?? [0, 0];
        uses.set(key, a < b ? [forward + 1, backward] : [forward, backward + 1]);
      }
    let paired: number = 0;
    let open: number = 0;
    let invalid: number = 0;
    for (const [forward, backward] of uses.values()) {
      if (forward === 1 && backward === 1) ++paired;
      else if (forward + backward === 1) ++open;
      else ++invalid;
    }
    return { paired, open, invalid };
  }

  function nativeComponents(mesh: AutoMovieMeshExtract.IMesh): Int32Array {
    const parent: Int32Array = Int32Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): number => i);
    const root = (i: number): number => {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    for (let i: number = 0; i + 2 < mesh.indices.length; i += 3) {
      const a: number = root(mesh.indices[i]!);
      parent[root(mesh.indices[i + 1]!)] = a;
      parent[root(mesh.indices[i + 2]!)] = a;
    }
    return parent.map((_: number, i: number): number => root(i));
  }

  function globeSource(mesh: AutoMovieMeshExtract.IMesh, roots: Int32Array, a: V3, b: V3): AutoMovieMeshExtract.IMesh {
    const near = (point: V3): Set<number> => {
      const found: Set<number> = new Set();
      for (let i: number = 0; i < roots.length; ++i)
        if (Math.hypot(mesh.positions[3 * i]! - point[0], mesh.positions[3 * i + 1]! - point[1], mesh.positions[3 * i + 2]! - point[2]) <= 0.00001)
          found.add(roots[i]!);
      return found;
    };
    const top: Set<number> = near(b);
    const owners: number[] = [...near(a)].filter((id: number): boolean => top.has(id));
    if (owners.length !== 1) throw new Error(`the two actual endpoints have ${owners.length} common indexed source components`);
    const indices: number[] = [];
    for (let i: number = 0; i < mesh.indices.length; ++i)
      if (roots[mesh.indices[i]!] === owners[0]) indices.push(mesh.indices[i]!);
    let minimum: number = Infinity;
    let maximum: number = -Infinity;
    for (const vertex of indices) {
      minimum = Math.min(minimum, mesh.positions[3 * vertex + 1]!);
      maximum = Math.max(maximum, mesh.positions[3 * vertex + 1]!);
    }
    if (Math.abs(minimum - a[1]) > 0.00001 || Math.abs(maximum - b[1]) > 0.00001)
      throw new Error("the indexed source component extends beyond the archived extrema");
    return { positions: mesh.positions, indices };
  }

  /** Select the posterior-owned native sheet using exactly two opposite uses of each traversed edge. */
  export function posteriorComponent(points: readonly number[], faces: readonly number[]): number[] {
    const count: number = faces.length / 3;
    const parent: Int32Array = Int32Array.from({ length: count }, (_: unknown, i: number): number => i);
    const root = (i: number): number => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; }
      return i;
    };
    const uses: Map<string, [number, number][]> = new Map();
    let seed: number = -1;
    let rear: number = Infinity;
    for (let i: number = 0; i < count; ++i) for (let j: number = 0; j < 3; ++j) {
      const a: number = faces[3 * i + j]!;
      const b: number = faces[3 * i + (j + 1) % 3]!;
      const x: number = points[3 * a]!;
      if (x < rear) { rear = x; seed = i; }
      const key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
      const incident: [number, number][] = uses.get(key) ?? [];
      incident.push([i, a < b ? 1 : -1]);
      uses.set(key, incident);
    }
    if (seed < 0 || rear >= -60) throw new Error("the clipped source has no posterior exterior triangle");
    for (const incident of uses.values())
      if (incident.length === 2 && incident[0]![1] === -incident[1]![1]) parent[root(incident[1]![0])] = root(incident[0]![0]);
    const owner: number = root(seed);
    const result: number[] = [];
    for (let i: number = 0; i < count; ++i)
      if (root(i) === owner) result.push(faces[3 * i]!, faces[3 * i + 1]!, faces[3 * i + 2]!);
    return result;
  }

  function world([x, y, z]: IAutoMovieCurve64.Vector): V3 {
    return [x, y, -z];
  }

  function savedBezier(curve: SavedCurve["curve"]): IAutoMovieCurve64.Cubic {
    const control = (p: V3, derivative: V3, scale: number): V3 =>
      [p[0] + scale * derivative[0], p[1] + scale * derivative[1], p[2] + scale * derivative[2]];
    return { type: "cubicBezier", name: curve.name, closed: curve.closed, unit: "mm", phaseUnit: "mm", phaseIntervals: curve.phaseIntervals,
      spans: curve.spans.map((span: Span, i: number): IAutoMovieCurve64.Span => {
        const third: number = curve.phaseIntervals[i]! / 3;
        return [span.start, control(span.start, span.startDerivative, third), control(span.end, span.endDerivative, -third), span.end];
      }) };
  }

  /** Read the exact source curves that own the ear and crown topology. */
  export function create(archive: string, layout: ILayout, mesh: AutoMovieMeshExtract.IMesh): IResult {
    return build(layout, mesh, readArchive(archive, typeof layout.file === "string" ? [layout.file] : layout.file));
  }

  /** Follow the continuously connected forehead exterior up to the first vault rail. */
  export function forehead(archive: string, mesh: AutoMovieMeshExtract.IMesh): IResult & { from: number; to: number } {
    const first: number = 2686;
    const last: number = 2879;
    const data: IArchive = readArchive(archive, ["sections/head/017.json", "sections/head/018.json", "sections/head/019.json"]);
    const ordinals: number[][] = linkedOuterOrdinals(data.source, data.links.slice(first, last), first);
    const result: IResult = build({ name: "forehead exterior", first, ordinals, events: ["critical.1315", "critical.1346"] }, mesh, data);
    const upper: number[] | undefined = result.rails.get(`${ordinals.length - 1}:0`);
    if (upper !== undefined) result.rails.set("forehead:top", upper);
    result.receipt += `; sampled outer envelope ${outerResidual(data, first, last, mesh, result.clay)}`;
    return { ...result, from: data.links[first]!.beforeMm, to: data.links[last - 1]!.afterMm };
  }

  /** Read the observed lip aperture without reassigning cavities or separate skin rings. */
  export function mouth(archive: string, mesh: AutoMovieMeshExtract.IMesh): IResult & { lip: V3 } {
    const first: number = 421;
    const last: number = 633;
    const data: IArchive = readArchive(archive, ["sections/head/002.json", "sections/head/003.json"]);
    const ordinals: number[][] = linkedOuterOrdinals(data.source, data.links.slice(first, last), first);
    const events: string[] = ["critical.187", "critical.190", "critical.199", "critical.201", "critical.204", "critical.205", "critical.207", "critical.208"];
    const result: IResult = build({ name: "mouth aperture", first, ordinals, events }, mesh, data);
    const before: number[] | undefined = result.rails.get("0:0");
    const after: number[] | undefined = result.rails.get(`${ordinals.length - 1}:0`);
    if (before !== undefined) result.rails.set("mouth:first", before);
    if (after !== undefined) result.rails.set("mouth:last", after);
    result.receipt += `; sampled outer envelope ${outerResidual(data, first, last, mesh, result.clay)}`;
    const aperture: SavedRow = data.source.find((row: SavedRow): boolean => row.index === 531)!;
    const rim: Span[] = aperture.curves.find((curve: SavedCurve): boolean => curve.kind === "closed" && curve.ordinal === 0)!.curve.spans;
    const [x, y, z]: V3 = rim.reduce((front: V3, span: Span): V3 => span.start[0] > front[0] ? span.start : front, rim[0]!.start);
    return { ...result, lip: [x, y, -z] };
  }

  function outerResidual(data: IArchive, first: number, last: number, mesh: AutoMovieMeshExtract.IMesh, clay: CaptureModel.ITriangles): string {
    const firstRow: SavedRow = data.source.find((row: SavedRow): boolean => row.index === first)!;
    const spans: Span[] = firstRow.curves.find((curve: SavedCurve): boolean => curve.kind === "closed" && curve.ordinal === 0)!.curve.spans;
    const centre: V3 = spans.reduce((sum: V3, span: Span): V3 => [sum[0] + span.start[0] / spans.length, 0, sum[2] + span.start[2] / spans.length], [0, 0, 0]);
    const planes: AutoMovieMeshCourse.IPlane[] = data.links.slice(first, last).filter((link: SavedLink): boolean => link.afterMm - link.beforeMm >= 0.1)
      .map((link: SavedLink): AutoMovieMeshCourse.IPlane => horizontalPlane((link.beforeMm + link.afterMm) / 2, centre));
    return surfaceResidual(mesh, clay, planes);
  }

  function read<T>(archive: string, file: string): T {
    return JSON.parse(fs.readFileSync(HumanNodePaths.resolve(`${archive}/${file}`), "utf8")) as T;
  }

  function readArchive(archive: string, files: readonly string[]): IArchive {
    return {
      source: files.flatMap((file: string): SavedRow[] => read<{ sections: SavedRow[] }>(archive, file).sections),
      links: read<{ intervals: SavedLink[] }>(archive, "links.json").intervals,
      loft: read<{ loft: IArchive["loft"] }>(archive, "global.json").loft,
    };
  }

  /** Reachable signed rails in the published slab components containing the exterior. */
  function linkedOuterOrdinals(source: readonly SavedRow[], links: readonly SavedLink[], first: number): number[][] {
    const rows: number[][] = Array.from({ length: links.length + 1 }, (_: unknown, i: number): number[] => {
      const row: SavedRow | undefined = source.find((section: SavedRow): boolean => section.index === first + i);
      if (row === undefined || !row.curves.some((curve: SavedCurve): boolean => curve.ordinal === 0 && curve.winding === 1 && curve.kind === "closed"))
        throw new Error(`no original outer rail at section ${first + i}`);
      return row.curves.filter((curve: SavedCurve): boolean => curve.kind === "closed" && curve.curve.closed).map((curve: SavedCurve): number => curve.ordinal);
    });
    const key = (row: number, ordinal: number): string => `${row}:${ordinal}`;
    const graph: Map<string, string[]> = new Map();
    const connect = (a: string, b: string): void => {
      const neighbours: string[] | undefined = graph.get(a);
      if (neighbours === undefined) graph.set(a, [b]);
      else neighbours.push(b);
    };
    for (const [row, link] of links.entries())
      for (const [before, after] of link.groups) {
        if (before.some((ordinal: number): boolean => !rows[row]!.includes(ordinal)) ||
            after.some((ordinal: number): boolean => !rows[row + 1]!.includes(ordinal))) continue;
        const members: string[] = before.map((ordinal: number): string => key(row, ordinal)).concat(after.map((ordinal: number): string => key(row + 1, ordinal)));
        for (const member of members.slice(1)) {
          connect(members[0]!, member);
          connect(member, members[0]!);
        }
      }
    const queue: string[] = rows.map((_: number[], row: number): string => key(row, 0));
    const selected: Set<string> = new Set(queue);
    for (let i: number = 0; i < queue.length; ++i)
      for (const next of graph.get(queue[i]!) ?? []) {
        if (selected.has(next)) continue;
        selected.add(next);
        queue.push(next);
      }
    return rows.map((ids: number[], row: number): number[] =>
      ids.filter((ordinal: number): boolean => selected.has(key(row, ordinal))).sort((a: number, b: number): number => a - b),
    );
  }

  /** Preserve the published section identities and ordered native curve controls. */
  function build(layout: Omit<ILayout, "file">, mesh: AutoMovieMeshExtract.IMesh, { source, links, loft }: IArchive, native?: CaptureModel.ITriangles): IResult {
    const { first, ordinals } = layout;
    const sections: IAutoMovieContourLoft64.ISection[] = ordinals.map((ids: number[], offset: number): IAutoMovieContourLoft64.ISection => {
      const row: SavedRow | undefined = source.find((section: SavedRow): boolean => section.index === first + offset);
      if (row === undefined && ids.length === 0) return { coordinateMm: links[first + offset - 1]!.afterMm, loops: [] };
      if (row === undefined) throw new Error(`missing original section ${first + offset}`);
      return { coordinateMm: row.coordinateMm, loops: ids.map((ordinal: number): IAutoMovieContourLoft64.ISection["loops"][number] => {
        const saved: SavedCurve | undefined = row.curves.find((curve: SavedCurve): boolean => curve.ordinal === ordinal && curve.kind === "closed");
        if (saved === undefined || !saved.curve.closed || (saved.winding !== 1 && saved.winding !== -1)) throw new Error(`missing original signed rail ${row.index}:${ordinal}`);
        return { winding: saved.winding, curve: savedBezier(saved.curve) };
      }) };
    });
    const local = (values: readonly number[], row: number): number[] => values.map((ordinal: number): number => ordinals[row]!.indexOf(ordinal));
    const intervals: IAutoMovieContourLoft64.IInterval[] = links.slice(first, first + sections.length - 1).map((link: SavedLink, row: number): IAutoMovieContourLoft64.IInterval => {
      const { beforeMm, afterMm } = link;
      if (beforeMm !== sections[row]!.coordinateMm || afterMm !== sections[row + 1]!.coordinateMm)
        throw new Error("the saved incidence does not use the original rail planes");
      return { beforeMm, afterMm, groups: link.groups.flatMap(([a, b]: [number[], number[]]): IAutoMovieContourLoft64.IInterval["groups"][number][] => {
        const before: number[] = local(a, row);
        const after: number[] = local(b, row + 1);
        const all: number[] = before.concat(after);
        if (all.every((ordinal: number): boolean => ordinal < 0)) return [];
        if (all.some((ordinal: number): boolean => ordinal < 0)) throw new Error("a junction crosses an unselected original boundary");
        return [{ before, after, supported: true, reason: null }];
      }) };
    });
    const events: IAutoMovieContourLoft64.IEvent[] = loft.events.flatMap((event: IAutoMovieContourLoft64.IEvent): IAutoMovieContourLoft64.IEvent[] => {
      const row: number = intervals.findIndex((interval: IAutoMovieContourLoft64.IInterval): boolean => interval.beforeMm === event.beforeMm && interval.afterMm === event.afterMm);
      if (row < 0 || !layout.events.includes(event.name)) return [];
      const before: number[] = local(event.before, row);
      const after: number[] = local(event.after, row + 1);
      if (before.concat(after).some((ordinal: number): boolean => ordinal < 0)) return [];
      return [{ ...event, before, after }];
    });
    if (events.length !== layout.events.length || events.some((event: IAutoMovieContourLoft64.IEvent): boolean => !event.regular))
      throw new Error("the published regular original events are unavailable");
    // The closed source globe has a single signed contour per row, so its
    // wire needs the same Bernstein sampling but no slab or triangle work.
    if (native !== undefined) {
      const lines: CaptureModel.ILine[] = sections
        .filter((section): boolean => section.loops.length !== 0 || !events.some((event): boolean => event.coordinateMm === section.coordinateMm))
        .flatMap(({ loops }, i: number): CaptureModel.ILine[] => loops.map(({ curve, winding }, j: number): CaptureModel.ILine => {
          const points: V3[] = AutoMovieContourLoftCurves64.tessellate(curve, loft.chordToleranceMm).map(({ p }): V3 => world(p));
          return { id: `${curve.name || "unresolved"}.section.${i}.loop.${j}`, points: winding < 0 ? points.reverse() : points, closed: true, colour: "9e4c74" };
        }));
      return { clay: native, lines, rails: new Map(), receipt: layout.name, qualified: true };
    }
    const terminal: IAutoMovieCurve64.Vector | null = layout.name === "crown closure"
      ? events.find((event: IAutoMovieContourLoft64.IEvent): boolean => event.kind === "maximum")?.terminal ?? null : null;
    let inserted: number = 0;
    let refusedCuts: string = "";
    if (terminal !== null)
      try {
        inserted = crownCuts(mesh, sections, intervals, terminal);
      } catch (error) {
        refusedCuts = `; raw crown sections refused: ${error instanceof Error ? error.message : String(error)}`;
      }
    const positions: number[] = [];
    const indices: number[] = [];
    const lines: CaptureModel.ILine[] = [];
    const emitted: Map<IAutoMovieCurve64.Vector, number> = new Map();
    const rails: Map<string, number[]> = new Map();
    const result = generateAutoMovieContourLoft64({ sections, intervals, events, chordToleranceMm: loft.chordToleranceMm }, {
      vertex: (index: number, point: IAutoMovieCurve64.Vector): void => { emitted.set(point, index); positions.push(...world(point)); },
      triangle: (a: number, b: number, c: number): void => { indices.push(a, c, b); },
      construction: (id: string, points: readonly IAutoMovieCurve64.Vector[]): void => {
        lines.push({ id, points: points.map(world), closed: true, colour: "9e4c74" });
        const key: RegExpExecArray | null = /\.section\.(\d+)\.loop\.(\d+)$/.exec(id);
        const rail: (number | undefined)[] = points.map((point: IAutoMovieCurve64.Vector): number | undefined => emitted.get(point));
        if (key !== null && rail.every((index: number | undefined): index is number => index !== undefined))
          rails.set(`${key[1]}:${key[2]}`, rail);
      },
    });
    const exterior: readonly PrimitiveRange[] | null = layout.name === "forehead exterior" ? qualifiedExterior(intervals, result) : null;
    const cutoff: number | undefined = layout.lastExterior === undefined ? undefined : sections[layout.lastExterior - first]?.coordinateMm;
    const ranges: readonly PrimitiveRange[] | null = cutoff === undefined ? exterior : (result.primitiveRanges ?? []).filter((range: PrimitiveRange): boolean =>
      range.beforeMm < cutoff || !intervals.find((interval): boolean => interval.beforeMm === range.beforeMm)?.groups[range.group]?.before.includes(0));
    const retained: number[] = ranges === null ? indices : ranges.flatMap((range: PrimitiveRange): number[] =>
      indices.slice(3 * range.firstTriangle, 3 * (range.firstTriangle + range.triangleCount)),
    );
    const clay: CaptureModel.ITriangles = { positions, indices: retained };
    const crown: string = terminal === null ? "" : `; ${inserted} raw middle sections, ${crownResidual(mesh, clay, sections, terminal)}`;
    const independent: string = exterior === null ? "" : `; ${exterior.length}/${intervals.length} central exterior strips qualified; ${retained.length / 3} central triangles retained; ${independentWindingChanges(layout, sections, intervals)}`;
    const receipt: string = `${layout.name}, ${sections.length} original or raw rows: ${events.map((event: IAutoMovieContourLoft64.IEvent): string => `${event.name} at ${event.coordinateMm} mm`).join(", ")}; ${indices.length / 3} original-contour triangles; ${result.unresolved.length} unresolved groups ${JSON.stringify(result.unresolved)}${crown}${refusedCuts}${independent}`;
    return { clay, lines, rails, receipt, qualified: indices.length > 0 && (exterior === null ? result.unresolved.length === 0 : exterior.length === intervals.length) };
  }

  /** Require an emitted and qualified strip for the recorded central exterior in every interval. */
  function qualifiedExterior(intervals: readonly IAutoMovieContourLoft64.IInterval[], result: ReturnType<typeof generateAutoMovieContourLoft64>): PrimitiveRange[] {
    const key = (before: number, after: number, group: number): string => `${before}:${after}:${group}`;
    const emitted: Map<string, PrimitiveRange> = new Map((result.primitiveRanges ?? []).filter((range: PrimitiveRange): boolean => range.kind === "strip" && range.triangleCount > 0)
      .map((range: PrimitiveRange): [string, PrimitiveRange] => [key(range.beforeMm, range.afterMm, range.group), range]));
    const qualified: Set<string> = new Set((result.stripObservations ?? []).filter((strip): boolean => strip.qualified)
      .map((strip): string => key(strip.beforeMm, strip.afterMm, strip.group)));
    return intervals.flatMap((interval: IAutoMovieContourLoft64.IInterval): PrimitiveRange[] => {
      const central: number = interval.groups.findIndex((group): boolean => group.supported && group.before.includes(0) && group.after.includes(0));
      const id: string = key(interval.beforeMm, interval.afterMm, central);
      const range: PrimitiveRange | undefined = emitted.get(id);
      return central >= 0 && range !== undefined && qualified.has(id) ? [range] : [];
    });
  }

  /** Retain source roles of small independent groups even when their winding changes. */
  function independentWindingChanges(layout: Omit<ILayout, "file">, sections: readonly IAutoMovieContourLoft64.ISection[], intervals: readonly IAutoMovieContourLoft64.IInterval[]): string {
    const changes: string[] = intervals.flatMap((interval: IAutoMovieContourLoft64.IInterval, row: number): string[] =>
      interval.groups.flatMap(({ before, after }): string[] => {
        if (before.length !== 1 || after.length !== 1 || before[0] === 0 || after[0] === 0) return [];
        const a: number = sections[row]!.loops[before[0]!]!.winding;
        const b: number = sections[row + 1]!.loops[after[0]!]!.winding;
        if (a === b) return [];
        const from: string = `${layout.first + row}:${layout.ordinals[row]![before[0]!]}`;
        const to: string = `${layout.first + row + 1}:${layout.ordinals[row + 1]![after[0]!]}`;
        return [`original section/loop ${from} (${a}) to ${to} (${b})`];
      }),
    );
    return `independent winding changes [${changes.join(", ")}]`;
  }

  /** Insert physical cuts inside the original crown's one-to-one interval. */
  function crownCuts(mesh: AutoMovieMeshExtract.IMesh, sections: IAutoMovieContourLoft64.ISection[], intervals: IAutoMovieContourLoft64.IInterval[], terminal: IAutoMovieCurve64.Vector): number {
    const a: number = sections[0]!.coordinateMm;
    const b: number = sections[1]!.coordinateMm;
    const count: number = Math.ceil((b - a) / 0.5);
    const inside: number[] = Array.from({ length: count - 1 }, (_: unknown, i: number): number => a + (b - a) * (i + 1) / count);
    const cuts: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(mesh, inside.map((y: number): AutoMovieMeshCourse.IPlane => horizontalPlane(y, terminal)));
    const middle: IAutoMovieContourLoft64.ISection[] = cuts.map((cut: AutoMovieMeshCourse.ISection): IAutoMovieContourLoft64.ISection => {
      if (cut.loop === null || cut.pieces !== 1) throw new Error(`the crown raw cut at ${cut.plane.station} mm has ${cut.pieces} outer loops`);
      const loop: V2[] = cut.loop.filter((point: V2, i: number, points: V2[]): boolean =>
        point[0] !== points[(i + points.length - 1) % points.length]![0] || point[1] !== points[(i + points.length - 1) % points.length]![1],
      );
      const { knots, length } = AutoMovieMeshExtract.reduceLoop(loop);
      const y: number = cut.plane.station;
      const intervals: number[] = knots.map((knot: AutoMovieMeshExtract.ILoopKnot, i: number): number => (knots[i + 1]?.t ?? knots[0]!.t + length) - knot.t);
      const point = (knot: AutoMovieMeshExtract.ILoopKnot, h: number): V3 => [
        terminal[0] + knot.point[0] + h * knot.tangent[0],
        y,
        terminal[2] - knot.point[1] - h * knot.tangent[1],
      ];
      const curve: IAutoMovieCurve64.Cubic = {
        type: "cubicBezier", name: `original.crown.raw.${y}`, closed: true, unit: "mm", phaseUnit: "mm", phaseIntervals: intervals,
        spans: knots.map((knot: AutoMovieMeshExtract.ILoopKnot, i: number): IAutoMovieCurve64.Span => {
          const next: AutoMovieMeshExtract.ILoopKnot = knots[(i + 1) % knots.length]!;
          const h: number = intervals[i]! / 3;
          return [point(knot, 0), point(knot, h), point(next, -h), point(next, 0)];
        }),
      };
      return { coordinateMm: y, loops: [{ winding: 1, curve }] };
    });
    const heights: number[] = [a, ...inside, b];
    sections.splice(1, 0, ...middle);
    intervals.splice(0, 1, ...heights.slice(1).map((afterMm: number, i: number): IAutoMovieContourLoft64.IInterval => ({
      beforeMm: heights[i]!, afterMm, groups: [{ before: [0], after: [0], supported: true, reason: null }],
    })));
    return middle.length;
  }

  function horizontalPlane(y: number, nativeCentre: IAutoMovieCurve64.Vector): AutoMovieMeshCourse.IPlane {
    return { station: y, origin: [nativeCentre[0], y, -nativeCentre[2]], u: [1, 0, 0], v: [0, 0, 1] };
  }

  function crownResidual(mesh: AutoMovieMeshExtract.IMesh, clay: CaptureModel.ITriangles, sections: readonly IAutoMovieContourLoft64.ISection[], terminal: IAutoMovieCurve64.Vector): string {
    const planes: AutoMovieMeshCourse.IPlane[] = sections.slice(1, -1).map((section: IAutoMovieContourLoft64.ISection, i: number): AutoMovieMeshCourse.IPlane =>
      horizontalPlane((sections[i]!.coordinateMm + section.coordinateMm) / 2, terminal),
    );
    return surfaceResidual(mesh, clay, planes);
  }

  /** Compare a generated patch and the raw mesh in the same independent planes. */
  export function surfaceResidual(mesh: AutoMovieMeshExtract.IMesh, clay: CaptureModel.ITriangles, planes: readonly AutoMovieMeshCourse.IPlane[], allowBridges: boolean = true): string {
    const raw: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(mesh, planes);
    const built: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(clay, planes);
    const distances: number[] = raw.flatMap((cut: AutoMovieMeshCourse.ISection, i: number): number[] => {
      const loop: V2[] | null = built[i]!.loop;
      return cut.loop === null || loop === null || (!allowBridges && cut.flags.some((flag: string): boolean => flag.startsWith("bridged:"))) ? [] : [Math.sqrt(Math.max(NodeHeadTrace.directed(cut.loop, loop), NodeHeadTrace.directed(loop, cut.loop)))];
    });
    return `${distances.length}/${planes.length} readable raw midplanes, worst ${distances.length === 0 ? "unavailable" : Math.max(...distances).toFixed(3) + " mm"}`;
  }
}
