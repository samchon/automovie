import type { IAutoMovieModelPart } from "@automovie/interface";
import { createHash } from "node:crypto";

import { AutoMovieHumanRigBones } from "../../../../packages/human/src/skeleton/AutoMovieHumanRigBones";

/**
 * Pure report folding, source-map decoding and bounded mesh observation for the
 * cold staged Human profile. It starts no generator, inspector session or slot.
 * These observations run after the CPU sampling window; mesh Set/string tally
 * remains an allocation-heavy observer, while the payload digest streams 8 KiB.
 */
export namespace HumanPrepareProfileReport {
  /** Rows per table. */
  const TOP: number = 30;

  /** Rows per stage in the per-stage table. */
  const STAGE_TOP: number = 12;

  /** This file as the profile's places name it, where `timed` and the stage closures live. */
  const FILE: string = "test_human_prepare_profile.ts";

  /** Legacy function/file search targets; absent sampled frames show '-', not proof of no calls. */
  const SUBSTAGES: [string, string, string][] = [
    ["law: neck chain", "generate", "AutoMovieHumanNeckConstruction.ts"],
    ["law: head", "apply", "AutoMovieHumanHeadConstruction.ts"],
    ["law: trunk", "apply", "AutoMovieHumanTrunkConstruction.ts"],
    ["law: skeleton", "derive", "AutoMovieHumanSkeletonLaw.ts"],
    ["law: arms and hands", "add", "AutoMovieHumanArmConstruction.ts"],
    ["law: feet", "add", "AutoMovieHumanFootConstruction.ts"],
    ["law: legs stand", "stand", "AutoMovieHumanLegConstruction.ts"],
    ["law: legs add", "add", "AutoMovieHumanLegConstruction.ts"],
    ["law: event joins", "reconcile", "AutoMovieHumanEventJoin.ts"],
  ];

  /** Legacy file search list; a listed name does not establish that the current pipeline called it. */
  const SUSPECTS: string[] = [
    "AutoMovieHumanSeamUnion.ts",
    "AutoMovieHumanHeadJawJoin.ts",
    "AutoMovieHumanLimbRootStrip.ts",
    "AutoMovieHumanArmScye.ts",
    "AutoMovieHumanTrunkRing.ts",
    "AutoMovieHumanTrunkClosure.ts",
    "AutoMovieHumanTrunkSolver.ts",
    "AutoMovieHumanNeutralShoulder.ts",
    "AutoMovieHumanSeam.ts",
    "AutoMovieStationHermite.ts",
    "AutoMovieLoftChain.ts",
    "AutoMovieHumanBodySurfaceLoft.ts",
  ];

