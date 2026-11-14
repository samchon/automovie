import fs from "node:fs/promises";
import path from "node:path";
import { realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicNearest as D } from "./FamilyConicNearest";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Where the generated f1 leaves its reference, as a map: every triangle of the generated skin is painted by how far it stands from the
 * reference skin, outside it in warm colours and inside it in cold ones, and the places it stands farthest are listed.
 *
 * The clay frames of `FamilyConicFigure.ts` show a defect only where the light happens to catch it. This measures instead: each generated
 * vertex's distance to the nearest reference triangle, signed by that triangle's side (`FamilyConicNearest`, the measure the knot-flow
 * check reads as well). The list is of 30 mm cells of space on the figure's
 * +Z half, the worst first, each with its centre, its mean distance and its farthest one.
 *
 * Usage: `FamilyConicDeviation.ts`: writes the frames and `deviation.json` under `test/.shots/family-conic-deviation/`.
 *
 * `--owners[=<x0>,<y0>,<z0>,<x1>,<y1>,<z1>]` (mm; absent, every cell) also names what makes each place: the figure is realized from its
 * construction directly, so every triangle keeps the face that owns it, and `owners.json` lists each cell of the box, `--owner-cell=<mm>`
 * on a side (absent, 30), with every owner in it: its area, its mean and farthest signed distance, the stations and phases of its chart
 * there, and the sharpest fold between two triangles whose shared edge lies in the cell. The same zones are drawn by owner
 * (`owners.<zone>.<view>.png`, the colours in `owners.json`). A mark the deviation map shows is then the owner's that stands there, at
 * the station that draws it, instead of a guess from the mark's place.
 */
namespace FamilyConicDeviation {
  type V3 = D.V3;

  /** The realized skin with its owners (`--owners`). */
  type IMesh = NonNullable<ReturnType<typeof realizeAutoMovieConstruction>["mesh"]>;

  /** Edge of the cells the reference triangles are filed in, mm. */
  const CELL_MM: number = D.CELL_MM;

  /** Edge of the cells the report lists, mm. */
  const REPORT_MM: number = 30;

  /** The bins: a triangle whose mean signed distance is below `under` mm takes the colour; the last takes the rest. */
  const BINS: { under: number; colour: V3 }[] = [
    { under: -4, colour: [0.05, 0.1, 0.6] },
    { under: -2, colour: [0.15, 0.35, 0.85] },
    { under: -1, colour: [0.45, 0.65, 0.9] },
    { under: 1, colour: [0.64, 0.65, 0.67] },
    { under: 2, colour: [0.9, 0.8, 0.35] },
    { under: 4, colour: [0.9, 0.45, 0.1] },
    { under: Infinity, colour: [0.75, 0.05, 0.05] },
  ];

