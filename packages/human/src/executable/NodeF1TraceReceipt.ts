import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AutoMovieMeshExtract } from "@automovie/engine";

import { HumanNodePaths } from "./HumanNodePaths";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = [number, number, number];

/**
 * `node:f1-trace`: the complete source observation of one straight traced
 * course on f1's own reference mesh, in her own world (the native artifact in
 * calibration mm with Z negated, `NodeTrunkReference.load`, and no
 * registration to a generated datum).
 *
 * Every station of the course is cut once by `AutoMovieMeshExtract.outline`
 * as one family along the course normal, so the extraction's own neighbour
 * jump flags are computed (over the whole cut's extremes, other bodies in the
 * plane included), and the receipt keeps, per station: every chained piece
 * (closed or open, its point count, signed-area magnitude and chart box),
 * every outer piece after the extraction's bridging with its points
 * (`outerPoints`), which outer piece holds the axis point, that piece's four
 * chart extents, and every flag in full. Nothing is filtered, cropped or
 * truncated, and the console prints one line per station.
 *
 * The receipt identifies its inputs by their bytes: the SHA-256 of every file
 * that generates the observation ({@link SOURCES}: this entry, the reference
 * loader and its mesh adapter, the path helper, the engine extraction and the
 * reference artifact itself), hashed on disk at entry and again at exit, with
 * the files whose bytes changed in between listed; the checkout head and its
 * dirty paths are kept beside them as context only, since two different
 * dirty versions share both. Neither hash certifies the bytes `ttsx`
 * compiled before the entry ran.
 *
 * Usage: `pnpm --dir packages/human run node:f1-trace -- --from 831.32 --to
 * 1458 --step 2 [--probe 1100] [--out <dir>]`. The course is vertical (`u` =
 * +X anterior, `v` = +Z, stations along `v x u` = +Y, world height), its
 * origin the middle of the four extents of the outer piece holding the world
 * origin's vertical line at the probe height.
 */
export namespace NodeF1TraceReceipt {
  /** The files that generate the observation, repository-relative; their bytes identify the receipt. */
  export const SOURCES: readonly string[] = [
    "packages/human/src/executable/NodeF1TraceReceipt.ts",
    "packages/human/src/executable/NodeTrunkReference.ts",
    "packages/human/src/executable/HumanNodePaths.ts",
    "packages/human/src/inspection/HumanInspectionReferenceMesh.ts",
    "packages/engine/src/geometry/extract/AutoMovieMeshExtract.ts",
    "test/.shots/f1/reference-model.json",
  ];

  /** One chained or outer piece of a cut. */
  export interface IPiece {
    /** Whether the chain closes. */
    closed: boolean;

    /** Its point count. */
    points: number;

    /** Its signed-area magnitude, mm^2 (zero for fewer than three points). */
    area: number;

    /** Chart box `[min u, max u, min v, max v]`, mm about the station's axis point. */
    box: [number, number, number, number];

    /** Whether the axis point lies inside it (even-odd; false for an open chain). */
    holdsAxis: boolean;
  }

  /** One station's complete reading. */
  export interface ICut {
    /** Station, mm (world height). */
    station: number;

    /** Crossing points of the cut. */
    count: number;

    /** Every chained piece before bridging. */
    loops: IPiece[];

    /** The outer pieces after bridging, largest first. */
    outer: IPiece[];

    /** Index in `outer` of the piece holding the axis point, or -1. */
    holding: number;

    /** Every flag of the cut, in full. */
    flags: string[];

    /** Every outer piece's points, chart mm, in `outer` order. */
    outerPoints: [number, number][][];
  }

  /** The receipt's source identity. */
  export interface ISource {
    /** SHA-256 of each of {@link SOURCES} on disk at entry, or `missing`. */
    entry: Record<string, string>;

    /** The same at exit. */
    exit: Record<string, string>;

    /** Files whose bytes differ between entry and exit: the run may have read either version. */
    changed: string[];

    /** The checkout head, context only. */
    head: string;

    /** `git status --porcelain`, context only. */
    dirty: string;

    /** What the hashes do not certify. */
    limit: string;
  }