  /**
   * Fold CPU samples (microseconds) into millisecond tables without measuring work.
   * Missing sampling data leaves the observed stage boundaries in the report.
   * Recursive totals count only a function's outermost entries; script maps may
   * be partial, so unmapped locations retain their generated line numbers.
   * The title names the caller's actual observation boundary, not skin validity.
   */
  export function format(name: string, stages: IStage[], profile: IProfile | undefined, coverage: IScriptCoverage[], scripts: Map<string, IScript>, title: string = "cold staged pipeline"): string[] {
    const out: string[] = [];
    const wall: number = stages.reduce((s: number, x: IStage): number => s + x.wall, 0);
    const work: number = stages.reduce((s: number, x: IStage): number => s + x.cpu, 0);
    out.push(`=== ${name}: ${title} (wall ${ms(wall)} ms, thread CPU ${ms(work)} ms, cpu clock ${typeof process.threadCpuUsage === "function" ? "thread" : "process"}) ===`);
    out.push(row(["stage", "wall ms", "cpu ms", "wall %"], [34, 12, 12, 8]));
    for (const s of stages) out.push(row([s.label, ms(s.wall), ms(s.cpu), pct(s.wall, wall)], [34, 12, 12, 8]));

    if (profile === undefined || profile.nodes.length === 0) return [...out, "CPU profile unavailable; see observation cleanup errors."];

    // Self time per node, the call tree's parents and each node's place.
    const byId: Map<number, INode> = new Map<number, INode>(profile.nodes.map((n: INode): [number, INode] => [n.id, n]));
    const parent: Map<number, number> = new Map<number, number>();
    for (const n of profile.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
    const self: Map<number, number> = new Map<number, number>();
    (profile.samples ?? []).forEach((id: number, i: number): void => void self.set(id, (self.get(id) ?? 0) + (profile.timeDeltas?.[i] ?? 0) / 1000));
    const sampled: number = [...self.values()].reduce((s: number, v: number): number => s + v, 0);
    const place: Map<number, IPlace> = new Map<number, IPlace>();
    for (const n of profile.nodes) place.set(n.id, locate(scripts.get(n.callFrame.scriptId), n.callFrame.url, n.callFrame.lineNumber, n.callFrame.columnNumber));
    const key: (id: number) => string = (id: number): string => {
      const n: INode = byId.get(id)!;
      const p: IPlace = place.get(id)!;
      return `${n.callFrame.functionName || "(anonymous)"} ${p.file}:${p.line}`;
    };

    // Subtree time, then totals per function and per file with recursion once.
    const subtree: Map<number, number> = new Map<number, number>();
    const order: number[] = [];
    const stack: number[] = [profile.nodes[0]!.id];
    while (stack.length > 0) {
      const id: number = stack.pop()!;
      order.push(id);
      for (const c of byId.get(id)!.children ?? []) stack.push(c);
    }
    for (let i: number = order.length - 1; i >= 0; --i) {
      const id: number = order[i]!;
      subtree.set(id, (self.get(id) ?? 0) + (byId.get(id)!.children ?? []).reduce((s: number, c: number): number => s + (subtree.get(c) ?? 0), 0));
    }
    const selfBy: Map<string, number> = new Map<string, number>();
    const totalBy: Map<string, number> = new Map<string, number>();
    const fileSelf: Map<string, number> = new Map<string, number>();
    const fileTotal: Map<string, number> = new Map<string, number>();
    const visit: (id: number, keys: Map<string, number>, files: Map<string, number>) => void = (id: number, keys: Map<string, number>, files: Map<string, number>): void => {
      const k: string = key(id);
      const f: string = place.get(id)!.file;
      add(selfBy, k, self.get(id) ?? 0);
      add(fileSelf, f, self.get(id) ?? 0);
      if ((keys.get(k) ?? 0) === 0) add(totalBy, k, subtree.get(id) ?? 0);
      if ((files.get(f) ?? 0) === 0) add(fileTotal, f, subtree.get(id) ?? 0);
      add(keys, k, 1);
      add(files, f, 1);
      for (const c of byId.get(id)!.children ?? []) visit(c, keys, files);
      add(keys, k, -1);
      add(files, f, -1);
    };
    visit(profile.nodes[0]!.id, new Map<string, number>(), new Map<string, number>());

    // Call counts per function from the precise coverage.
    const calls: Map<string, number> = new Map<string, number>();
    for (const c of coverage) {
      const s: IScript | undefined = scripts.get(c.scriptId);
      for (const fn of c.functions) {
        const range: { startOffset: number; count: number } | undefined = fn.ranges[0];
        if (range === undefined || s === undefined) continue;
        const [line, column]: [number, number] = position(s, range.startOffset);
        const p: IPlace = locate(s, c.url, line, column);
        add(calls, `${fn.functionName || "(anonymous)"} ${p.file}:${p.line}`, range.count);
      }
    }
    const count: (k: string) => string = (k: string): string => (calls.has(k) ? calls.get(k)!.toLocaleString("en-US") : "-");

    out.push("", `=== legacy function search targets (sampled ${ms(sampled)} ms; '-' means absent from this call tree) ===`);
    out.push(row(["sub-stage", "total ms", "% sampled", "calls"], [34, 12, 10, 12]));
    for (const [label, fn, file] of SUBSTAGES) {
      const found: [string, number] | undefined = [...totalBy.entries()].find(([k]: [string, number]): boolean => k.startsWith(fn + " " + file + ":"));
      out.push(row([label, found === undefined ? "-" : ms(found[1]), found === undefined ? "-" : pct(found[1], sampled), found === undefined ? "-" : count(found[0])], [34, 12, 10, 12]));
    }

    out.push("", "=== legacy file search targets (sampled total entered once, self; '-' means absent) ===");
    for (const file of SUSPECTS) {
      const total: number | undefined = fileTotal.get(file);
      const own: number | undefined = fileSelf.get(file);
      out.push(row([file, total === undefined ? "-" : ms(total), total === undefined ? "-" : pct(total, sampled), own === undefined ? "-" : ms(own)], [40, 12, 8, 12]));
    }

    const table: (title: string, values: Map<string, number>, withCalls: boolean) => void = (title: string, values: Map<string, number>, withCalls: boolean): void => {
      out.push("", `=== ${title} ===`);
      const top: [string, number][] = [...values.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, TOP);
      for (const [k, v] of top) out.push(row([ms(v), pct(v, sampled), withCalls ? count(k) : "", k], [12, 8, withCalls ? 14 : 0, 0]));
    };
    table(`top ${TOP} files by self time`, fileSelf, false);
    table(`top ${TOP} files by total time (entered once)`, fileTotal, false);
    table(`top ${TOP} functions by self time (ms, %, calls, function file:line)`, selfBy, true);
    table(`top ${TOP} functions by total time (ms, %, calls, function file:line)`, totalBy, true);
    out.push("", `=== top ${TOP} functions by call count ===`);
    for (const [k, v] of [...calls.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, TOP))
      out.push(row([v.toLocaleString("en-US"), selfBy.has(k) ? `${ms(selfBy.get(k)!)} ms self` : "", k], [16, 16, 0]));

    // Each stage's own hottest functions: a sample's self time belongs to the
    // stage closure `timed` called above it (named by its line in `run`).
    const stageOf: Map<number, string | null> = new Map<number, string | null>();
    const stage = (id: number): string | null => {
      const known: string | null | undefined = stageOf.get(id);
      if (known !== undefined) return known;
      const up: number | undefined = parent.get(id);
      const found: string | null = up === undefined ? null : byId.get(up)!.callFrame.functionName === "timed" && place.get(up)!.file === FILE ? key(id) : stage(up);
      stageOf.set(id, found);
      return found;
    };
    const byStage: Map<string, Map<string, number>> = new Map<string, Map<string, number>>();
    for (const n of profile.nodes) {
      const s: string | null = stage(n.id);
      const v: number = self.get(n.id) ?? 0;
      if (s === null || v === 0) continue;
      let m: Map<string, number> | undefined = byStage.get(s);
      if (m === undefined) byStage.set(s, (m = new Map<string, number>()));
      add(m, key(n.id), v);
    }
    out.push("", `=== each stage's top ${STAGE_TOP} functions by self time (stage closure in run, then ms, %, function file:line) ===`);
    for (const [s, m] of [...byStage.entries()].sort((a: [string, Map<string, number>], b: [string, Map<string, number>]): number => Number(a[0].split(":").pop()) - Number(b[0].split(":").pop()))) {
      const total: number = [...m.values()].reduce((x: number, y: number): number => x + y, 0);
      out.push(`- ${s}: ${ms(total)} ms sampled`);
      for (const [k, v] of [...m.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, STAGE_TOP)) out.push(row(["", ms(v), pct(v, total), k], [4, 12, 8, 0]));
    }

    // The call paths that carry the hottest functions' self time.
    out.push("", "=== call paths of the 8 hottest functions by self time (innermost first, project frames) ===");
    const hottest: string[] = [...selfBy.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, 8).map(([k]: [string, number]): string => k);
    for (const target of hottest) {
      const paths: Map<string, number> = new Map<string, number>();
      for (const n of profile.nodes) {
        if (key(n.id) !== target || (self.get(n.id) ?? 0) === 0) continue;
        const chain: string[] = [];
        for (let at: number | undefined = parent.get(n.id); at !== undefined && chain.length < 14; at = parent.get(at)) {
          const url: string = byId.get(at)!.callFrame.url;
          if (!url.includes("packages/human") && !url.includes("packages\\human")) continue;
          const k: string = key(at);
          if (chain[chain.length - 1] !== k) chain.push(k);
        }
        add(paths, chain.join(" < "), self.get(n.id)!);
      }
      out.push(`- ${target}: ${ms(selfBy.get(target)!)} ms self, ${count(target)} calls`);
      for (const [p, v] of [...paths.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).slice(0, 3)) out.push(`    ${ms(v)} ms  < ${p}`);
    }
    return out;
  }

  /**
   * The bound meshes by family (the first three segments of the part id), with
   * their parts, vertices, distinct vertex places and triangles, and whether
   * the binding reads each vertex's place or rides one bone; then the digit
   * chains' triangles.
   */
  export function meshes(parts: IAutoMovieModelPart[]): string[] {
    const families: Map<string, [number, number, number, number, boolean]> = new Map<string, [number, number, number, number, boolean]>();
    const chains: Map<string, number> = new Map<string, number>();
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const family: string = part.id.split(".").slice(0, 3).join(".").split("/")[0]!;
      const positions: readonly number[] = part.geometry.mesh.positions;
      const places: Set<string> = new Set<string>();
      for (let i: number = 0; i < positions.length; i += 3) places.add(`${positions[i]},${positions[i + 1]},${positions[i + 2]}`);
      const triangles: number = (part.geometry.mesh.indices?.length ?? positions.length / 3) / 3;
      const entry: [number, number, number, number, boolean] = families.get(family) ?? [0, 0, 0, 0, AutoMovieHumanRigBones.rigid(part.id) === undefined];
      entry[0] += 1;
      entry[1] += positions.length / 3;
      entry[2] += places.size;
      entry[3] += triangles;
      families.set(family, entry);
      const digit: RegExpMatchArray | null = part.id.match(/^human\.skin\.((?:finger|thumb|toe)\.[^/]+)\//);
      if (digit !== null) add(chains, digit[1]!, triangles);
    }
    const out: string[] = ["=== bound meshes by family (parts, vertices, distinct places within a part, triangles, binding) ==="];
    const rows: [string, [number, number, number, number, boolean]][] = [...families.entries()].sort((a: [string, [number, number, number, number, boolean]], b: [string, [number, number, number, number, boolean]]): number => b[1][1] - a[1][1]);
    for (const [family, [count, vertices, places, triangles, placed]] of rows)
      out.push(row([family, String(count), String(vertices), String(places), String(triangles), placed ? "per vertex" : "rigid"], [40, 8, 10, 10, 10, 0]));
    const perVertex: number = rows.filter(([, e]: [string, [number, number, number, number, boolean]]): boolean => e[4]).reduce((s: number, [, e]: [string, [number, number, number, number, boolean]]): number => s + e[1], 0);
    out.push(`per-vertex bound vertices: ${perVertex}`);
    const digits: number[] = [...chains.values()];
    if (digits.length > 0)
      out.push(`digit chains: ${digits.length}, triangles per chain min ${Math.min(...digits)} mean ${(digits.reduce((s: number, v: number): number => s + v, 0) / digits.length).toFixed(0)} max ${Math.max(...digits)}`);
    return out;
  }


  /** Ordered bound mesh payload signature; excludes materials, transforms and nonmesh payloads. */
  export function geometry(parts: IAutoMovieModelPart[]): {
    /** Hex SHA-256 of this ordered payload, not all model state. */ sha256: string;
    /** Number of mesh parts included; nonmesh parts are omitted. */ meshParts: number;
    /** Position scalar count divided by three, including repeated places. */ vertices: number;
    /** Index count divided by three, or vertex count divided by three when unindexed. */ triangles: number;
    /** Encoding and included fields, so the digest's limits remain explicit. */ scope: string;
  } {
    const hash: ReturnType<typeof createHash> = createHash("sha256");
    const buffer: Buffer = Buffer.allocUnsafe(8192);
    let used: number = 0;
    let meshParts: number = 0;
    let vertices: number = 0;
    let triangles: number = 0;
    /** Feed bounded little-endian double chunks, without copying a mesh array. */
    const feed: (values: readonly number[]) => void = (values: readonly number[]): void => {
      for (const value of values) {
        buffer.writeDoubleLE(value, used);
        used += 8;
        if (used === buffer.length) { hash.update(buffer); used = 0; }
      }
      if (used !== 0) { hash.update(buffer.subarray(0, used)); used = 0; }
    };
    for (const part of parts) {
      if (part.geometry.type !== "mesh") continue;
      const positions: readonly number[] = part.geometry.mesh.positions;
      const indices: readonly number[] = part.geometry.mesh.indices ?? [];
      hash.update(part.id).update("\0");
      feed([positions.length, indices.length]);
      feed(positions);
      feed(indices);
      meshParts++;
      vertices += positions.length / 3;
      triangles += (indices.length || positions.length / 3) / 3;
    }
    return { sha256: hash.digest("hex"), meshParts, vertices, triangles, scope: "ordered mesh part ids, positions and indices; float64 little-endian" };
  }

  /** Add to a tally. */
  function add(map: Map<string, number>, k: string, v: number): void {
    map.set(k, (map.get(k) ?? 0) + v);
  }

  /** A table row. */
  function row(cells: string[], widths: number[]): string {
    return cells.map((c: string, i: number): string => (widths[i]! > 0 ? c.padEnd(widths[i]!) : c)).join(" ").trimEnd();
  }

  /** Milliseconds, one decimal. */
  function ms(v: number): string {
    return v.toFixed(1);
  }

  /** A share, percent. */
  function pct(v: number, of: number): string {
    return of > 0 ? `${((100 * v) / of).toFixed(1)}%` : "-";
  }

  /** Folder stamp `yyyyMMdd-HHmm`, local time. */
  export function stamp(at: Date): string {
    const two: (v: number) => string = (v: number): string => String(v).padStart(2, "0");
    return `${at.getFullYear()}${two(at.getMonth() + 1)}${two(at.getDate())}-${two(at.getHours())}${two(at.getMinutes())}`;
  }

  /** A script's line starts and its inline source map, decoded. */
  export function script(source: string): IScript {
    const sha256: string = createHash("sha256").update(source).digest("hex");
    const starts: number[] = [0];
    for (let i: number = 0; i < source.length; ++i) if (source.charCodeAt(i) === 10) starts.push(i + 1);
    const match: RegExpMatchArray | null = source.match(/\/\/[#@] sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,([A-Za-z0-9+/=]+)\s*$/);
    if (match === null) return { starts, sources: [], mappings: [], sha256 };
    const map: { sources: string[]; mappings: string } = JSON.parse(Buffer.from(match[1]!, "base64").toString("utf8"));
    const mappings: [number, number, number][][] = [];
    let source0: number = 0;
    let line0: number = 0;
    for (const text of map.mappings.split(";")) {
      const segments: [number, number, number][] = [];
      let column: number = 0;
      for (const segment of text.split(",")) {
        if (segment === "") continue;
        const v: number[] = vlq(segment);
        column += v[0]!;
        if (v.length >= 4) {
          source0 += v[1]!;
          line0 += v[2]!;
          segments.push([column, source0, line0]);
        }
      }
      mappings.push(segments);
    }
    return { starts, sources: map.sources.map((s: string): string => s.split(/[\\/]/).pop() ?? s), mappings, sha256 };
  }

  /** Decode one Base64 VLQ segment. */
  function vlq(segment: string): number[] {
    const out: number[] = [];
    let value: number = 0;
    let shift: number = 0;
    for (const ch of segment) {
      const digit: number = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(ch);
      value += (digit & 31) << shift;
      if ((digit & 32) !== 0) shift += 5;
      else {
        out.push((value & 1) === 1 ? -(value >>> 1) : value >>> 1);
        value = 0;
        shift = 0;
      }
    }
    return out;
  }

  /** A generated offset as a zero-based line and column. */
  function position(s: IScript, offset: number): [number, number] {
    let lo: number = 0;
    let hi: number = s.starts.length - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (s.starts[mid]! <= offset) lo = mid;
      else hi = mid - 1;
    }
    return [lo, offset - s.starts[lo]!];
  }

  /** A generated position as the original file and one-based line. */
  function locate(s: IScript | undefined, url: string, line: number, column: number): IPlace {
    const file: string = (url.split(/[\\/]/).pop() ?? "").replace(/\?.*$/, "") || "(native)";
    const segments: [number, number, number][] | undefined = s?.mappings[line];
    if (s === undefined || segments === undefined || segments.length === 0) return { file, line: line + 1 };
    let best: [number, number, number] = segments[0]!;
    for (const seg of segments) if (seg[0] <= column) best = seg;
    return { file: s.sources[best[1]] ?? file, line: best[2] + 1 };
  }

  /** One timed stage. */
  export interface IStage {
    /** Operation name. */ label: string;
    /** Milliseconds until success or throw. */ wall: number;
    /** Thread CPU milliseconds, or process CPU where the thread clock is unavailable. */ cpu: number;
    /** Whether the operation returned normally. */ status: "completed" | "failed";
    /** Node memory fields in bytes at entry, not peak values. */ before: NodeJS.MemoryUsage;
    /** Node memory fields in bytes after return or throw; absent if that observation failed. */ after?: NodeJS.MemoryUsage;
    /** Original operation error text, when it threw. */ error?: string;
  }

  /** Original place of a frame. */
  export interface IPlace {
    /** Original source basename, generated basename when unmapped, or (native). */ file: string;
    /** One-based source/generated line; native or unavailable locations may be zero. */ line: number;
  }

  /** A script's lines and decoded source map. */
  export interface IScript {
    /** Zero-based UTF-16 offsets of generated line starts, beginning at zero. */ starts: number[];
    /** Source basenames in the inline source map's source-index order. */ sources: string[];
    /** Per zero-based generated line: [UTF-16 column, source index, original line], all zero-based. */ mappings: [number, number, number][][];
    /** Hex SHA-256 of the actual inspector script text encoded as UTF-8. */ sha256: string;
  }

  /** A V8 CPU profile. */
  export interface IProfile {
    /** Call-tree nodes returned by V8, with the root first. */ nodes: INode[];
    /** Top-of-stack node IDs per sample; absent if V8 supplied no sampling array. */ samples?: number[];
    /** Microseconds between samples, first relative to startTime; absent if V8 omitted the deltas. */ timeDeltas?: number[];
    /** V8 profiling start timestamp, microseconds. */ startTime: number;
    /** V8 profiling end timestamp, microseconds. */ endTime: number;
  }

  /** One call-tree node of a V8 CPU profile. */
  export interface INode {
    /** Unique node ID within this profile. */ id: number;
    /** Location of this node's function in V8's loaded generated script. */
    callFrame: {
      /** V8 function name; an anonymous function may have an empty name. */ functionName: string;
      /** Inspector script identifier; "0" denotes a native/unavailable script here. */ scriptId: string;
      /** V8 script URL, possibly empty for native frames. */ url: string;
      /** V8 generated line value; source locations are zero-based. */ lineNumber: number;
      /** V8 generated column value; source locations use zero-based UTF-16 columns. */ columnNumber: number;
    };
    /** Child node IDs, absent when V8 records no children. */ children?: number[];
  }

  /** One script's precise coverage. */
  export interface IScriptCoverage {
    /** Inspector ID of the loaded JavaScript script. */ scriptId: string;
    /** Inspector URL of that loaded script. */ url: string;
    /** Precise coverage functions reported for this script. */
    functions: {
      /** JavaScript function name, possibly empty for anonymous code. */ functionName: string;
      /** V8 source ranges; this report reads the first function range's count. */
      ranges: {
        /** Zero-based UTF-16 start offset in the script text. */ startOffset: number;
        /** Exclusive UTF-16 end offset in the script text. */ endOffset: number;
        /** Executions recorded by precise coverage for this range. */ count: number;
      }[];
    }[];
  }
}
