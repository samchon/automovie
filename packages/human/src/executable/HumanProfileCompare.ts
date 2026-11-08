import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";

import { HUMAN_INSPECTION_PARTS } from "../inspection/HUMAN_INSPECTION_PARTS";
import { HumanInspectionCurves } from "../inspection/HumanInspectionCurves";
import type { HumanInspectionParts } from "../inspection/HumanInspectionParts";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

/**
 * Tabulates actual original outline crossings against the f1 reference mesh at shared heights.
 *
 * For each requested world height Y, the reference's native triangles are cut by the plane
 * y = Y. The cut's midline crossings (z = 0) give its anterior and posterior profile, and its
 * extreme z its lateral extent; the latter includes every structure at that height, such as an
 * ear. Each requested original's displayed polylines are cut by the same plane, so a scalar
 * outline gives its value at Y and a ring its whole crossing. Both sides use the metre frame the
 * overlay renderer already shares, reported here in millimetres. The table is a diagnostic
 * observation: it fits nothing, feeds no generation and accepts no shape.
 */
export async function HumanProfileCompare(argv: readonly string[]): Promise<void> {
  const options: IOptions = parse(argv);
  const started: number = performance.now();
  const referencePath: string = HumanNodePaths.resolve("test/.shots/f1/reference-model.json");
  const model: IAutoMovieModel = JSON.parse(fs.readFileSync(referencePath, "utf8")) as IAutoMovieModel;
  const meshes: IMesh[] = model.parts.flatMap((part: IAutoMovieModelPart): IMesh[] =>
    part.geometry.type === "mesh" && part.geometry.mesh.indices !== null
      ? [{ id: part.id, positions: part.geometry.mesh.positions, indices: part.geometry.mesh.indices }]
      : [],
  );
  const referenceMilliseconds: number = performance.now() - started;

  const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
  const sourceStarted: number = performance.now();
  const built: HumanInspectionParts.IOutput = HUMAN_INSPECTION_PARTS.get("f1", person.parameters, options.parts);
  const sourceMilliseconds: number = performance.now() - sourceStarted;
  const drawn: ReturnType<typeof HumanInspectionCurves.of> = HumanInspectionCurves.of(built, options.parts);
  const curves: ICurve[] = drawn.curves
    .filter((curve: ICurve): boolean => options.curves.some((pattern: RegExp): boolean => pattern.test(curve.id)))
    .map((curve: ICurve): ICurve => ({ id: curve.id, closed: curve.closed, points: curve.points }));

  // The default height range is the selected curves' own vertical extent.
  const heights: number[] = curves.flatMap((curve: ICurve): number[] => curve.points.map((point: Point): number => point[1] * 1000));
  const from: number = options.from ?? Math.min(...heights);
  const to: number = options.to ?? Math.max(...heights);
  const rows: IRow[] = [];
  for (let y: number = from; y <= to + 1e-9; y += options.step) {
    const reference: IReferenceCut = cut(meshes, y / 1000, options.mesh, options.lateral, options.window);
    const generated: Record<string, number[]> = {};
    for (const curve of curves) {
      const values: number[] = crossings(curve, y / 1000, options.margin !== null || options.pairs.some((pattern: RegExp): boolean => pattern.test(curve.id)));
      if (values.length !== 0) generated[short(curve.id)] = values;
    }

    // Per-part comparison: each part's own crossing box, and the reference cut
    // points inside that box widened by the margin, isolate one limb or
    // feature from its neighbours at the same height (a hand beside a thigh).
    const parts: Record<string, { generated: Box; reference: Box | null }> = {};
    if (options.margin !== null) {
      const points: [number, number][] = cutPoints(meshes, y / 1000, options.mesh);
      for (const [id, values] of Object.entries(generated)) {
        const part: string = id.slice(0, id.lastIndexOf("/"));
        for (let i: number = 0; i + 1 < values.length; i += 2) parts[part] = { generated: grow(parts[part]?.generated ?? null, values[i]!, values[i + 1]!), reference: null };
      }
      for (const entry of Object.values(parts)) {
        const g: Box = entry.generated;
        const m: number = options.margin;
        for (const [x, z] of points)
          if (x >= g[0] - m && x <= g[1] + m && z >= g[2] - m && z <= g[3] + m) entry.reference = grow(entry.reference, x, z);
      }
    }
    rows.push({ y, reference, generated, ...(options.margin === null ? {} : { parts }) });
  }
  const output: Record<string, unknown> = {
    createdUtc: new Date().toISOString(),
    reference: { path: referencePath, meshes: meshes.map((mesh: IMesh): string => mesh.id), milliseconds: referenceMilliseconds },
    parts: options.parts,
    curves: curves.map((curve: ICurve): string => curve.id),

    // Full-precision display samples let two source epochs be compared value
    // for value; they are the same polylines the rows above are cut from.
    ...(options.dump ? { samples: Object.fromEntries(curves.map((curve: ICurve): [string, Point[]] => [curve.id, curve.points])) } : {}),
    sourceMilliseconds,
    observation: built.observation,
    displayDiagnostics: drawn.diagnostics,
    columns: "reference.front/back: midline (z=0) anterior/posterior x, mm; reference.left/right: extreme +z/-z, mm; reference.leftBand/rightBand: x range of cut points beyond the lateral threshold, mm; generated: each curve's plane crossings as x (front/axis) or z (side) or [x,z] pairs for rings and --pairs curves, mm",
    lateral: options.lateral,
    limitation: "Plane crossings of display polylines between their samples are linear; reference lateral extents include every structure at the height.",
    rows,
  };
  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, JSON.stringify(output, null, 2));
  process.stdout.write(JSON.stringify({ event: "complete", out: options.out, rows: rows.length, curves: curves.length, sourceMilliseconds }) + "\n");
}

