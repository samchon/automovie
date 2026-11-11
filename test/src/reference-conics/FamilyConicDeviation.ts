import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * Where the generated f1 leaves its reference, as a map: every triangle of the generated skin is painted by how far it stands from the
 * reference skin, outside it in warm colours and inside it in cold ones, and the places it stands farthest are listed.
 *
 * The clay frames of `FamilyConicFigure.ts` show a defect only where the light happens to catch it. This measures instead: each generated
 * vertex's distance to the nearest reference triangle, signed by that triangle's side. The list is of 30 mm cells of space on the figure's
 * +Z half, the worst first, each with its centre, its mean distance and its farthest one.
 *
 * Usage: `FamilyConicDeviation.ts`: writes the frames and `deviation.json` under `test/.shots/family-conic-deviation/`.
 */
namespace FamilyConicDeviation {
  type V3 = [number, number, number];

  /** Edge of the cells the reference triangles are filed in, mm. */
  const CELL_MM: number = 12;

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
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const source: R.ISource = await R.load(root);

    // The reference triangles, filed by every cell their box touches.
    const triangles: [V3, V3, V3][] = [];
    for (const mesh of [source.body, source.head])
      for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) triangles.push([0, 1, 2].map((k: number): V3 => [mesh.positions[mesh.indices[t + k]! * 3]!, mesh.positions[mesh.indices[t + k]! * 3 + 1]!, mesh.positions[mesh.indices[t + k]! * 3 + 2]!]) as [V3, V3, V3]);
    const key = (i: number, j: number, k: number): string => i + "," + j + "," + k;
    const cells: Map<string, number[]> = new Map();
    triangles.forEach((corners: [V3, V3, V3], index: number): void => {
      const low: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.min(...corners.map((p: V3): number => p[c]!)) / CELL_MM));
      const high: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.max(...corners.map((p: V3): number => p[c]!)) / CELL_MM));
      for (let i: number = low[0]!; i <= high[0]!; ++i)
        for (let j: number = low[1]!; j <= high[1]!; ++j)
          for (let k: number = low[2]!; k <= high[2]!; ++k) {
            const id: string = key(i, j, k);
            const list: number[] | undefined = cells.get(id);
            if (list === undefined) cells.set(id, [index]);
            else list.push(index);
          }
    });

    // Signed distance from a point to the nearest reference triangle within four cells, mm; null when none is that near.
    const distance = (p: V3): number | null => {
      const home: number[] = p.map((x: number): number => Math.floor(x / CELL_MM));
      let best: number = Infinity;
      let signed: number | null = null;
      const seen: Set<number> = new Set();
      for (let ring: number = 1; ring <= 4 && best > (ring - 1) * CELL_MM; ++ring)
        for (let i: number = -ring; i <= ring; ++i)
          for (let j: number = -ring; j <= ring; ++j)
            for (let k: number = -ring; k <= ring; ++k) {
              if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== ring && ring > 1) continue;
              for (const index of cells.get(key(home[0]! + i, home[1]! + j, home[2]! + k)) ?? []) {
                if (seen.has(index)) continue;
                seen.add(index);
                const [a, b, c]: [V3, V3, V3] = triangles[index]!;
                const q: V3 = closest(p, a, b, c);
                const d: number = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
                if (d < best) {
                  best = d;
                  const n: V3 = cross(sub(b, a), sub(c, a));
                  signed = dot(sub(p, q), n) >= 0 ? d : -d;
                }
              }
            }
      return signed;
    };

    // Every generated triangle into its bin, and its area and distance into its report cell.
    const binned: { positions: number[]; indices: number[] }[] = BINS.map((): { positions: number[]; indices: number[] } => ({ positions: [], indices: [] }));
    const report: Map<string, { area: number; sum: number; absolute: number; farthest: number }> = new Map();
    let total: number = 0;
    let area: number = 0;
    let outside: number = 0;
    for (const piece of pieces) {
      const at: (number | null)[] = Array.from({ length: piece.positions.length / 3 }, (_: unknown, v: number): number | null => distance([piece.positions[v * 3]! * 1000, piece.positions[v * 3 + 1]! * 1000, piece.positions[v * 3 + 2]! * 1000]));
      for (let t: number = 0; t + 2 < piece.indices.length; t += 3) {
        const corners: number[] = [piece.indices[t]!, piece.indices[t + 1]!, piece.indices[t + 2]!];
        const points: V3[] = corners.map((v: number): V3 => [piece.positions[v * 3]! * 1000, piece.positions[v * 3 + 1]! * 1000, piece.positions[v * 3 + 2]! * 1000]);
        const values: number[] = corners.map((v: number): number => at[v] ?? 4 * CELL_MM);
        const mean: number = (values[0]! + values[1]! + values[2]!) / 3;
        const n: V3 = cross(sub(points[1]!, points[0]!), sub(points[2]!, points[0]!));
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
      ["neck", (p: N.Point): boolean => p[1] > 1.42 && p[1] < 1.53 && Math.abs(p[2]) < 0.09],
      ["hip", (p: N.Point): boolean => p[1] > 0.72 && p[1] < 0.98 && Math.abs(p[2]) < 0.22],
    ];
    for (const [zone, inside] of zones) {
      const near: N.Point[] = bounds.filter(inside);
      for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, zone + "." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, near, 900, 900), meshes, [], "depth", "f1 | deviation | " + zone + " " + view).png);
    }
    const summary = { schema: "f1-family-conic-deviation-v1", meanMm: round(total / area), shareBeyond1Mm: round(outside / area), binsUnderMm: BINS.map((b: { under: number }): number | null => (Number.isFinite(b.under) ? b.under : null)), worst: worst.slice(0, 80) };
    await fs.writeFile(path.join(out, "deviation.json"), JSON.stringify(summary, null, 2));
    process.stdout.write(JSON.stringify({ out, meanMm: summary.meanMm, shareBeyond1Mm: summary.shareBeyond1Mm, pieces: pieces.length, diagnostics: pieces.flatMap((piece: AutoMovieHumanF1.IPiece): string[] => piece.diagnostics) }) + "\n");
    for (const row of worst.slice(0, 50)) process.stdout.write(row.centreMm.map((x: number): string => String(x).padStart(6)).join("") + "  area " + String(row.areaMm2).padStart(5) + "  mean " + row.meanMm.toFixed(2).padStart(6) + "  abs " + row.absoluteMm.toFixed(2).padStart(5) + "  far " + row.farthestMm.toFixed(2).padStart(6) + "\n");
  }

  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  /** The point of triangle `abc` nearest `p`, by the regions of its corners, edges and face (Ericson, Real-Time Collision Detection, 5.1.5). */
  function closest(p: V3, a: V3, b: V3, c: V3): V3 {
    const ab: V3 = sub(b, a);
    const ac: V3 = sub(c, a);
    const ap: V3 = sub(p, a);
    const d1: number = dot(ab, ap);
    const d2: number = dot(ac, ap);
    if (d1 <= 0 && d2 <= 0) return a;
    const bp: V3 = sub(p, b);
    const d3: number = dot(ab, bp);
    const d4: number = dot(ac, bp);
    if (d3 >= 0 && d4 <= d3) return b;
    const vc: number = d1 * d4 - d3 * d2;
    if (vc <= 0 && d1 >= 0 && d3 <= 0) {
      const v: number = d1 / (d1 - d3);
      return [a[0] + v * ab[0], a[1] + v * ab[1], a[2] + v * ab[2]];
    }
    const cp: V3 = sub(p, c);
    const d5: number = dot(ab, cp);
    const d6: number = dot(ac, cp);
    if (d6 >= 0 && d5 <= d6) return c;
    const vb: number = d5 * d2 - d1 * d6;
    if (vb <= 0 && d2 >= 0 && d6 <= 0) {
      const w: number = d2 / (d2 - d6);
      return [a[0] + w * ac[0], a[1] + w * ac[1], a[2] + w * ac[2]];
    }
    const va: number = d3 * d6 - d5 * d4;
    if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
      const w: number = (d4 - d3) / (d4 - d3 + (d5 - d6));
      return [b[0] + w * (c[0] - b[0]), b[1] + w * (c[1] - b[1]), b[2] + w * (c[2] - b[2])];
    }
    const denominator: number = 1 / (va + vb + vc);
    const v: number = vb * denominator;
    const w: number = vc * denominator;
    return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
  }
}
void FamilyConicDeviation.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