  /** Measure, paint and list. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-deviation", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    // With `--owners` the figure is realized here, as `AutoMovieHumanF1.create` realizes it, so its mesh keeps each vertex's owner; the
    // loose families `create` adds as pieces of their own have no owner faces, and there are none.
    const ownersArgument: string | undefined = process.argv.find((argument: string): boolean => argument === "--owners" || argument.startsWith("--owners="));
    const realized: { mesh: IMesh; diagnostics: string[] } | null = ((): { mesh: IMesh; diagnostics: string[] } | null => {
      if (ownersArgument === undefined) return null;
      if (AutoMovieHumanF1.LOOSE.length > 0) throw new Error("--owners: the figure has loose families, which carry no owner faces");
      const declared = AutoMovieHumanF1.construction();
      const real = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
      const diagnostics: string[] = real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => d.node + " (" + d.contract + "): " + d.detail);
      if (real.mesh === null) throw new Error("--owners: the figure realized no mesh: " + diagnostics.join("; "));
      return { mesh: real.mesh, diagnostics };
    })();
    const pieces: AutoMovieHumanF1.IPiece[] = realized === null ? AutoMovieHumanF1.create() : [{ name: "body", positions: Array.from(realized.mesh.positions), indices: Array.from(realized.mesh.indices), diagnostics: realized.diagnostics }];
    const source: R.ISource = await R.load(root);

    // The reference triangles, filed by every cell their box touches, and the signed distance to the nearest of them (`FamilyConicNearest`).
    const reference: D.IGrid = D.grid([source.body, source.head]);
    const triangles: [V3, V3, V3][] = reference.triangles;
    const key = (i: number, j: number, k: number): string => i + "," + j + "," + k;
    const distance = (p: V3): number | null => D.distance(reference, p);

    // Every generated triangle into its bin, and its area and distance into its report cell.
    const binned: { positions: number[]; indices: number[] }[] = BINS.map((): { positions: number[]; indices: number[] } => ({ positions: [], indices: [] }));
    const report: Map<string, { area: number; sum: number; absolute: number; farthest: number }> = new Map();
    let total: number = 0;
    let area: number = 0;
    let outside: number = 0;
    // The sewn skin's signed distances by vertex, which `--owners` reads again by owner.
    let bodyAt: (number | null)[] = [];
    for (const piece of pieces) {
      const at: (number | null)[] = Array.from({ length: piece.positions.length / 3 }, (_: unknown, v: number): number | null => distance([piece.positions[v * 3]! * 1000, piece.positions[v * 3 + 1]! * 1000, piece.positions[v * 3 + 2]! * 1000]));
      if (piece.name === "body") bodyAt = at;
      for (let t: number = 0; t + 2 < piece.indices.length; t += 3) {
        const corners: number[] = [piece.indices[t]!, piece.indices[t + 1]!, piece.indices[t + 2]!];
        const points: V3[] = corners.map((v: number): V3 => [piece.positions[v * 3]! * 1000, piece.positions[v * 3 + 1]! * 1000, piece.positions[v * 3 + 2]! * 1000]);
        const values: number[] = corners.map((v: number): number => at[v] ?? 4 * CELL_MM);
        const mean: number = (values[0]! + values[1]! + values[2]!) / 3;
        const n: V3 = D.cross(D.sub(points[1]!, points[0]!), D.sub(points[2]!, points[0]!));
        const size: number = Math.hypot(n[0], n[1], n[2]) / 2;
        const bin = binned[BINS.findIndex((b: { under: number }): boolean => mean < b.under)]!;
        const first: number = bin.positions.length / 3;
        for (const p of points) bin.positions.push(p[0] / 1000, p[1] / 1000, p[2] / 1000);
        bin.indices.push(first, first + 1, first + 2);
        total += Math.abs(mean) * size;
        area += size;
        if (Math.abs(mean) >= 1) outside += size;
        const centre: V3 = [0, 1, 2].map((c: number): number => (points[0]![c]! + points[1]![c]! + points[2]![c]!) / 3) as V3;
        if (centre[2] < 0) continue;
        const id: string = key(Math.floor(centre[0] / REPORT_MM), Math.floor(centre[1] / REPORT_MM), Math.floor(centre[2] / REPORT_MM));
        const cell = report.get(id) ?? { area: 0, sum: 0, absolute: 0, farthest: 0 };
        cell.area += size;
        cell.sum += mean * size;
        cell.absolute += Math.abs(mean) * size;
        if (Math.abs(mean) > Math.abs(cell.farthest)) cell.farthest = mean;
        report.set(id, cell);
      }
    }
    const round = (x: number): number => Math.round(x * 100) / 100;
    const worst = [...report.entries()]
      .filter(([, cell]): boolean => cell.area > 20)
      .map(([id, cell]): { centreMm: number[]; areaMm2: number; meanMm: number; absoluteMm: number; farthestMm: number } => ({ centreMm: id.split(",").map((i: string): number => (Number(i) + 0.5) * REPORT_MM), areaMm2: Math.round(cell.area), meanMm: round(cell.sum / cell.area), absoluteMm: round(cell.absolute / cell.area), farthestMm: round(cell.farthest) }))
      .sort((a, b): number => b.absoluteMm - a.absoluteMm);

    // The frames: the whole figure and the close zones of `FamilyConicFigure.ts`, under the same cameras.
    const meshes: N.Mesh[] = binned.map((bin, i: number): N.Mesh => ({ id: "bin." + i, positions: bin.positions, indices: bin.indices, colour: BINS[i]!.colour })).filter((mesh: N.Mesh): boolean => mesh.indices.length > 0);
    const bounds: N.Point[] = triangles.flatMap((corners: [V3, V3, V3]): N.Point[] => corners.map((p: V3): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000]));
    NodeCanvasRaster.initialize();
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "figure." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 1500), meshes, [], "depth", "f1 | deviation | " + view).png);
    const zones: [string, (p: N.Point) => boolean][] = [
      ["head", (p: N.Point): boolean => p[1] > 1.45],
      ["hand", (p: N.Point): boolean => p[2] > 0.38 && p[1] > 0.84 && p[1] < 1.04],
      ["foot", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.13],
      ["shoulder", (p: N.Point): boolean => p[2] > 0.06 && p[1] > 1.2 && p[1] < 1.45],
      ["ear", (p: N.Point): boolean => p[2] > 0.07 && p[1] > 1.535 && p[1] < 1.61 && p[0] > -0.02 && p[0] < 0.035],
      ["neck", (p: N.Point): boolean => p[1] > 1.42 && p[1] < 1.53 && Math.abs(p[2]) < 0.09],
      ["hip", (p: N.Point): boolean => p[1] > 0.72 && p[1] < 0.98 && Math.abs(p[2]) < 0.22],
      ["chest", (p: N.Point): boolean => p[1] > 1.14 && p[1] < 1.42 && Math.abs(p[2]) < 0.2],
    ];
    const owned: { meshes: N.Mesh[]; legend: { name: string; rgb: number[] }[] } | null = realized === null ? null : await ownerReport(realized.mesh, bodyAt, ownersArgument!, out);
    for (const [zone, inside] of zones) {
      const near: N.Point[] = bounds.filter(inside);
      for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
        await fs.writeFile(path.join(out, zone + "." + view + ".png"), NodeCanvasRaster.render(camera, meshes, [], "depth", "f1 | deviation | " + zone + " " + view).png);
        if (owned !== null) await fs.writeFile(path.join(out, "owners." + zone + "." + view + ".png"), NodeCanvasRaster.render(camera, owned.meshes, [], "depth", "f1 | owners | " + zone + " " + view).png);
      }
    }
    // The whole skin's figures to four places: a change of a round's mean is often a few thousandths of a millimetre.
    const summary = { schema: "f1-family-conic-deviation-v1", meanMm: Math.round((1e4 * total) / area) / 1e4, shareBeyond1Mm: Math.round((1e4 * outside) / area) / 1e4, binsUnderMm: BINS.map((b: { under: number }): number | null => (Number.isFinite(b.under) ? b.under : null)), worst: worst.slice(0, 80) };
    await fs.writeFile(path.join(out, "deviation.json"), JSON.stringify(summary, null, 2));
    process.stdout.write(JSON.stringify({ out, meanMm: summary.meanMm, shareBeyond1Mm: summary.shareBeyond1Mm, pieces: pieces.length, diagnostics: pieces.flatMap((piece: AutoMovieHumanF1.IPiece): string[] => piece.diagnostics) }) + "\n");
    for (const row of worst.slice(0, 50)) process.stdout.write(row.centreMm.map((x: number): string => String(x).padStart(6)).join("") + "  area " + String(row.areaMm2).padStart(5) + "  mean " + row.meanMm.toFixed(2).padStart(6) + "  abs " + row.absoluteMm.toFixed(2).padStart(5) + "  far " + row.farthestMm.toFixed(2).padStart(6) + "\n");
  }

  /** Owner colours, cycled; the trunk keeps the clay grey so the parts on it stand out. */
  const OWNER_PALETTE: V3[] = [
    [0.85, 0.25, 0.25], [0.25, 0.7, 0.3], [0.25, 0.4, 0.9], [0.95, 0.8, 0.2], [0.7, 0.3, 0.8], [0.2, 0.75, 0.8], [0.95, 0.5, 0.15], [0.6, 0.85, 0.3],
    [0.9, 0.4, 0.65], [0.5, 0.3, 0.15], [0.1, 0.45, 0.35], [0.55, 0.6, 0.95], [0.95, 0.65, 0.65], [0.35, 0.15, 0.5], [0.8, 0.8, 0.5], [0.1, 0.25, 0.5],
  ];

