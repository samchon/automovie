import fs from "node:fs/promises";
import path from "node:path";
import { realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * One inspection round of f1's ear (#3403): the construction realized once as the figure is, its +Z ear framed in clay beside the
 * reference under the same cameras, the same frames coloured by the face that owns each triangle, and the realized mesh written with its
 * owners so a later round can show what moved.
 *
 * Usage, from `test/`: `FamilyConicEarRound.ts [--before=<directory of an earlier round>]`. Frames, `mesh.*` and `receipt.json` go to
 * `test/.shots/family-conic-ear-round/<time>`. With `--before`, the receipt lists, for every owner, how far its vertices moved: each
 * vertex's distance to the nearest vertex of the same owner in the earlier round, its largest value and how many moved more than
 * 0.01 mm; for the trunk, which the ear's merges trim, only vertices farther than `NEAR_EAR_MM` from every ear vertex count.
 */
namespace FamilyConicEarRound {
  /** Faces that belong to the ear, on both sides: what a change of the ear's modules may move. */
  const EAR: readonly string[] = ["plate", "root.plate", "helix", "ridge.helix", "antihelix", "ridge.antihelix", "concha", "cut.concha"].flatMap((name: string): string[] => [name, name + ".mirror"]);

  /** Distance from the ear within which the trunk's own vertices may move with the ear's merges and cut, mm. */
  const NEAR_EAR_MM: number = 10;

  /**
   * The close-up zones, metres, on the +Z side, each with the views it is framed in: the whole ear, the lobule (its free edge, #3403 E1),
   * the crus of the helix with the cymba above it (E2), and the scapha under the helix's top and back (E3).
   */
  const ZONES: readonly [string, (p: N.Point) => boolean, readonly string[]][] = [
    ["ear", (p: N.Point): boolean => p[2] > 0.07 && p[1] > 1.535 && p[1] < 1.61 && p[0] > -0.02 && p[0] < 0.035, ["front", "left", "back", "high-oblique", "low-oblique"]],
    ["lobule", (p: N.Point): boolean => p[2] > 0.07 && p[1] > 1.535 && p[1] < 1.562 && p[0] > 0.0 && p[0] < 0.03, ["left", "front", "low-oblique"]],
    ["crus", (p: N.Point): boolean => p[2] > 0.065 && p[1] > 1.565 && p[1] < 1.595 && p[0] > 0.004 && p[0] < 0.026, ["left", "high-oblique"]],
    ["scapha", (p: N.Point): boolean => p[2] > 0.075 && p[1] > 1.57 && p[1] < 1.605 && p[0] > -0.01 && p[0] < 0.018, ["left", "back", "high-oblique"]],
  ];

  /** Owner colours, linear RGB, in the order owners first appear; the trunk stays clay. */
  const PALETTE: readonly N.Point[] = [
    [0.85, 0.25, 0.25], [0.25, 0.7, 0.3], [0.25, 0.4, 0.9], [0.95, 0.8, 0.2], [0.7, 0.3, 0.8], [0.2, 0.75, 0.8], [0.95, 0.5, 0.15], [0.6, 0.85, 0.3],
    [0.9, 0.4, 0.65], [0.5, 0.3, 0.15], [0.1, 0.45, 0.35], [0.55, 0.6, 0.95], [0.95, 0.65, 0.65], [0.35, 0.15, 0.5], [0.8, 0.8, 0.5], [0.1, 0.25, 0.5],
  ];

  /** One realized mesh in millimetres with each triangle's owning face. */
  interface IDump {
    positions: Float64Array;
    indices: Uint32Array;
    names: string[];
    triangle: number[];
  }

  /** Every vertex of each owner, millimetres, keyed by owner name. */
  const byOwner = (dump: IDump): Map<string, number[][]> => {
    const out: Map<string, Set<number>> = new Map();
    dump.triangle.forEach((owner: number, t: number): void => {
      const name: string = dump.names[owner]!;
      const set: Set<number> = out.get(name) ?? new Set<number>();
      for (let k: number = 0; k < 3; ++k) set.add(dump.indices[3 * t + k]!);
      out.set(name, set);
    });
    return new Map([...out].map(([name, set]): [string, number[][]] => [name, [...set].map((v: number): number[] => [dump.positions[3 * v]!, dump.positions[3 * v + 1]!, dump.positions[3 * v + 2]!])]));
  };

  /** A 1 mm grid of points for nearest-point queries within a few millimetres. */
  const grid = (points: readonly number[][]): ((p: readonly number[], reach: number) => number) => {
    const cells: Map<string, number[][]> = new Map();
    const key = (x: number, y: number, z: number): string => x + "," + y + "," + z;
    for (const p of points) {
      const k: string = key(Math.floor(p[0]!), Math.floor(p[1]!), Math.floor(p[2]!));
      const list: number[][] = cells.get(k) ?? [];
      list.push(p);
      cells.set(k, list);
    }
    return (p: readonly number[], reach: number): number => {
      let best: number = Infinity;
      const r: number = Math.ceil(reach);
      const [x, y, z]: number[] = [Math.floor(p[0]!), Math.floor(p[1]!), Math.floor(p[2]!)];
      for (let i: number = -r; i <= r; ++i)
        for (let j: number = -r; j <= r; ++j)
          for (let k: number = -r; k <= r; ++k)
            for (const q of cells.get(key(x! + i, y! + j, z! + k)) ?? []) best = Math.min(best, Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!, q[2]! - p[2]!));
      return best;
    };
  };

  /** Realize, render and write the round. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-ear-round", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });

    const declared = AutoMovieHumanF1.construction();
    const started: number = performance.now();
    const real = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
    const realizeMs: number = Math.round(performance.now() - started);
    const mesh = real.mesh;
    const T: number = mesh.indices.length / 3;
    const ownerOfVertex = (v: number): string => mesh.owners[mesh.coordinates[v * 3]!]!;
    const names: string[] = [];
    const triangle: number[] = [];
    for (let t: number = 0; t < T; ++t) {
      const three: string[] = [0, 1, 2].map((k: number): string => ownerOfVertex(mesh.indices[t * 3 + k]!));
      const name: string = three[0] === three[1] || three[0] === three[2] ? three[0]! : three[1]!;
      let i: number = names.indexOf(name);
      if (i < 0) i = names.push(name) - 1;
      triangle.push(i);
    }
    const dump: IDump = { positions: Float64Array.from(mesh.positions, (x: number): number => x * 1000), indices: Uint32Array.from(mesh.indices), names, triangle };
    await fs.writeFile(path.join(out, "mesh.positions.f64"), Buffer.from(dump.positions.buffer));
    await fs.writeFile(path.join(out, "mesh.indices.u32"), Buffer.from(dump.indices.buffer));
    await fs.writeFile(path.join(out, "mesh.owners.json"), JSON.stringify({ names, triangle }));

    // Frames: reference, generated clay and owners under one camera per zone and view.
    const source: R.ISource = await R.load(root);
    const reference: N.Mesh[] = [source.body, source.head].map((m, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(m.positions, (x: number): number => x / 1000), indices: Array.from(m.indices), colour: [0.64, 0.65, 0.67] }));
    const bounds: N.Point[] = [];
    for (const m of reference) for (let i: number = 0; i < m.positions.length; i += 3) bounds.push([m.positions[i]!, m.positions[i + 1]!, m.positions[i + 2]!]);
    const clay: N.Mesh[] = [{ id: "generated", positions: Array.from(mesh.positions), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }];
    const groups: Map<string, { positions: number[]; indices: number[] }> = new Map();
    for (let t: number = 0; t < T; ++t) {
      const name: string = names[triangle[t]!]!;
      const g = groups.get(name) ?? { positions: [], indices: [] };
      for (let c: number = 0; c < 3; ++c) {
        const v: number = mesh.indices[t * 3 + c]!;
        g.positions.push(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!);
      }
      const n: number = g.positions.length / 3;
      g.indices.push(n - 3, n - 2, n - 1);
      groups.set(name, g);
    }
    const coloured: string[] = names.filter((name: string): boolean => name !== "trunk");
    const owners: N.Mesh[] = [...groups].map(([name, g]): N.Mesh => ({ id: name, positions: g.positions, indices: g.indices, colour: name === "trunk" ? [0.64, 0.65, 0.67] : PALETTE[coloured.indexOf(name) % PALETTE.length]! }));
    NodeCanvasRaster.initialize();
    const frames: string[] = [];
    for (const [zone, inside, views] of ZONES) {
      const near: N.Point[] = bounds.filter(inside);
      for (const view of views) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
        for (const [stage, shown] of [["reference", reference], ["generated", clay], ["owners", owners]] as [string, N.Mesh[]][]) {
          const file: string = zone + "." + view + "." + stage + ".png";
          await fs.writeFile(path.join(out, file), NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + zone + " " + view).png);
          frames.push(file);
        }
      }
    }

    // What moved since an earlier round, by owner.
    const beforeDir: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--before="))?.slice("--before=".length);
    let moved: { owner: string; vertices: number; counted: number; largestMm: number; beyondHundredth: number; absent?: boolean }[] | undefined;
    if (beforeDir !== undefined) {
      const pb: Buffer = await fs.readFile(path.join(beforeDir, "mesh.positions.f64"));
      const ib: Buffer = await fs.readFile(path.join(beforeDir, "mesh.indices.u32"));
      const ob: { names: string[]; triangle: number[] } = JSON.parse(await fs.readFile(path.join(beforeDir, "mesh.owners.json"), "utf8"));
      const before: IDump = { positions: new Float64Array(pb.buffer, pb.byteOffset, pb.length / 8), indices: new Uint32Array(ib.buffer, ib.byteOffset, ib.length / 4), names: ob.names, triangle: ob.triangle };
      const was: Map<string, number[][]> = byOwner(before);
      const now: Map<string, number[][]> = byOwner(dump);
      const nearEar = grid([...now].filter(([name]): boolean => EAR.includes(name)).flatMap(([, points]): number[][] => points));
      moved = [...new Set([...was.keys(), ...now.keys()])].sort((a: string, b: string): number => a.localeCompare(b)).map((owner: string) => {
        const a: number[][] | undefined = was.get(owner);
        const b: number[][] | undefined = now.get(owner);
        if (a === undefined || b === undefined) return { owner, vertices: (a ?? b)!.length, counted: 0, largestMm: NaN, beyondHundredth: 0, absent: true };
        const nearest = grid(a);
        let largest: number = 0;
        let beyond: number = 0;
        let counted: number = 0;
        for (const p of b) {
          if (owner === "trunk" && nearEar(p, NEAR_EAR_MM) <= NEAR_EAR_MM) continue;
          ++counted;
          const d: number = nearest(p, 1);
          const e: number = Number.isFinite(d) ? d : 1;
          largest = Math.max(largest, e);
          if (e > 0.01) ++beyond;
        }
        return { owner, vertices: b.length, counted, largestMm: Math.round(largest * 1e4) / 1e4, beyondHundredth: beyond };
      });
    }
    const receipt = { schema: "f1-family-conic-ear-round-v1", realizeMs, diagnostics: real.diagnostics.map((d) => d.node + " (" + d.contract + "): " + d.detail), frames, ...(beforeDir === undefined ? {} : { before: beforeDir, moved }) };
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
    process.stdout.write(JSON.stringify({ out, realizeMs, diagnostics: receipt.diagnostics.length }) + "\n");
  }
}
void FamilyConicEarRound.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