  /** Read the arguments, cut, print and write the receipt. */
  export async function run(): Promise<void> {
    const entry: Record<string, string> = hashes();
    const args: Map<string, string> = new Map();
    const argv: string[] = process.argv.slice(2).filter((a: string): boolean => a !== "--");
    for (let i: number = 0; i + 1 < argv.length; i += 2) args.set(argv[i]!.replace(/^--/, ""), argv[i + 1]!);
    const from: number = Number(args.get("from") ?? 831.32);
    const to: number = Number(args.get("to") ?? 1458);
    const step: number = Number(args.get("step") ?? 2);
    const probe: number = Number(args.get("probe") ?? 1100);
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = path.resolve(args.get("out") ?? HumanNodePaths.resolve(`packages/human/.shots/f1_trace/receipt-${stamp}`));

    const t0: number = performance.now();
    const loaded: NodeTrunkReference.IMesh = NodeTrunkReference.load(1);
    const mesh: AutoMovieMeshExtract.IMesh = { positions: loaded.points.flat(), indices: loaded.triangles.flat() };
    const t1: number = performance.now();

    // The course origin: the middle of the four extents of the outer piece
    // holding the world origin's vertical line at the probe height.
    const up: V3 = [0, 1, 0];
    const u: V3 = [1, 0, 0];
    const v: V3 = [0, 0, 1];
    const first: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline(mesh, { origin: [0, 0, 0], axes: [up, u, v] }, [probe], 0, 0.5)[0]!;
    const held: AutoMovieMeshExtract.ILoop | undefined = first.outer.find((l: AutoMovieMeshExtract.ILoop): boolean => inside(l.points, 0, 0));
    if (held === undefined) throw new Error(`node:f1-trace: no outer piece holds the world origin's vertical line at ${probe} mm`);
    const box0: [number, number, number, number] = box(held.points);
    const origin: V3 = [(box0[0] + box0[1]) / 2, 0, (box0[2] + box0[3]) / 2];

    // One family along the course, so the extraction computes its jump flags.
    const stations: number[] = [];
    for (let s: number = from; s < to - 1e-9; s += step) stations.push(Number(s.toFixed(6)));
    stations.push(to);
    const sections: AutoMovieMeshExtract.ISection[] = AutoMovieMeshExtract.outline(mesh, { origin, axes: [up, u, v] }, stations, 0, 0.5);
    const t2: number = performance.now();
    const cuts: ICut[] = sections.map((section: AutoMovieMeshExtract.ISection): ICut => {
      const outer: IPiece[] = section.outer.map((l: AutoMovieMeshExtract.ILoop): IPiece => piece(l));
      return {
        station: section.station,
        count: section.count,
        loops: section.loops.map((l: AutoMovieMeshExtract.ILoop): IPiece => piece(l)),
        outer,
        holding: outer.findIndex((p: IPiece): boolean => p.holdsAxis),
        flags: section.flags,
        outerPoints: section.outer.map((l: AutoMovieMeshExtract.ILoop): [number, number][] => l.points),
      };
    });

    // One line per station: pieces, the holding piece's extents, every flag.
    for (const c of cuts) {
      const h: IPiece | undefined = c.outer[c.holding];
      const loops: string = `${c.loops.filter((p: IPiece): boolean => p.closed).length} closed + ${c.loops.filter((p: IPiece): boolean => !p.closed).length} open`;
      const extents: string = h === undefined ? "no holding piece" : `holding #${c.holding} area ${h.area.toFixed(0)} +u ${h.box[1].toFixed(2)} -u ${h.box[0].toFixed(2)} +v ${h.box[3].toFixed(2)} -v ${h.box[2].toFixed(2)}`;
      const others: string = c.outer.filter((_: IPiece, k: number): boolean => k !== c.holding).map((p: IPiece): string => `[${p.area.toFixed(0)} u ${p.box[0].toFixed(0)}..${p.box[1].toFixed(0)} v ${p.box[2].toFixed(0)}..${p.box[3].toFixed(0)}]`).join(" ");
      console.log(`${c.station.toFixed(2)} | ${c.count} crossings, ${loops}, ${c.outer.length} outer | ${extents} | others ${others || "none"} | flags ${c.flags.join("; ") || "none"}`);
    }

    // The source identity at exit, beside the entry's.
    const exit: Record<string, string> = hashes();
    const source: ISource = {
      entry,
      exit,
      changed: SOURCES.filter((name: string): boolean => entry[name] !== exit[name]),
      head: git(["rev-parse", "HEAD"]),
      dirty: git(["status", "--porcelain"]),
      limit: "file bytes hashed on disk at entry and exit; a file changed between them is listed, and neither hash certifies the bytes ttsx compiled before the entry ran",
    };
    fs.mkdirSync(out, { recursive: true });
    const receipt: string = path.join(out, "receipt.json");
    fs.writeFileSync(receipt, JSON.stringify({ source, reference: "test/.shots/f1/reference-model.json (NodeTrunkReference.load(1): metres to mm, Z negated, unregistered)", course: { origin, u, v, normal: up, probe, from, to, step }, ms: { load: t1 - t0, cut: t2 - t1 }, cuts }));
    console.log(`node:f1-trace: head ${source.head}, changed during run [${source.changed.join(", ")}], origin (${origin[0].toFixed(3)}, ${origin[2].toFixed(3)}) mm, ${cuts.length} cuts, load ${(t1 - t0).toFixed(0)} ms, cut ${(t2 - t1).toFixed(0)} ms, receipt ${receipt}`);
  }

  /** SHA-256 of each source file's bytes on disk, or `missing`. */
  function hashes(): Record<string, string> {
    return Object.fromEntries(
      SOURCES.map((name: string): [string, string] => {
        const file: string = HumanNodePaths.resolve(name);
        return [name, fs.existsSync(file) ? createHash("sha256").update(fs.readFileSync(file)).digest("hex") : "missing"];
      }),
    );
  }

  /** A git reading at the repository root, trimmed. */
  function git(args: string[]): string {
    return execFileSync("git", args, { cwd: HumanNodePaths.root(), encoding: "utf8" }).trim();
  }

  /** A piece's record. */
  function piece(l: AutoMovieMeshExtract.ILoop): IPiece {
    return { closed: l.closed, points: l.points.length, area: l.points.length < 3 ? 0 : Math.abs(shoelace(l.points)), box: box(l.points), holdsAxis: l.closed && inside(l.points, 0, 0) };
  }

  /** Chart box `[min u, max u, min v, max v]`. */
  function box(points: readonly [number, number][]): [number, number, number, number] {
    let b: [number, number, number, number] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [a, c] of points) b = [Math.min(b[0], a), Math.max(b[1], a), Math.min(b[2], c), Math.max(b[3], c)];
    return b;
  }

  /** Signed shoelace area, positive counter-clockwise. */
  function shoelace(points: readonly [number, number][]): number {
    let out: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: [number, number] = points[i]!;
      const q: [number, number] = points[(i + 1) % points.length]!;
      out += (p[0] * q[1] - q[0] * p[1]) / 2;
    }
    return out;
  }

  /** Even-odd point in polygon. */
  function inside(poly: readonly [number, number][], x: number, y: number): boolean {
    let c: boolean = false;
    for (let i: number = 0, j: number = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
}

void NodeF1TraceReceipt.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