  /** One owner's share of a cell of `owners.json`. */
  interface IOwnerShare {
    /** Area, mm². */
    area: number;

    /** Area-weighted sum of the triangles' mean signed distances, mm³. */
    sum: number;

    /** The triangle mean signed distance farthest from the skin, mm. */
    farthest: number;

    /** Least and greatest chart station of its vertices, mm on a lofted face. */
    stations: [number, number];

    /** Least and greatest chart phase of its vertices, radians on a lofted face. */
    phases: [number, number];

    /** Sharpest fold between two triangles sharing an edge in the cell, at least one of them this owner's, degrees between their normals. */
    fold: number;
  }

  /**
   * The `--owners` report: every cell of the box, with each owner's area, signed distance, chart range and sharpest fold, into
   * `owners.json`; and the realized skin split by owner for the owner frames.
   *
   * A triangle belongs to the owner two of its corners share, or to its second corner's when all three differ (a seam's triangle). Its
   * chart range is read from the realized mesh's own coordinates (`IMesh.coordinates`: owner, station, phase). The fold of an edge is the
   * angle between the normals of the two triangles on it, filed in the cell of the edge's midpoint for both triangles' owners.
   *
   * @param mesh The realized skin, metres.
   * @param at Each vertex's signed distance to the reference skin, mm; null when none lies within reach.
   * @param argument The `--owners` argument, with its box or without.
   * @param out The run's directory.
   * @returns The skin split by owner, coloured, and the colours by owner.
   */
  async function ownerReport(mesh: IMesh, at: readonly (number | null)[], argument: string, out: string): Promise<{ meshes: N.Mesh[]; legend: { name: string; rgb: number[] }[] }> {
    const box: number[] | null = argument.includes("=") ? argument.slice("--owners=".length).split(",").map(Number) : null;
    if (box !== null && (box.length !== 6 || box.some((x: number): boolean => !Number.isFinite(x)))) throw new Error("--owners=<x0>,<y0>,<z0>,<x1>,<y1>,<z1>: six numbers in mm");
    const side: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--owner-cell="))?.slice("--owner-cell=".length) ?? REPORT_MM);
    const inBox = (p: V3): boolean => box === null || [0, 1, 2].every((c: number): boolean => p[c]! >= Math.min(box[c]!, box[c + 3]!) && p[c]! <= Math.max(box[c]!, box[c + 3]!));
    const T: number = mesh.indices.length / 3;
    const point = (v: number): V3 => [mesh.positions[v * 3]! * 1000, mesh.positions[v * 3 + 1]! * 1000, mesh.positions[v * 3 + 2]! * 1000];
    const ownerOf = (t: number): number => {
      const [a, b, c]: number[] = [0, 1, 2].map((k: number): number => mesh.coordinates[mesh.indices[t * 3 + k]! * 3]!);
      return a === b || a === c ? a! : b!;
    };
    const cellOf = (p: V3): string => [0, 1, 2].map((c: number): number => Math.floor(p[c]! / side)).join(",");
    const cells: Map<string, Map<number, IOwnerShare>> = new Map();
    const share = (cell: string, owner: number): IOwnerShare => {
      const shares: Map<number, IOwnerShare> = cells.get(cell) ?? new Map();
      cells.set(cell, shares);
      const found: IOwnerShare = shares.get(owner) ?? { area: 0, sum: 0, farthest: 0, stations: [Infinity, -Infinity], phases: [Infinity, -Infinity], fold: 0 };
      shares.set(owner, found);
      return found;
    };
    const normals: Float64Array = new Float64Array(T * 3);
    const owners: Int32Array = new Int32Array(T);
    for (let t: number = 0; t < T; ++t) {
      const corners: number[] = [mesh.indices[t * 3]!, mesh.indices[t * 3 + 1]!, mesh.indices[t * 3 + 2]!];
      const points: V3[] = corners.map(point);
      const n: V3 = D.cross(D.sub(points[1]!, points[0]!), D.sub(points[2]!, points[0]!));
      const length: number = Math.hypot(n[0], n[1], n[2]);
      for (let c: number = 0; c < 3; ++c) normals[t * 3 + c] = length > 0 ? n[c]! / length : 0;
      owners[t] = ownerOf(t);
      const centre: V3 = [0, 1, 2].map((c: number): number => (points[0]![c]! + points[1]![c]! + points[2]![c]!) / 3) as V3;
      if (!inBox(centre)) continue;
      const mean: number = corners.reduce((sum: number, v: number): number => sum + (at[v] ?? 4 * CELL_MM), 0) / 3;
      const found: IOwnerShare = share(cellOf(centre), owners[t]!);
      found.area += length / 2;
      found.sum += mean * (length / 2);
      if (Math.abs(mean) > Math.abs(found.farthest)) found.farthest = mean;
      for (const v of corners) {
        if (mesh.coordinates[v * 3] !== owners[t]) continue;
        const [s, phase]: number[] = [mesh.coordinates[v * 3 + 1]!, mesh.coordinates[v * 3 + 2]!];
        found.stations = [Math.min(found.stations[0], s!), Math.max(found.stations[1], s!)];
        found.phases = [Math.min(found.phases[0], phase!), Math.max(found.phases[1], phase!)];
      }
    }
    // Folds: the edges by their two corners, the first triangle seen on each.
    const V: number = mesh.positions.length / 3;
    const first: Map<number, number> = new Map();
    for (let t: number = 0; t < T; ++t)
      for (let k: number = 0; k < 3; ++k) {
        const [a, b]: number[] = [mesh.indices[t * 3 + k]!, mesh.indices[t * 3 + ((k + 1) % 3)]!];
        const edge: number = Math.min(a!, b!) * V + Math.max(a!, b!);
        const other: number | undefined = first.get(edge);
        if (other === undefined) {
          first.set(edge, t);
          continue;
        }
        const middle: V3 = [0, 1, 2].map((c: number): number => (point(a!)[c]! + point(b!)[c]!) / 2) as V3;
        if (!inBox(middle)) continue;
        const cosine: number = normals[t * 3]! * normals[other * 3]! + normals[t * 3 + 1]! * normals[other * 3 + 1]! + normals[t * 3 + 2]! * normals[other * 3 + 2]!;
        const fold: number = (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
        for (const owner of [owners[t]!, owners[other]!]) {
          const found: IOwnerShare = share(cellOf(middle), owner);
          found.fold = Math.max(found.fold, fold);
        }
      }
    const round = (x: number): number => Math.round(x * 100) / 100;
    const listed = [...cells.entries()]
      .map(([id, shares]) => {
        const rows = [...shares.entries()]
          .filter(([, found]): boolean => found.area > 0 || found.fold > 0)
          .map(([owner, found]) => ({ owner: mesh.owners[owner]!, areaMm2: round(found.area), meanMm: found.area > 0 ? round(found.sum / found.area) : null, farthestMm: round(found.farthest), stations: Number.isFinite(found.stations[0]) ? found.stations.map(round) : null, phases: Number.isFinite(found.phases[0]) ? found.phases.map((x: number): number => Math.round(x * 1e3) / 1e3) : null, foldDeg: Math.round(found.fold * 10) / 10 }))
          .sort((a, b): number => b.areaMm2 - a.areaMm2);
        const area: number = rows.reduce((sum: number, row): number => sum + row.areaMm2, 0);
        const absolute: number = rows.reduce((sum: number, row): number => sum + Math.abs(row.meanMm ?? 0) * row.areaMm2, 0);
        return { centreMm: id.split(",").map((i: string): number => (Number(i) + 0.5) * side), absoluteMm: area > 0 ? round(absolute / area) : 0, owners: rows };
      })
      .sort((a, b): number => b.absoluteMm - a.absoluteMm);
    const legend: { name: string; rgb: number[] }[] = mesh.owners.map((name: string, i: number): { name: string; rgb: number[] } => ({ name, rgb: (name === "trunk" ? [0.64, 0.65, 0.67] : OWNER_PALETTE[i % OWNER_PALETTE.length]!).map((x: number): number => Math.round(x * 255)) }));
    await fs.writeFile(path.join(out, "owners.json"), JSON.stringify({ cellMm: side, box, legend, cells: listed }, null, 2));
    // The skin split by owner, for the owner frames.
    const groups: { positions: number[]; indices: number[] }[] = mesh.owners.map((): { positions: number[]; indices: number[] } => ({ positions: [], indices: [] }));
    for (let t: number = 0; t < T; ++t) {
      const group = groups[owners[t]!]!;
      const base: number = group.positions.length / 3;
      for (let k: number = 0; k < 3; ++k) {
        const v: number = mesh.indices[t * 3 + k]!;
        group.positions.push(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!);
      }
      group.indices.push(base, base + 1, base + 2);
    }
    const meshes: N.Mesh[] = groups
      .map((group, i: number): N.Mesh => ({ id: "owner." + mesh.owners[i], positions: group.positions, indices: group.indices, colour: legend[i]!.rgb.map((x: number): number => x / 255) as V3 }))
      .filter((m: N.Mesh): boolean => m.indices.length > 0);
    return { meshes, legend };
  }
}
void FamilyConicDeviation.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