/** Metre coordinates. */
type Point = [number, number, number];

/** Display polyline in the shared metre frame. */
interface ICurve {
  /** Producer id. */
  id: string;

  /** Whether the last point joins the first. */
  closed: boolean;

  /** Metre samples. */
  points: Point[];
}

/** Native reference triangles in metres. */
interface IMesh {
  /** Reference part id, `head` or `body`. */
  id: string;

  /** Flat metre positions. */
  positions: readonly number[];

  /** Triangle indices. */
  indices: readonly number[];
}

/** Reference cut extents at one height, millimetres; null when the plane misses. */
interface IReferenceCut {
  /** Most anterior midline crossing. */
  front: number | null;

  /** Most posterior midline crossing. */
  back: number | null;

  /** Extreme +z. */
  left: number | null;

  /** Extreme -z. */
  right: number | null;

  /** AP range [min x, max x] of cut points with z at or beyond +lateral, when requested. */
  leftBand: [number, number] | null;

  /** AP range of cut points with z at or beyond -lateral, when requested. */
  rightBand: [number, number] | null;

  /** [min x, max x, min z, max z] of cut points inside the requested window, mm, or null. */
  box: [number, number, number, number] | null;
}

/** One height's comparison. */
interface IRow {
  /** World height, mm. */
  y: number;

  /** Reference extents. */
  reference: IReferenceCut;

  /** Original curve crossings by short id: x for front/axis, z for side, x then z for others. */
  generated: Record<string, number[]>;

  /** Per-part crossing box and the reference cut box inside it widened by the margin, when requested. */
  parts?: Record<string, { generated: Box; reference: Box | null }>;
}

/** [min x, max x, min z, max z], mm. */
type Box = [number, number, number, number];

/** Grows a box by one point. */
function grow(box: Box | null, x: number, z: number): Box {
  return box === null ? [x, x, z, z] : [Math.min(box[0], x), Math.max(box[1], x), Math.min(box[2], z), Math.max(box[3], z)];
}

/** Every reference cut point (x, z) at y = Y, metres in, millimetres out. */
function cutPoints(meshes: readonly IMesh[], y: number, selected: readonly string[]): [number, number][] {
  const points: [number, number][] = [];
  for (const mesh of meshes) {
    if (!selected.includes(mesh.id)) continue;
    const p: readonly number[] = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const i: number = mesh.indices[t + e]! * 3;
        const j: number = mesh.indices[t + ((e + 1) % 3)]! * 3;
        const ay: number = p[i + 1]!;
        const by: number = p[j + 1]!;
        if ((ay - y) * (by - y) > 0 || ay === by) continue;
        const s: number = (y - ay) / (by - ay);
        points.push([(p[i]! + s * (p[j]! - p[i]!)) * 1000, (p[i + 2]! + s * (p[j + 2]! - p[i + 2]!)) * 1000]);
      }
  }
  return points;
}

