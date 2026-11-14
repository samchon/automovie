import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, type AutoMovieViewLoft, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * One inspection round of f1's ear (#3403): the construction realized once as the figure is, its +Z ear framed in clay beside the
 * reference under the same cameras, the same frames coloured by the face that owns each triangle, and the realized mesh written with its
 * owners so a later round can show what moved.
 *
 * Usage, from `test/`: `FamilyConicEarRound.ts [--before=<directory of an earlier round>]`, or `--crossing[=<plate family json>]` alone (below). Frames, `mesh.*` and `receipt.json` go to
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

  /**
   * `--crossing[=<plate family json>]`: where each tube merged on the plate (the helix, the antihelix) crosses it, before any realization.
   * Along each tube's top line (phase 0, the line its merge's seed is sought on) and its course, every half millimetre of station, the
   * signed distance to the plate (the stored module, or the family a fit wrote as `<part>.family.json`): to the nearest of the plate's
   * points sampled every quarter millimetre of station and every half degree of phase, positive outside along the plate's normal there.
   * A merge's seed needs the top line to leave the plate (negative to positive) within the seed's station range.
   */
  const crossing = async (file: string | undefined): Promise<string[]> => {
    const plate: AutoMovieHumanConicLoft.IFamily = file === undefined ? AutoMovieHumanF1.BODY.ear : JSON.parse(await fs.readFile(file, "utf8"));
    const sample = (family: AutoMovieHumanConicLoft.IFamily, step: number): { chain: NonNullable<AutoMovieViewLoft.IResult["chain"]>; stations: number[] } => {
      const [bottom, top] = family.tips ?? [null, null];
      const from: number = bottom === null ? family.knots[0]! : bottom.tip;
      const to: number = top === null ? family.knots.at(-1)! : top.tip;
      const stations: number[] = [];
      for (let s: number = from + step / 2; s < to; s += step) stations.push(Math.round(s * 1000) / 1000);
      const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, family.knots);
      if (loft.chain === null) throw new Error("--crossing: " + family.name + " does not loft");
      return { chain: loft.chain, stations };
    };
    const host = sample(plate, 0.25);
    const PHASES: number = 720;
    const points: number[][] = [];
    const normals: number[][] = [];
    for (let i: number = 1; i + 1 < host.stations.length; ++i)
      for (let j: number = 0; j < PHASES; ++j) {
        const at = (s: number, k: number): number[] => AutoMovieLoftChain.point(host.chain, s, (2 * Math.PI * ((k + PHASES) % PHASES)) / PHASES);
        const p: number[] = at(host.stations[i]!, j);
        const ds: number[] = [0, 1, 2].map((c: number): number => at(host.stations[i + 1]!, j)[c]! - at(host.stations[i - 1]!, j)[c]!);
        const dp: number[] = [0, 1, 2].map((c: number): number => at(host.stations[i]!, j + 1)[c]! - at(host.stations[i]!, j - 1)[c]!);
        const n: number[] = [ds[1]! * dp[2]! - ds[2]! * dp[1]!, ds[2]! * dp[0]! - ds[0]! * dp[2]!, ds[0]! * dp[1]! - ds[1]! * dp[0]!];
        const centre: number[] = AutoMovieHumanConicLoft.axis(plate).at(host.stations[i]!).origin;
        const out: number = (p[0]! - centre[0]!) * n[0]! + (p[1]! - centre[1]!) * n[1]! + (p[2]! - centre[2]!) * n[2]!;
        const length: number = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
        points.push(p);
        normals.push(n.map((x: number): number => (out < 0 ? -x : x) / length));
      }
    const signed = (q: readonly number[]): number => {
      let best: number = Infinity;
      let k: number = -1;
      points.forEach((p: number[], i: number): void => {
        const d: number = (p[0]! - q[0]!) ** 2 + (p[1]! - q[1]!) ** 2 + (p[2]! - q[2]!) ** 2;
        if (d < best) [best, k] = [d, i];
      });
      const p: number[] = points[k]!;
      const n: number[] = normals[k]!;
      return (q[0]! - p[0]!) * n[0]! + (q[1]! - p[1]!) * n[1]! + (q[2]! - p[2]!) * n[2]!;
    };
    const lines: string[] = ["plate: " + (file ?? "the stored module"), "tube | station | top line point (phase 0), mm | signed distance of the top line to the plate | of the course"];
    for (const tube of ["helix", "antihelix"].map((name: string): AutoMovieHumanConicLoft.IFamily => AutoMovieHumanF1.FAMILIES.find((member): boolean => member.family.name === name)!.family)) {
      const own = sample(tube, 0.5);
      const axis = AutoMovieHumanConicLoft.axis(tube);
      for (const s of own.stations) {
        const top: number[] = AutoMovieLoftChain.point(own.chain, s, 0);
        lines.push(`${tube.name} | ${s.toFixed(2)} | [${top.map((x: number): string => x.toFixed(2)).join(", ")}] | ${signed(top).toFixed(2)} | ${signed(axis.at(s).origin).toFixed(2)}`);
      }
    }
    return lines;
  };

  /** Realize, render and write the round. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const crossingArgument: string | undefined = process.argv.find((a: string): boolean => a === "--crossing" || a.startsWith("--crossing="));
    if (crossingArgument !== undefined) {
      const out: string = path.join(root, "test/.shots/family-conic-ear-round", "crossing-" + new Date().toISOString().replaceAll(":", "-") + ".txt");
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, (await crossing(crossingArgument.includes("=") ? crossingArgument.slice("--crossing=".length) : undefined)).join("\n") + "\n");
      process.stdout.write(JSON.stringify({ out }) + "\n");
      return;
    }
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
