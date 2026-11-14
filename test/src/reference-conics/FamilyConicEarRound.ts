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
 * Usage, from `test/`: `FamilyConicEarRound.ts [--before=<directory of an earlier round>]`, or `--crossing[=<plate family json>]` or
 * `--map=<box>` alone (below). Frames, `mesh.*` and `receipt.json` go to
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
   * A merge's seed needs the top line to leave the plate (negative to positive) within the seed's station range, and a ridge merged along
   * the plate meets it in one loop only where its top line stands outside and its bottom line (phase pi) inside. `--tube=<family json>`
   * checks a candidate family in place of the stored one of its name.
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
    // `--host-dump=<round>`: the trunk of a realized round joins the host, each of its triangles a point (its centroid) with its outward
    // normal, so a merge's curve that runs on from the plate onto the head (the helix's front limb is buried in the head) is read whole.
    const hostDump: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--host-dump="))?.slice("--host-dump=".length);
    if (hostDump !== undefined) {
      const pb: Buffer = await fs.readFile(path.join(hostDump, "mesh.positions.f64"));
      const ib: Buffer = await fs.readFile(path.join(hostDump, "mesh.indices.u32"));
      const ob: { names: string[]; triangle: number[] } = JSON.parse(await fs.readFile(path.join(hostDump, "mesh.owners.json"), "utf8"));
      const positions: Float64Array = new Float64Array(pb.buffer, pb.byteOffset, pb.length / 8);
      const indices: Uint32Array = new Uint32Array(ib.buffer, ib.byteOffset, ib.length / 4);
      const trunk: number = ob.names.indexOf("trunk");
      ob.triangle.forEach((owner: number, t: number): void => {
        if (owner !== trunk) return;
        const c: number[][] = [0, 1, 2].map((k: number): number[] => [positions[3 * indices[3 * t + k]!]!, positions[3 * indices[3 * t + k]! + 1]!, positions[3 * indices[3 * t + k]! + 2]!]);
        const centre: number[] = [0, 1, 2].map((a: number): number => (c[0]![a]! + c[1]![a]! + c[2]![a]!) / 3);
        if (centre[2]! < 55 || centre[0]! < -25 || centre[0]! > 45 || centre[1]! < 1525 || centre[1]! > 1615) return;
        const e: number[] = [0, 1, 2].map((a: number): number => c[1]![a]! - c[0]![a]!);
        const f: number[] = [0, 1, 2].map((a: number): number => c[2]![a]! - c[0]![a]!);
        const n: number[] = [e[1]! * f[2]! - e[2]! * f[1]!, e[2]! * f[0]! - e[0]! * f[2]!, e[0]! * f[1]! - e[1]! * f[0]!];
        const length: number = Math.hypot(n[0]!, n[1]!, n[2]!);
        if (!(length > 0)) return;
        points.push(centre);
        normals.push(n.map((x: number): number => x / length));
      });
    }
    // Nearest host point by a 1 mm grid, widened ring by ring until the nearest found is closer than the ring's reach.
    const cells: Map<string, number[]> = new Map();
    const key = (x: number, y: number, z: number): string => x + "," + y + "," + z;
    points.forEach((p: number[], i: number): void => {
      const k: string = key(Math.floor(p[0]!), Math.floor(p[1]!), Math.floor(p[2]!));
      const list: number[] = cells.get(k) ?? [];
      list.push(i);
      cells.set(k, list);
    });
    const signed = (q: readonly number[]): number => {
      let best: number = Infinity;
      let k: number = -1;
      const [x, y, z]: number[] = [Math.floor(q[0]!), Math.floor(q[1]!), Math.floor(q[2]!)];
      for (let r: number = 0; r <= 40 && !(Math.sqrt(best) <= r - 1); ++r)
        for (let i: number = -r; i <= r; ++i)
          for (let j: number = -r; j <= r; ++j)
            for (let l: number = -r; l <= r; ++l) {
              if (Math.max(Math.abs(i), Math.abs(j), Math.abs(l)) !== r) continue;
              for (const m of cells.get(key(x! + i, y! + j, z! + l)) ?? []) {
                const p: number[] = points[m]!;
                const d: number = (p[0]! - q[0]!) ** 2 + (p[1]! - q[1]!) ** 2 + (p[2]! - q[2]!) ** 2;
                if (d < best) [best, k] = [d, m];
              }
            }
      if (k < 0)
        points.forEach((p: number[], i: number): void => {
          const d: number = (p[0]! - q[0]!) ** 2 + (p[1]! - q[1]!) ** 2 + (p[2]! - q[2]!) ** 2;
          if (d < best) [best, k] = [d, i];
        });
      const p: number[] = points[k]!;
      const n: number[] = normals[k]!;
      return (q[0]! - p[0]!) * n[0]! + (q[1]! - p[1]!) * n[1]! + (q[2]! - p[2]!) * n[2]!;
    };
    // `--tube=<family json>` (repeatable) stands in for the stored family of the same name, so a candidate is checked before it is written.
    const candidates: AutoMovieHumanConicLoft.IFamily[] = await Promise.all(
      process.argv.filter((a: string): boolean => a.startsWith("--tube=")).map(async (a: string): Promise<AutoMovieHumanConicLoft.IFamily> => JSON.parse(await fs.readFile(a.slice("--tube=".length), "utf8"))),
    );
    const lines: string[] = [
      "plate: " + (file ?? "the stored module") + "; tubes: " + (candidates.length === 0 ? "stored" : candidates.map((c) => c.name + " (candidate)").join(", ")),
      "tube | station | top line point (phase 0), mm | signed distance of the top line (phase 0) to the plate | of the course | of the bottom line (phase pi) | least over the section's ring (every 10 degrees) @ its phase in degrees | greatest @ phase",
    ];
    // `--seed-lines=<n>` (default 8): the merge's seed search walks n station lines round each tube, phase 0 first (the interface's
    // `phases`), between shares 0 and 0.5 of its stations, as the ear's merges declare it. For each line, the stations where its signed
    // distance to the plate changes sign: the first line with one is the line the search can seed on.
    const seedLines: number = Number(process.argv.find((a: string): boolean => a.startsWith("--seed-lines="))?.slice("--seed-lines=".length) ?? 8);
    const tubes: AutoMovieHumanConicLoft.IFamily[] = ["helix", "antihelix"].map((name: string): AutoMovieHumanConicLoft.IFamily => candidates.find((c) => c.name === name) ?? AutoMovieHumanF1.FAMILIES.find((member): boolean => member.family.name === name)!.family);
    for (const tube of tubes) {
      const own = sample(tube, 0.5);
      const half: number[] = own.stations.filter((s: number): boolean => s <= own.stations[0]! + (own.stations.at(-1)! - own.stations[0]!) / 2);
      const verdicts: string[] = [];
      let chosen: string = "none";
      for (let k: number = 0; k < seedLines; ++k) {
        const phase: number = (2 * Math.PI * k) / seedLines;
        const values: number[] = half.map((s: number): number => signed(AutoMovieLoftChain.point(own.chain, s, phase)));
        const changes: number[] = half.filter((_: number, i: number): boolean => i > 0 && Math.sign(values[i]!) !== Math.sign(values[i - 1]!));
        verdicts.push(`${((phase * 180) / Math.PI).toFixed(0)} deg: ${changes.length === 0 ? "no change" : changes.map((s: number): string => s.toFixed(1)).join(", ")}`);
        if (chosen === "none" && changes.length > 0) chosen = `${((phase * 180) / Math.PI).toFixed(0)} deg at station ${changes[0]!.toFixed(1)}`;
      }
      lines.push(`# ${tube.name} seed lines (${seedLines}, stations ${half[0]}..${half.at(-1)}): first with a crossing ${chosen}; ${verdicts.join("; ")}`);

      // The curve where the tube meets the host, in the tube's own chart: the cells of a grid (every half millimetre of station, every 5
      // degrees of phase, periodic) whose four corners do not share a sign, joined across shared edges into connected pieces. Every seed
      // line's crossing is placed in its piece: a seed on any of them traces the same curve exactly when they share one piece.
      const P: number = 72;
      const grid: number[][] = own.stations.map((s: number): number[] => Array.from({ length: P }, (_: unknown, j: number): number => signed(AutoMovieLoftChain.point(own.chain, s, (2 * Math.PI * j) / P))));
      const I: number = own.stations.length;
      const parent: number[] = Array.from({ length: I * P }, (_: unknown, n: number): number => n);
      const findRoot = (n: number): number => {
        let m: number = n;
        while (parent[m] !== m) {
          parent[m] = parent[parent[m]!]!;
          m = parent[m]!;
        }
        return m;
      };
      const crossed = (i: number, j: number): boolean => {
        const corners: number[] = [grid[i]![j]!, grid[i]![(j + 1) % P]!, grid[i + 1]![j]!, grid[i + 1]![(j + 1) % P]!];
        return corners.some((v: number): boolean => v > 0) && corners.some((v: number): boolean => v <= 0);
      };
      const isCell: boolean[] = Array.from({ length: I * P }, (_: unknown, n: number): boolean => Math.floor(n / P) < I - 1 && crossed(Math.floor(n / P), n % P));
      for (let i: number = 0; i + 1 < I; ++i)
        for (let j: number = 0; j < P; ++j) {
          if (!isCell[i * P + j]) continue;
          for (const [a, b] of [[i, (j + 1) % P], [i + 1, j]] as [number, number][])
            if (a + 1 < I && isCell[a * P + b]) parent[findRoot(i * P + j)] = findRoot(a * P + b);
        }
      const pieces: Map<number, { cells: number; from: number; to: number }> = new Map();
      isCell.forEach((cell: boolean, n: number): void => {
        if (!cell) return;
        const r: number = findRoot(n);
        const s: number = own.stations[Math.floor(n / P)]!;
        const piece = pieces.get(r) ?? { cells: 0, from: s, to: s };
        pieces.set(r, { cells: piece.cells + 1, from: Math.min(piece.from, s), to: Math.max(piece.to, s) });
      });
      const ids: number[] = [...pieces.keys()];
      const seeds: string[] = [];
      for (let k: number = 0; k < seedLines; ++k) {
        const j: number = Math.round((k * P) / seedLines) % P;
        for (let i: number = 0; i + 1 < I && own.stations[i + 1]! <= half.at(-1)!; ++i)
          if (Math.sign(grid[i]![j]!) !== Math.sign(grid[i + 1]![j]!)) {
            const piece: number = isCell[i * P + j] ? findRoot(i * P + j) : findRoot(i * P + ((j + P - 1) % P));
            seeds.push(`${((360 * k) / seedLines).toFixed(0)} deg at ${own.stations[i]!.toFixed(1)} -> piece ${ids.indexOf(piece)}`);
          }
      }
      lines.push(
        `# ${tube.name} meeting curve: ${pieces.size} piece(s) [${ids.map((r: number, n: number): string => `${n}: ${pieces.get(r)!.cells} cells, stations ${pieces.get(r)!.from.toFixed(1)}..${pieces.get(r)!.to.toFixed(1)}`).join("; ")}]; seed crossings ${seeds.join(", ") || "none"}`,
      );
    }
    for (const tube of tubes) {
      const own = sample(tube, 0.5);
      const axis = AutoMovieHumanConicLoft.axis(tube);
      for (const s of own.stations) {
        const top: number[] = AutoMovieLoftChain.point(own.chain, s, 0);
        const bottom: number[] = AutoMovieLoftChain.point(own.chain, s, Math.PI);
        // The whole ring: a section crosses the plate when its least and greatest signed distances have opposite signs.
        const ring: number[] = Array.from({ length: 36 }, (_: unknown, k: number): number => signed(AutoMovieLoftChain.point(own.chain, s, (k * Math.PI) / 18)));
        const least: number = ring.indexOf(Math.min(...ring));
        const most: number = ring.indexOf(Math.max(...ring));
        lines.push(
          `${tube.name} | ${s.toFixed(2)} | [${top.map((x: number): string => x.toFixed(2)).join(", ")}] | ${signed(top).toFixed(2)} | ${signed(axis.at(s).origin).toFixed(2)} | ${signed(bottom).toFixed(2)} | ${ring[least]!.toFixed(2)} @ ${least * 10} | ${ring[most]!.toFixed(2)} @ ${most * 10}`,
        );
      }
    }
    return lines;
  };

  /** The outermost side distance (largest z) of a triangle soup over a grid of (x, y), millimetres; NaN where nothing lies over a cell. */
  const outermost = (positions: ArrayLike<number>, indices: ArrayLike<number>, keep: (t: number) => boolean, xs: readonly number[], ys: readonly number[], least: number): Float64Array => {
    const z: Float64Array = new Float64Array(xs.length * ys.length).fill(NaN);
    const [x0, y0]: number[] = [xs[0]!, ys[0]!];
    const step: number = xs.length > 1 ? xs[1]! - xs[0]! : 1;
    for (let t: number = 0; t + 2 < indices.length; t += 3) {
      if (!keep(t / 3)) continue;
      const p: number[][] = [0, 1, 2].map((k: number): number[] => [positions[3 * indices[t + k]!]!, positions[3 * indices[t + k]! + 1]!, positions[3 * indices[t + k]! + 2]!]);
      if (p.every((q: number[]): boolean => q[2]! < least)) continue;
      const d: number = (p[1]![0]! - p[0]![0]!) * (p[2]![1]! - p[0]![1]!) - (p[1]![1]! - p[0]![1]!) * (p[2]![0]! - p[0]![0]!);
      if (d === 0) continue;
      const [lx, hx]: number[] = [Math.min(...p.map((q) => q[0]!)), Math.max(...p.map((q) => q[0]!))];
      const [ly, hy]: number[] = [Math.min(...p.map((q) => q[1]!)), Math.max(...p.map((q) => q[1]!))];
      for (let i: number = Math.max(0, Math.ceil((lx - x0!) / step)); i < xs.length && xs[i]! <= hx; ++i)
        for (let j: number = Math.max(0, Math.ceil((ly - y0!) / step)); j < ys.length && ys[j]! <= hy; ++j) {
          const [x, y]: number[] = [xs[i]!, ys[j]!];
          const a: number = ((x! - p[0]![0]!) * (p[2]![1]! - p[0]![1]!) - (y! - p[0]![1]!) * (p[2]![0]! - p[0]![0]!)) / d;
          const b: number = ((p[1]![0]! - p[0]![0]!) * (y! - p[0]![1]!) - (p[1]![1]! - p[0]![1]!) * (x! - p[0]![0]!)) / d;
          if (a < 0 || b < 0 || a + b > 1) continue;
          const v: number = p[0]![2]! + a * (p[1]![2]! - p[0]![2]!) + b * (p[2]![2]! - p[0]![2]!);
          const k: number = j * xs.length + i;
          if (!(z[k]! >= v)) z[k] = v;
        }
    }
    return z;
  };

  /**
   * `--map=<x0>,<x1>,<y0>,<y1>[,<step>]` (mm; step 1): the outermost skin over a box, seen from the side, row by row, before a part is laid
   * out or after a round. For the reference: its side distance, and in each row (level `y`) its crests along `x` (a cell higher than every
   * cell within 1.5 mm either side and at least 0.8 mm above the lowest cell between it and the crest before it), so a ridge such as the
   * tragus or a crus is read where it stands. With `--before=<round>`, the same of that round's realized skin (every owner) and the owner
   * of its outermost cell, and in each row the extent in `x` past `--edge=<mm>` (default 72, the skull's level beside the ear) on both, so
   * an outline's width and slant are compared at every level.
   */
  const map = async (root: string, spec: string, dumpDir: string | undefined): Promise<string[]> => {
    const [x0, x1, y0, y1, step]: number[] = [...spec.split(",").map(Number), 1].slice(0, 5) as number[];
    const xs: number[] = [];
    for (let x: number = x0!; x <= x1! + 1e-9; x += step!) xs.push(Math.round(x * 1000) / 1000);
    const ys: number[] = [];
    for (let y: number = y1!; y >= y0! - 1e-9; y -= step!) ys.push(Math.round(y * 1000) / 1000);
    const ascending: number[] = [...ys].reverse();
    const edge: number = Number(process.argv.find((a: string): boolean => a.startsWith("--edge="))?.slice("--edge=".length) ?? 72);
    const source: R.ISource = await R.load(root);
    const ref: Float64Array = outermost(source.head.positions, source.head.indices, (): boolean => true, xs, ascending, 50);
    let gen: Float64Array | null = null;
    let ownerAt: ((i: number, j: number) => string) | null = null;
    if (dumpDir !== undefined) {
      const pb: Buffer = await fs.readFile(path.join(dumpDir, "mesh.positions.f64"));
      const ib: Buffer = await fs.readFile(path.join(dumpDir, "mesh.indices.u32"));
      const ob: { names: string[]; triangle: number[] } = JSON.parse(await fs.readFile(path.join(dumpDir, "mesh.owners.json"), "utf8"));
      const positions: Float64Array = new Float64Array(pb.buffer, pb.byteOffset, pb.length / 8);
      const indices: Uint32Array = new Uint32Array(ib.buffer, ib.byteOffset, ib.length / 4);
      gen = outermost(positions, indices, (): boolean => true, xs, ascending, 50);
      const per: Map<string, Float64Array> = new Map(ob.names.filter((n: string): boolean => !n.endsWith(".mirror")).map((name: string): [string, Float64Array] => [name, outermost(positions, indices, (t: number): boolean => ob.names[ob.triangle[t]!] === name, xs, ascending, 50)]));
      ownerAt = (i: number, j: number): string => {
        let best: [string, number] | null = null;
        for (const [name, z] of per) {
          const v: number = z[j * xs.length + i]!;
          if (Number.isFinite(v) && (best === null || v > best[1])) best = [name, v];
        }
        return best === null ? "." : best[0];
      };
    }
    const at = (z: Float64Array, i: number, y: number): number => z[ascending.indexOf(y) * xs.length + i]!;
    const lines: string[] = [`box x ${x0}..${x1}, y ${y0}..${y1}, step ${step} mm; edge ${edge} mm; reference = the f1 head's outermost skin${dumpDir === undefined ? "" : "; generated = " + dumpDir}`];
    const grid = (title: string, cell: (i: number, y: number) => string): void => {
      lines.push("", "# " + title, "     y\\x " + xs.map((x: number): string => String(x).padStart(5)).join(""));
      for (const y of ys) lines.push(String(y).padStart(8) + " " + xs.map((_: number, i: number): string => cell(i, y).padStart(5)).join(""));
    };
    grid("reference side distance, mm", (i: number, y: number): string => (Number.isFinite(at(ref, i, y)) ? at(ref, i, y).toFixed(1) : "."));
    if (gen !== null) {
      grid("generated side distance, mm", (i: number, y: number): string => (Number.isFinite(at(gen!, i, y)) ? at(gen!, i, y).toFixed(1) : "."));
      grid("generated - reference, mm", (i: number, y: number): string => (Number.isFinite(at(gen!, i, y)) && Number.isFinite(at(ref, i, y)) ? (at(gen!, i, y) - at(ref, i, y)).toFixed(1) : "."));
      grid("owner of the generated outermost cell (first four letters)", (i: number, y: number): string => ownerAt!(i, ascending.indexOf(y)).replace("ridge.", "r.").slice(0, 4));
    }
    lines.push("", "# per row: reference crests along x (x, z, rise over the low before it); extent past the edge (x from..to, width) on the reference and the generated skin");
    for (const y of ys) {
      const row: number[] = xs.map((_: number, i: number): number => at(ref, i, y));
      const crests: string[] = [];
      let low: number = Infinity;
      row.forEach((v: number, i: number): void => {
        if (!Number.isFinite(v)) return;
        low = Math.min(low, v);
        const reach: number = Math.round(1.5 / step!);
        for (let k: number = Math.max(0, i - reach); k <= Math.min(row.length - 1, i + reach); ++k) if (k !== i && row[k]! > v) return;
        if (v - low >= 0.8) {
          crests.push(`(${xs[i]}, ${v.toFixed(1)}, +${(v - low).toFixed(1)})`);
          low = v;
        }
      });
      const extent = (values: number[]): string => {
        const inside: number[] = xs.filter((_: number, i: number): boolean => values[i]! > edge);
        return inside.length === 0 ? "none" : `${inside[0]}..${inside.at(-1)} (${(inside.at(-1)! - inside[0]!).toFixed(1)})`;
      };
      lines.push(`${String(y).padStart(8)} | crests ${crests.join(" ") || "none"} | extent ref ${extent(row)}${gen === null ? "" : " gen " + extent(xs.map((_: number, i: number): number => at(gen!, i, y)))}`);
    }
    return lines;
  };

  /** Realize, render and write the round. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const mapArgument: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--map="));
    if (mapArgument !== undefined) {
      const out: string = path.join(root, "test/.shots/family-conic-ear-round", "map-" + new Date().toISOString().replaceAll(":", "-") + ".txt");
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, (await map(root, mapArgument.slice("--map=".length), process.argv.find((a: string): boolean => a.startsWith("--before="))?.slice("--before=".length))).join("\n") + "\n");
      process.stdout.write(JSON.stringify({ out }) + "\n");
      return;
    }
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