/** Parsed options; heights in world millimetres. */
interface IOptions {
  /** Original part patterns requested from the inspection provider. */
  parts: string[];

  /** Curve id patterns kept in the table. */
  curves: RegExp[];

  /** Curve id patterns whose crossings are always reported as x and z pairs. */
  pairs: RegExp[];

  /** Lateral threshold for the reference's lateral AP band, mm, or null. */
  lateral: number | null;

  /** Whether the selected curves' full-precision samples are written too. */
  dump: boolean;

  /** Reference window [min x, max x, min z, max z], mm, isolating one limb or region, or null. */
  window: [number, number, number, number] | null;

  /** Margin around each part's own crossing box for its reference box, mm, or null for no per-part boxes. */
  margin: number | null;

  /** Reference meshes cut, `head`, `body` or both. */
  mesh: string[];

  /** Lowest height, or the selected curves' minimum. */
  from: number | null;

  /** Highest height, or the selected curves' maximum. */
  to: number | null;

  /** Height step, mm. */
  step: number;

  /** New JSON file under the Human evidence root. */
  out: string;
}

/** Reads `--parts a,b --curves re1,re2 --mesh head,body --from --to --step --out`. */
function parse(argv: readonly string[]): IOptions {
  const usage: string = "Usage: pnpm --dir packages/human node:profile --parts <a,b> --out <new-json> [--curves <regex,...>] [--pairs <regex,...>] [--lateral <mm>] [--window xmin,xmax,zmin,zmax] [--part-margin <mm>] [--dump] [--mesh head,body] [--from <mm>] [--to <mm>] [--step <mm>]";
  const value: (name: string) => string | undefined = (name: string): string | undefined => {
    const index: number = argv.indexOf(name);
    return index === -1 ? undefined : argv[index + 1];
  };
  const parts: string | undefined = value("--parts");
  const out: string | undefined = value("--out");
  if (parts === undefined || out === undefined) throw new Error(usage);
  const number: (name: string) => number | null = (name: string): number | null => {
    const text: string | undefined = value(name);
    if (text === undefined) return null;
    const parsed: number = Number(text);
    if (!Number.isFinite(parsed)) throw new Error(usage);
    return parsed;
  };
  const step: number = number("--step") ?? 2;
  if (!(step > 0)) throw new Error(usage);
  const evidence: string = HumanNodePaths.resolve("packages/human/.shots");
  const target: string = HumanNodePaths.resolve(out);
  if (!target.startsWith(evidence + path.sep) || fs.existsSync(target)) throw new Error("The table must be a new file under packages/human/.shots");
  return {
    parts: parts.split(","),
    curves: (value("--curves") ?? ".").split(",").map((pattern: string): RegExp => new RegExp(pattern)),
    pairs: (value("--pairs") ?? "(?!)").split(",").map((pattern: string): RegExp => new RegExp(pattern)),
    lateral: number("--lateral"),
    dump: argv.includes("--dump"),
    margin: number("--part-margin"),
    window: ((): [number, number, number, number] | null => {
      const text: string | undefined = value("--window");
      if (text === undefined) return null;
      const bounds: number[] = text.split(",").map(Number);
      if (bounds.length !== 4 || !bounds.every(Number.isFinite)) throw new Error(usage);
      return [bounds[0]!, bounds[1]!, bounds[2]!, bounds[3]!];
    })(),
    mesh: (value("--mesh") ?? "head,body").split(","),
    from: number("--from"),
    to: number("--to"),
    step,
    out: target,
  };
}

/** Cuts the selected reference meshes by y = Y, metres in, millimetres out; `lateral` and `window` are in mm. */
function cut(meshes: readonly IMesh[], y: number, selected: readonly string[], lateral: number | null, window: [number, number, number, number] | null): IReferenceCut {
  let box: [number, number, number, number] | null = null;
  let front: number | null = null;
  let back: number | null = null;
  let left: number | null = null;
  let right: number | null = null;
  let leftBand: [number, number] | null = null;
  let rightBand: [number, number] | null = null;
  const band: (range: [number, number] | null, x: number) => [number, number] = (range: [number, number] | null, x: number): [number, number] =>
    range === null ? [x, x] : [Math.min(range[0], x), Math.max(range[1], x)];
  for (const mesh of meshes) {
    if (!selected.includes(mesh.id)) continue;
    const p: readonly number[] = mesh.positions;
    for (let t: number = 0; t < mesh.indices.length; t += 3) {
      const corners: Point[] = [0, 1, 2].map((k: number): Point => {
        const i: number = mesh.indices[t + k]! * 3;
        return [p[i]!, p[i + 1]!, p[i + 2]!];
      });

      // A triangle crossing the plane contributes one segment between its two crossed edges.
      const ends: Point[] = [];
      for (let e: number = 0; e < 3; e++) {
        const a: Point = corners[e]!;
        const b: Point = corners[(e + 1) % 3]!;
        if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
        const s: number = (y - a[1]) / (b[1] - a[1]);
        ends.push([a[0] + s * (b[0] - a[0]), y, a[2] + s * (b[2] - a[2])]);
      }
      if (ends.length < 2) continue;
      for (const end of ends) {
        left = left === null ? end[2] : Math.max(left, end[2]);
        right = right === null ? end[2] : Math.min(right, end[2]);
        if (lateral !== null && end[2] * 1000 >= lateral) leftBand = band(leftBand, end[0] * 1000);
        if (lateral !== null && end[2] * 1000 <= -lateral) rightBand = band(rightBand, end[0] * 1000);
        const x: number = end[0] * 1000;
        const z: number = end[2] * 1000;
        if (window !== null && x >= window[0] && x <= window[1] && z >= window[2] && z <= window[3])
          box = box === null ? [x, x, z, z] : [Math.min(box[0], x), Math.max(box[1], x), Math.min(box[2], z), Math.max(box[3], z)];
      }
      const [u, v]: Point[] = ends;
      if (u![2] * v![2] <= 0 && u![2] !== v![2]) {
        const x: number = u![0] + ((0 - u![2]) / (v![2] - u![2])) * (v![0] - u![0]);
        front = front === null ? x : Math.max(front, x);
        back = back === null ? x : Math.min(back, x);
      }
    }
  }
  const mm: (value: number | null) => number | null = (value: number | null): number | null => (value === null ? null : value * 1000);
  return { front: mm(front), back: mm(back), left: mm(left), right: mm(right), leftBand, rightBand, box };
}

/**
 * Plane crossings of one polyline, mm: x for front/axis outlines and z for side outlines of a
 * part whose axis is the world vertical; x and z pairs for rings and for every curve of a part
 * drawn in its own tilted frame (`pairs`).
 */
function crossings(curve: ICurve, y: number, pairs: boolean): number[] {
  const kind: string = curve.id.slice(curve.id.lastIndexOf("/") + 1);
  const values: number[] = [];
  const n: number = curve.points.length;
  const last: number = curve.closed ? n : n - 1;
  for (let i: number = 0; i < last; i++) {
    const a: Point = curve.points[i]!;
    const b: Point = curve.points[(i + 1) % n]!;
    if ((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
    const s: number = (y - a[1]) / (b[1] - a[1]);
    const x: number = (a[0] + s * (b[0] - a[0])) * 1000;
    const z: number = (a[2] + s * (b[2] - a[2])) * 1000;
    if (pairs) values.push(x, z);
    else if (kind.startsWith("side.")) values.push(z);
    else if (kind.startsWith("front.") || kind === "axis") values.push(x);
    else values.push(x, z);
  }
  return values.map((value: number): number => Math.round(value * 100) / 100);
}

/** Drops the shared producer prefix. */
function short(id: string): string {
  return id.startsWith(HumanInspectionCurves.PREFIX) ? id.slice(HumanInspectionCurves.PREFIX.length) : id;
}

if (require.main === module)
  HumanProfileCompare(process.argv.slice(2)).catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
