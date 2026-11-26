import { FamilyConicHeadParts } from "./FamilyConicHeadParts";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H } from "@automovie/human";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1FaceCentres as C,
  AutoMovieHumanF1Landmarks as L,
  AutoMovieHumanF1Placement,
} from "@automovie/human/capture";
import type {
  IAutoMovieHumanF1,
  IAutoMovieLoftViewFullSource,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Readings of the f1 reference head for `packages/human/docs/techniques/face-one-shot.md`: instruments only, nothing here is read by the
 * figure. Every mode reads the reference's head mesh (`--source=all` adds the body) reduced to the components named by `--keep`
 * (indices into the list `--components` prints, largest first; default the largest), and writes `<label>.txt` under
 * `packages/human/.shots/face-one-shot-20261117/`. With `--outer` the kept skin is reduced again to the triangles that see the outside
 * past the pieces `--behind` names, so the mouth's lining, the vestibules and the sockets do not count as skin.
 *
 * `--components`: the mesh's connected pieces (triangles joined through shared vertices) with their boxes, and the open rims of the kept
 * pieces: each chain of edges that belong to one triangle only, with its length, box and middle. An opening of the skin (between the
 * lids, between the lips, a nostril) shows as a rim.
 *
 * `--profile --plane=<z mm>`: the front profile in a sagittal plane, the greatest `x` of the cut at every height, and its local extremes.
 *
 * `--cast --dir=<x,y,z> --a=<x,y,z> --b=<x,y,z> --window=<a0,a1,b0,b1> [--origin] [--step] [--depth]`: parallel rays along `dir`, laid on
 * the grid of `a` and `b`. A height net carries one height a ray (lofting.md, Composition before lofting), so a ray that enters the skin
 * again within `depth` mm behind its first entry meets an undercut the net cannot hold, and a first entry whose face stands within 15
 * degrees of the ray is grazing, which a cast does not see. Printed: the counts, and every cluster of such rays with its extent, the
 * thickness of what hangs over and the air under it.
 *
 * `--radial --origin=<x,y,z> --axis=<x,y,z> --up=<x,y,z> --stations=<s0,s1> [--phases=<deg,deg>] [--rmax] [--step] [--dphi]`: rays square
 * to a trial course from its points. A family's section is star-shaped about its course when every such ray meets the skin once
 * (lofting.md, One section family); a ray that meets it three times is folded, and one that meets nothing is open. Printed as the cast's.
 *
 * `--wedge --plane=<x|y|z> --at=<mm,...> --box=<u0,u1,v0,v1> [--out=<u,v>] [--least=<deg>]`: the turns of the skin in a plane cut
 * (`x`: charted `(z, y)`; `y`: `(x, z)`; `z`: `(x, y)`). At every vertex of the cut inside the box the skin's turn is `180` less the angle
 * between the lines to the points 3, 6 and 12 mm along the cut either side; the local greatest turns at 6 mm of `least` degrees or more
 * are printed, a valley when the two lines open toward `out` and a ridge otherwise. A plane oblique to a fold reads it wider.
 *
 * `--stills --box=<x0,x1,y0,y1,z0,z1> [--views=<name,...>] [--marks=<x,y,z;...>] [--lines=<x,y,z:x,y,z;...>]`: the kept pieces in clay
 * framed on the box, with their rims, the marks and the lines drawn over them, so a reading is seen where it was taken.
 *
 * Usage, from `test/`: bundle this file with esbuild as the other tools of this folder, then `node <bundle> --label=<name> --<mode> ...`.
 */
namespace FamilyConicFace {
  /** A point or direction in the reference frame, mm. */
  type V = [number, number, number];

  /** A triangle mesh with plain arrays. */
  interface IMesh {
    /** Flat positions, mm. */
    positions: number[];

    /** Flat triangle indices. */
    indices: number[];
  }

  /** One crossing of a ray and a triangle. */
  interface IHit {
    /** Distance along the ray, mm. */
    t: number;

    /** Whether the triangle's normal points along the ray: the ray leaves the solid there. */
    leaving: boolean;

    /** Cosine of the angle between the ray and the triangle's normal, unsigned. */
    cos: number;
  }

  /** What one ray of a grid met. */
  interface ICell {
    /** Crossings counted by the mode's rule: entries for a cast, all crossings for a radial ray. */
    count: number;

    /** Thickness of the first solid stretch the ray passes, mm; 0 where it does not leave it within reach. */
    cover: number;

    /** Air between the first and the second solid stretch, mm; 0 where there is none. */
    air: number;

    /** Whether the first face met stands within 15 degrees of the ray. */
    grazing: boolean;

    /** Distance to the first crossing, mm; NaN where there is none. */
    first: number;
  }

  /** Where every mode writes, from the repository root. */
  const OUT: string = "packages/human/.shots/face-one-shot-20261117";

  /** Cosine of 75 degrees: a face whose normal stands farther than that from the ray lies within 15 degrees of it. */
  const GRAZING: number = Math.cos((75 * Math.PI) / 180);

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const along = (o: V, d: V, t: number): V => [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];
  const unit = (a: V): V => {
    const l: number = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const vertex = (mesh: IMesh, i: number): V => [mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!];
  const option = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);
  const numbers = (name: string, fallback: string): number[] => (option(name) ?? fallback).split(",").map(Number);
  const vector = (name: string, fallback: string): V => {
    const n: number[] = numbers(name, fallback);
    return [n[0]!, n[1]!, n[2]!];
  };
  const fixed = (p: readonly number[], digits: number = 1): string => "[" + p.map((x: number): string => x.toFixed(digits)).join(", ") + "]";

  /** A mesh's connected pieces as lists of triangle offsets into its indices, largest first. */
  function components(mesh: IMesh): number[][] {
    const parent: number[] = Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): number => i);
    const find = (start: number): number => {
      let i: number = start;
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]!]!;
        i = parent[i]!;
      }
      return i;
    };
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const a: number = find(mesh.indices[t]!);
      for (const k of [1, 2]) {
        const b: number = find(mesh.indices[t + k]!);
        if (a !== b) parent[b] = a;
      }
    }
    const groups: Map<number, number[]> = new Map();
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const root: number = find(mesh.indices[t]!);
      const group: number[] | undefined = groups.get(root);
      if (group === undefined) groups.set(root, [t]);
      else group.push(t);
    }
    return [...groups.values()].sort((a: number[], b: number[]): number => b.length - a.length);
  }

  /** The mesh of some triangles of another, sharing its positions. */
  function part(mesh: IMesh, triangles: readonly number[]): IMesh {
    return { positions: mesh.positions, indices: triangles.flatMap((t: number): number[] => [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]) };
  }

  /** The least and greatest corner of some triangles. */
  function box(mesh: IMesh): [V, V] {
    const low: V = [Infinity, Infinity, Infinity];
    const high: V = [-Infinity, -Infinity, -Infinity];
    for (const i of mesh.indices) {
      const p: V = vertex(mesh, i);
      for (const c of [0, 1, 2] as const) {
        low[c] = Math.min(low[c], p[c]);
        high[c] = Math.max(high[c], p[c]);
      }
    }
    return [low, high];
  }

  /** The open rims of a mesh: chains of the edges one triangle only uses, as vertex indices in the triangles' own direction. */
  function rims(mesh: IMesh): number[][] {
    const uses: Map<string, number> = new Map();
    const key = (a: number, b: number): string => (a < b ? a + "_" + b : b + "_" + a);
    const edges: [number, number][] = [];
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3)
      for (const k of [0, 1, 2]) {
        const edge: [number, number] = [mesh.indices[t + k]!, mesh.indices[t + ((k + 1) % 3)]!];
        edges.push(edge);
        uses.set(key(edge[0], edge[1]), (uses.get(key(edge[0], edge[1])) ?? 0) + 1);
      }
    const next: Map<number, number[]> = new Map();
    for (const edge of edges) if (uses.get(key(edge[0], edge[1])) === 1) next.set(edge[0], [...(next.get(edge[0]) ?? []), edge[1]]);
    const used: Set<string> = new Set();
    const loops: number[][] = [];
    for (const [start, ends] of next)
      for (const first of ends) {
        if (used.has(start + ">" + first)) continue;
        const loop: number[] = [start];
        let from: number = start;
        let to: number = first;
        for (let guard: number = 0; guard < edges.length; ++guard) {
          used.add(from + ">" + to);
          if (to === start) break;
          loop.push(to);
          const free: number[] = (next.get(to) ?? []).filter((end: number): boolean => !used.has(to + ">" + end));
          if (free.length === 0) break;
          from = to;
          to = free[0]!;
        }
        loops.push(loop);
      }
    return loops.sort((a: number[], b: number[]): number => b.length - a.length);
  }

  /** Where a ray from `o` along the unit `d` crosses a triangle (Moller and Trumbore), or null. */
  function hit(mesh: IMesh, t: number, o: V, d: V): IHit | null {
    const a: V = vertex(mesh, mesh.indices[t]!);
    const e1: V = sub(vertex(mesh, mesh.indices[t + 1]!), a);
    const e2: V = sub(vertex(mesh, mesh.indices[t + 2]!), a);
    const p: V = cross(d, e2);
    const det: number = dot(e1, p);
    if (Math.abs(det) < 1e-12) return null;
    const s: V = sub(o, a);
    const u: number = dot(s, p) / det;
    if (u < -1e-9 || u > 1 + 1e-9) return null;
    const q: V = cross(s, e1);
    const v: number = dot(d, q) / det;
    if (v < -1e-9 || u + v > 1 + 1e-9) return null;
    const normal: V = cross(e1, e2);
    const size: number = Math.hypot(normal[0], normal[1], normal[2]);
    return { t: dot(e2, q) / det, leaving: dot(normal, d) > 0, cos: Math.abs(dot(normal, d)) / size };
  }

  /** A ray's crossings of some triangles between two distances, nearest first; a crossing through a shared edge is counted once. */
  function crossings(mesh: IMesh, triangles: readonly number[], o: V, d: V, from: number, to: number): IHit[] {
    const found: IHit[] = [];
    for (const t of triangles) {
      const got: IHit | null = hit(mesh, t, o, d);
      if (got !== null && got.t > from && got.t <= to) found.push(got);
    }
    found.sort((a: IHit, b: IHit): number => a.t - b.t);
    return found.filter((h: IHit, k: number): boolean => k === 0 || h.t - found[k - 1]!.t > 1e-6 || h.leaving !== found[k - 1]!.leaving);
  }

  /** Directions the outside is looked for along, spread evenly over the sphere. */
  const SIGHTS: number = 64;

  /**
   * The triangles of a skin that see the outside: those from whose middle a ray along at least one of `SIGHTS` directions meets no
   * triangle of the occluders. The reference's skin runs on into closed pockets (the mouth's lining, the nasal vestibules, the sockets
   * behind the eyeballs); a section or a cast read through a pocket counts skin no part's surface carries.
   */
  function outer(skin: IMesh, occluders: IMesh): number[] {
    const size: number = 4;
    const seen: boolean[] = new Array<boolean>(skin.indices.length / 3).fill(false);
    for (let k: number = 0; k < SIGHTS; ++k) {
      // A Fibonacci lattice point of the unit sphere, and two axes square to it.
      const y: number = 1 - (2 * (k + 0.5)) / SIGHTS;
      const r: number = Math.sqrt(1 - y * y);
      const turn: number = k * Math.PI * (3 - Math.sqrt(5));
      const d: V = [r * Math.cos(turn), y, r * Math.sin(turn)];
      const a: V = unit(cross(Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d));
      const b: V = cross(d, a);
      const bins: Map<string, number[]> = new Map();
      for (let t: number = 0; t + 2 < occluders.indices.length; t += 3) {
        const corners: [number, number][] = [0, 1, 2].map((j: number): [number, number] => {
          const p: V = vertex(occluders, occluders.indices[t + j]!);
          return [dot(p, a), dot(p, b)];
        });
        for (let i: number = Math.floor(Math.min(...corners.map((c: [number, number]): number => c[0])) / size); i <= Math.floor(Math.max(...corners.map((c: [number, number]): number => c[0])) / size); ++i)
          for (let j: number = Math.floor(Math.min(...corners.map((c: [number, number]): number => c[1])) / size); j <= Math.floor(Math.max(...corners.map((c: [number, number]): number => c[1])) / size); ++j) {
            const bin: number[] | undefined = bins.get(i + "_" + j);
            if (bin === undefined) bins.set(i + "_" + j, [t]);
            else bin.push(t);
          }
      }
      for (let t: number = 0; t + 2 < skin.indices.length; t += 3) {
        if (seen[t / 3] === true) continue;
        const p: V = vertex(skin, skin.indices[t]!);
        const q: V = vertex(skin, skin.indices[t + 1]!);
        const w: V = vertex(skin, skin.indices[t + 2]!);
        const o: V = [(p[0] + q[0] + w[0]) / 3, (p[1] + q[1] + w[1]) / 3, (p[2] + q[2] + w[2]) / 3];
        if (crossings(occluders, bins.get(Math.floor(dot(o, a) / size) + "_" + Math.floor(dot(o, b) / size)) ?? [], o, d, 0.05, Infinity).length === 0) seen[t / 3] = true;
      }
    }
    const out: number[] = [];
    for (let t: number = 0; t + 2 < skin.indices.length; t += 3) if (seen[t / 3] === true) out.push(skin.indices[t]!, skin.indices[t + 1]!, skin.indices[t + 2]!);
    return out;
  }

  /** The clusters of flagged cells of a grid, neighbours by edge or corner, largest first. */
  function clusters(rows: number, cols: number, flagged: (j: number, i: number) => boolean): [number, number][][] {
    const seen: boolean[] = new Array<boolean>(rows * cols).fill(false);
    const out: [number, number][][] = [];
    for (let j: number = 0; j < rows; ++j)
      for (let i: number = 0; i < cols; ++i) {
        if (seen[j * cols + i] === true || !flagged(j, i)) continue;
        const stack: [number, number][] = [[j, i]];
        const cells: [number, number][] = [];
        seen[j * cols + i] = true;
        while (stack.length > 0) {
          const cell: [number, number] = stack.pop()!;
          cells.push(cell);
          for (const dy of [-1, 0, 1])
            for (const dx of [-1, 0, 1]) {
              const y: number = cell[0] + dy;
              const x: number = cell[1] + dx;
              if (y < 0 || y >= rows || x < 0 || x >= cols || seen[y * cols + x] === true || !flagged(y, x)) continue;
              seen[y * cols + x] = true;
              stack.push([y, x]);
            }
        }
        out.push(cells);
      }
    return out.sort((a: [number, number][], b: [number, number][]): number => b.length - a.length);
  }

  /** A grid of rays' report: the counts, then every cluster of rays that meet the skin more than once, of rays that meet nothing and of grazing rays. */
  function report(cells: ICell[][], names: [string, string], at: (j: number, i: number) => [number, number], least: number): string[] {
    const rows: number = cells.length;
    const cols: number = cells[0]!.length;
    const counts: Map<number, number> = new Map();
    for (const row of cells) for (const cell of row) counts.set(cell.count, (counts.get(cell.count) ?? 0) + 1);
    const out: string[] = [`rays ${rows * cols}; by crossings: ${[...counts].sort((a: [number, number], b: [number, number]): number => a[0] - b[0]).map((c: [number, number]): string => `${c[0]}: ${c[1]}`).join(", ")}; grazing first faces ${cells.flat().filter((c: ICell): boolean => c.grazing).length}`];
    const describe = (title: string, flagged: (cell: ICell) => boolean): void => {
      const found: [number, number][][] = clusters(rows, cols, (j: number, i: number): boolean => flagged(cells[j]![i]!)).filter((cluster: [number, number][]): boolean => cluster.length >= least);
      out.push(`${title}: ${found.length} cluster(s) of ${least} rays or more`);
      for (const cluster of found) {
        const places: [number, number][] = cluster.map((c: [number, number]): [number, number] => at(c[0], c[1]));
        const read: ICell[] = cluster.map((c: [number, number]): ICell => cells[c[0]]![c[1]]!);
        const firsts: number[] = read.map((c: ICell): number => c.first).filter((x: number): boolean => !Number.isNaN(x));
        out.push(
          `  ${cluster.length} rays | ${names[0]} ${Math.min(...places.map((p: [number, number]): number => p[0])).toFixed(1)}..${Math.max(...places.map((p: [number, number]): number => p[0])).toFixed(1)} | ${names[1]} ${Math.min(...places.map((p: [number, number]): number => p[1])).toFixed(1)}..${Math.max(...places.map((p: [number, number]): number => p[1])).toFixed(1)} | most crossings ${Math.max(...read.map((c: ICell): number => c.count))} | cover to ${Math.max(...read.map((c: ICell): number => c.cover)).toFixed(1)} mm | air to ${Math.max(...read.map((c: ICell): number => c.air)).toFixed(1)} mm` +
            (firsts.length > 0 ? ` | first crossing ${Math.min(...firsts).toFixed(1)}..${Math.max(...firsts).toFixed(1)} mm` : ""),
        );
      }
    };
    describe("more than one", (cell: ICell): boolean => cell.count >= 2);
    describe("none", (cell: ICell): boolean => cell.count === 0);
    describe("grazing", (cell: ICell): boolean => cell.grazing);
    return out;
  }

  /** `--components`: the pieces and the kept pieces' rims. */
  function pieces(mesh: IMesh, found: number[][], skin: IMesh): string[] {
    const out: string[] = [`${found.length} pieces, ${mesh.indices.length / 3} triangles`, "piece | triangles | least corner | greatest corner"];
    found.slice(0, 40).forEach((triangles: number[], k: number): void => {
      const [low, high]: [V, V] = box(part(mesh, triangles));
      out.push(`${k} | ${triangles.length} | ${fixed(low)} | ${fixed(high)}`);
    });
    if (found.length > 40) out.push(`and ${found.length - 40} smaller, of ${found[40]!.length} triangles or fewer`);
    out.push("", "rims of the kept pieces: edges | length mm | closed | least corner | greatest corner | middle");
    for (const loop of rims(skin)) {
      const points: V[] = loop.map((i: number): V => vertex(skin, i));
      const closed: boolean = points.length > 2;
      let length: number = 0;
      for (let k: number = 0; k < points.length; ++k) {
        const d: V = sub(points[(k + 1) % points.length]!, points[k]!);
        length += Math.hypot(d[0], d[1], d[2]);
      }
      const low: V = [0, 1, 2].map((c: number): number => Math.min(...points.map((p: V): number => p[c]!))) as V;
      const high: V = [0, 1, 2].map((c: number): number => Math.max(...points.map((p: V): number => p[c]!))) as V;
      const middle: V = [0, 1, 2].map((c: number): number => points.reduce((sum: number, p: V): number => sum + p[c]!, 0) / points.length) as V;
      out.push(`${loop.length} | ${length.toFixed(1)} | ${closed} | ${fixed(low)} | ${fixed(high)} | ${fixed(middle)}`);
    }
    return out;
  }

  /** `--profile`: the front profile of a sagittal cut and its local extremes. */
  function profile(skin: IMesh): string[] {
    const z: number = Number(option("plane") ?? 0);
    const [y0, y1]: number[] = numbers("heights", "1380,1720");
    const chains: { points: R.ICut["loop"] extends infer L ? Exclude<L, null> : never; closed: boolean }[] = R.chains(skin, { origin: [0, 0, z], u: [1, 0, 0], v: [0, 1, 0] });
    const front = (y: number): number => {
      let best: number = -Infinity;
      for (const chain of chains)
        for (let k: number = 0; k + (chain.closed ? 0 : 1) < chain.points.length; ++k) {
          const a: [number, number] = chain.points[k]!;
          const b: [number, number] = chain.points[(k + 1) % chain.points.length]!;
          if (a[1] > y === b[1] > y) continue;
          best = Math.max(best, a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
        }
      return best;
    };
    const out: string[] = [`front profile in the plane z = ${z}: height | greatest x`];
    const samples: [number, number][] = [];
    for (let y: number = y0!; y <= y1! + 1e-9; y += 0.5) samples.push([y, front(y)]);
    for (const [y, x] of samples) if (Math.abs(y - Math.round(y / 2) * 2) < 1e-9) out.push(`${y.toFixed(0)} | ${Number.isFinite(x) ? x.toFixed(1) : "-"}`);
    out.push("", "local extremes of the profile: height | x | kind");
    for (let k: number = 2; k + 2 < samples.length; ++k) {
      const x: number = samples[k]![1];
      const near: number[] = [samples[k - 2]![1], samples[k - 1]![1], samples[k + 1]![1], samples[k + 2]![1]];
      if (!Number.isFinite(x) || near.some((n: number): boolean => !Number.isFinite(n))) continue;
      if (near.every((n: number): boolean => x > n)) out.push(`${samples[k]![0].toFixed(1)} | ${x.toFixed(1)} | forward`);
      if (near.every((n: number): boolean => x < n)) out.push(`${samples[k]![0].toFixed(1)} | ${x.toFixed(1)} | backward`);
    }
    return out;
  }

  /** `--cast`: parallel rays over a window. */
  function cast(skin: IMesh): string[] {
    const d: V = unit(vector("dir", "-1,0,0"));
    const a: V = unit(vector("a", "0,0,1"));
    const b: V = unit(vector("b", "0,1,0"));
    const origin: V = vector("origin", "0,0,0");
    const [a0, a1, b0, b1]: number[] = numbers("window", "-80,80,1450,1700");
    const step: number = Number(option("step") ?? 1);
    const depth: number = Number(option("depth") ?? 60);
    const size: number = 4;
    const bins: Map<string, number[]> = new Map();
    for (let t: number = 0; t + 2 < skin.indices.length; t += 3) {
      const corners: [number, number][] = [0, 1, 2].map((k: number): [number, number] => {
        const p: V = sub(vertex(skin, skin.indices[t + k]!), origin);
        return [dot(p, a), dot(p, b)];
      });
      const low: [number, number] = [Math.min(...corners.map((c: [number, number]): number => c[0])), Math.min(...corners.map((c: [number, number]): number => c[1]))];
      const high: [number, number] = [Math.max(...corners.map((c: [number, number]): number => c[0])), Math.max(...corners.map((c: [number, number]): number => c[1]))];
      if (high[0] < a0! || low[0] > a1! || high[1] < b0! || low[1] > b1!) continue;
      for (let i: number = Math.floor(low[0] / size); i <= Math.floor(high[0] / size); ++i)
        for (let j: number = Math.floor(low[1] / size); j <= Math.floor(high[1] / size); ++j) bins.set(i + "_" + j, [...(bins.get(i + "_" + j) ?? []), t]);
    }
    const rows: number = Math.round((b1! - b0!) / step) + 1;
    const cols: number = Math.round((a1! - a0!) / step) + 1;
    const at = (j: number, i: number): [number, number] => [a0! + i * step, b0! + j * step];
    const cells: ICell[][] = Array.from({ length: rows }, (_: unknown, j: number): ICell[] =>
      Array.from({ length: cols }, (__: unknown, i: number): ICell => {
        const [pa, pb]: [number, number] = at(j, i);
        const o: V = along(along(along(origin, a, pa), b, pb), d, -2000);
        const hits: IHit[] = crossings(skin, bins.get(Math.floor(pa / size) + "_" + Math.floor(pb / size)) ?? [], o, d, -Infinity, Infinity);
        if (hits.length === 0) return { count: 0, cover: 0, air: 0, grazing: false, first: NaN };
        const near: IHit[] = hits.filter((h: IHit): boolean => h.t <= hits[0]!.t + depth);
        const left: number = near.findIndex((h: IHit, k: number): boolean => k > 0 && h.leaving);
        const again: number = left < 0 ? -1 : near.findIndex((h: IHit, k: number): boolean => k > left && !h.leaving);
        return {
          count: near.filter((h: IHit): boolean => !h.leaving).length,
          cover: left < 0 ? 0 : near[left]!.t - near[0]!.t,
          air: again < 0 ? 0 : near[again]!.t - near[left]!.t,
          grazing: near[0]!.cos < GRAZING,
          first: near[0]!.t - 2000,
        };
      }),
    );
    return [`cast along ${fixed(d, 3)} over a ${fixed(a, 3)} from ${a0} to ${a1} and b ${fixed(b, 3)} from ${b0} to ${b1}, origin ${fixed(origin)}, every ${step} mm; entries within ${depth} mm behind the first`, ...report(cells, ["a", "b"], at, Number(option("cluster") ?? 4))];
  }

  /** `--radial`: rays square to a trial course. */
  function radial(skin: IMesh): string[] {
    const origin: V = vector("origin", "0,0,0");
    const axis: V = unit(vector("axis", "0,1,0"));
    const seed: V = vector("up", "1,0,0");
    const u: V = unit(along(seed, axis, -dot(seed, axis)));
    const v: V = cross(axis, u);
    const [s0, s1]: number[] = numbers("stations", "0,100");
    const [p0, p1]: number[] = numbers("phases", "-180,178");
    const rmax: number = Number(option("rmax") ?? 150);
    const step: number = Number(option("step") ?? 2);
    const dphi: number = Number(option("dphi") ?? 2);
    const size: number = 2;
    const bins: Map<number, number[]> = new Map();
    for (let t: number = 0; t + 2 < skin.indices.length; t += 3) {
      const stations: number[] = [0, 1, 2].map((k: number): number => dot(sub(vertex(skin, skin.indices[t + k]!), origin), axis));
      if (Math.max(...stations) < s0! - size || Math.min(...stations) > s1! + size) continue;
      for (let i: number = Math.floor(Math.min(...stations) / size); i <= Math.floor(Math.max(...stations) / size); ++i) bins.set(i, [...(bins.get(i) ?? []), t]);
    }
    const rows: number = Math.round((s1! - s0!) / step) + 1;
    const cols: number = Math.round((p1! - p0!) / dphi) + 1;
    const at = (j: number, i: number): [number, number] => [s0! + j * step, p0! + i * dphi];
    const cells: ICell[][] = Array.from({ length: rows }, (_: unknown, j: number): ICell[] =>
      Array.from({ length: cols }, (__: unknown, i: number): ICell => {
        const [s, degrees]: [number, number] = at(j, i);
        const phi: number = (degrees * Math.PI) / 180;
        const d: V = along(along([0, 0, 0], u, Math.cos(phi)), v, Math.sin(phi));
        const hits: IHit[] = crossings(skin, bins.get(Math.floor(s / size)) ?? [], along(origin, axis, s), d, 1e-6, rmax);
        return {
          count: hits.length,
          cover: hits.length >= 2 ? hits[1]!.t - hits[0]!.t : 0,
          air: hits.length >= 3 ? hits[2]!.t - hits[1]!.t : 0,
          grazing: hits.length > 0 && hits[0]!.cos < GRAZING,
          first: hits.length > 0 ? hits[0]!.t : NaN,
        };
      }),
    );
    const out: string[] = [`rays square to the course from ${fixed(origin)} along ${fixed(axis, 3)}, phase 0 toward ${fixed(u, 3)} and 90 toward ${fixed(v, 3)}, stations ${s0} to ${s1} every ${step} mm, phases ${p0} to ${p1} every ${dphi} degrees, reach ${rmax} mm`];
    out.push(...report(cells, ["station", "phase"], at, Number(option("cluster") ?? 4)));
    out.push("", "station | rays that meet the skin once | more | none | first crossing least..greatest mm");
    cells.forEach((row: ICell[], j: number): void => {
      const firsts: number[] = row.map((c: ICell): number => c.first).filter((x: number): boolean => !Number.isNaN(x));
      out.push(`${at(j, 0)[0].toFixed(0)} | ${row.filter((c: ICell): boolean => c.count === 1).length} | ${row.filter((c: ICell): boolean => c.count >= 2).length} | ${row.filter((c: ICell): boolean => c.count === 0).length} | ${firsts.length > 0 ? Math.min(...firsts).toFixed(1) + ".." + Math.max(...firsts).toFixed(1) : "-"}`);
    });
    return out;
  }

  /** `--wedge`: the skin's turns in plane cuts. */
  function wedge(skin: IMesh): string[] {
    const plane: string = option("plane") ?? "z";
    const [u0, u1, v0, v1]: number[] = numbers("box", "-1e9,1e9,-1e9,1e9");
    const [ou, ov]: number[] = numbers("out", "1,0");
    const least: number = Number(option("least") ?? 25);
    const out: string[] = [`turns of the skin in planes ${plane} = const, charted ${plane === "x" ? "(z, y)" : plane === "y" ? "(x, z)" : "(x, y)"}, box ${[u0, u1, v0, v1].join(", ")}, valleys open toward (${ou}, ${ov})`, "plane mm | at u, v | kind | turn deg at 3, 6, 12 mm"];
    for (const c of numbers("at", "0")) {
      const frame: { origin: V; u: V; v: V } = plane === "x" ? { origin: [c, 0, 0], u: [0, 0, 1], v: [0, 1, 0] } : plane === "y" ? { origin: [0, c, 0], u: [1, 0, 0], v: [0, 0, 1] } : { origin: [0, 0, c], u: [1, 0, 0], v: [0, 1, 0] };
      for (const chain of R.chains(skin, frame)) {
        const points: [number, number][] = chain.points;
        const count: number = points.length;
        if (count < 5) continue;

        // The point `distance` mm along the chain from vertex `i`, or null past an open chain's end.
        const walk = (i: number, way: 1 | -1, distance: number): [number, number] | null => {
          let left: number = distance;
          let k: number = i;
          for (let guard: number = 0; guard < count; ++guard) {
            const n: number = k + way;
            if (!chain.closed && (n < 0 || n >= count)) return null;
            const p: [number, number] = points[k]!;
            const q: [number, number] = points[(n + count) % count]!;
            const length: number = Math.hypot(q[0] - p[0], q[1] - p[1]);
            if (length >= left) return [p[0] + ((q[0] - p[0]) * left) / length, p[1] + ((q[1] - p[1]) * left) / length];
            left -= length;
            k = (n + count) % count;
          }
          return null;
        };

        // The skin's turn at a vertex read `distance` mm either side, positive for a valley.
        const turn = (i: number, distance: number): number | null => {
          const before: [number, number] | null = walk(i, -1, distance);
          const after: [number, number] | null = walk(i, 1, distance);
          if (before === null || after === null) return null;
          const x: [number, number] = [before[0] - points[i]![0], before[1] - points[i]![1]];
          const y: [number, number] = [after[0] - points[i]![0], after[1] - points[i]![1]];
          const angle: number = (Math.acos(Math.max(-1, Math.min(1, (x[0] * y[0] + x[1] * y[1]) / (Math.hypot(x[0], x[1]) * Math.hypot(y[0], y[1]))))) * 180) / Math.PI;
          const opens: number = (x[0] / Math.hypot(x[0], x[1]) + y[0] / Math.hypot(y[0], y[1])) * ou! + (x[1] / Math.hypot(x[0], x[1]) + y[1] / Math.hypot(y[0], y[1])) * ov!;
          return (opens >= 0 ? 1 : -1) * (180 - angle);
        };
        const inside = (p: [number, number]): boolean => p[0] >= u0! && p[0] <= u1! && p[1] >= v0! && p[1] <= v1!;
        const turns: (number | null)[] = points.map((p: [number, number], i: number): number | null => (inside(p) ? turn(i, 6) : null));
        for (let i: number = 0; i < count; ++i) {
          const here: number | null = turns[i]!;
          if (here === null || Math.abs(here) < least) continue;

          // A local greatest turn: no vertex within 4 mm along the chain turns more the same way.
          let greatest: boolean = true;
          for (const way of [1, -1]) {
            let run: number = 0;
            for (let k: number = 1; k < count && greatest; ++k) {
              const n: number = i + way * k;
              if (!chain.closed && (n < 0 || n >= count)) break;
              const p: [number, number] = points[(n - way + count) % count]!;
              const q: [number, number] = points[(n + count) % count]!;
              run += Math.hypot(q[0] - p[0], q[1] - p[1]);
              if (run > 4) break;
              const other: number | null = turns[(n + count) % count]!;
              if (other !== null && Math.sign(other) === Math.sign(here) && (Math.abs(other) > Math.abs(here) || (Math.abs(other) === Math.abs(here) && way === -1))) greatest = false;
            }
          }
          if (!greatest) continue;
          const read: string = [3, 6, 12].map((d: number): string => {
            const got: number | null = turn(i, d);
            return got === null ? "-" : Math.abs(got).toFixed(0);
          }).join(", ");
          out.push(`${c} | ${points[i]![0].toFixed(1)}, ${points[i]![1].toFixed(1)} | ${here > 0 ? "valley" : "ridge"} | ${read}`);
        }
      }
    }
    return out;
  }

  /** `--stills`: the kept pieces in clay with their rims, marks and lines; the files written. */
  async function stills(skin: IMesh, folder: string, label: string): Promise<string[]> {
    const [x0, x1, y0, y1, z0, z1]: number[] = numbers("box", "-120,140,1440,1720,-110,110");
    const inside = (p: V): boolean => p[0] >= x0! - 20 && p[0] <= x1! + 20 && p[1] >= y0! - 20 && p[1] <= y1! + 20 && p[2] >= z0! - 20 && p[2] <= z1! + 20;
    const metres = (p: V): N.Point => [p[0] / 1000, p[1] / 1000, p[2] / 1000];
    const bounds: N.Point[] = [x0!, x1!].flatMap((x: number): N.Point[] => [y0!, y1!].flatMap((y: number): N.Point[] => [z0!, z1!].map((z: number): N.Point => metres([x, y, z]))));
    const mesh: N.Mesh = { id: "reference", positions: skin.positions.map((x: number): number => x / 1000), indices: skin.indices, colour: [0.64, 0.65, 0.67] };
    const curves: N.Curve[] = [];
    rims(skin).forEach((loop: number[], k: number): void => {
      const points: V[] = loop.map((i: number): V => vertex(skin, i));
      if (points.length > 2 && points.some(inside)) curves.push({ id: "rim." + k, points: points.map(metres), closed: true, colour: "d02020" });
    });
    (option("marks") ?? "").split(";").filter((m: string): boolean => m !== "").forEach((m: string, k: number): void => {
      const p: number[] = m.split(",").map(Number);
      for (const c of [0, 1, 2] as const) {
        const d: V = [0, 0, 0];
        d[c] = 3;
        curves.push({ id: `mark.${k}.${c}`, points: [metres([p[0]! - d[0], p[1]! - d[1], p[2]! - d[2]]), metres([p[0]! + d[0], p[1]! + d[1], p[2]! + d[2]])], closed: false, xray: true, colour: "1060e0" });
      }
    });
    (option("lines") ?? "").split(";").filter((l: string): boolean => l !== "").forEach((l: string, k: number): void => {
      const ends: N.Point[] = l.split(":").map((e: string): N.Point => {
        const p: number[] = e.split(",").map(Number);
        return metres([p[0]!, p[1]!, p[2]!]);
      });
      curves.push({ id: "line." + k, points: ends, closed: false, xray: true, colour: "10a040" });
    });
    NodeCanvasRaster.initialize();
    const written: string[] = [];
    for (const view of (option("views") ?? "front,left").split(",")) {
      const file: string = path.join(folder, `${label}.${view}.png`);
      await fs.writeFile(file, NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 900), [mesh], curves, "depth", `f1 | ${option("mesh") === "trunk" ? "generated trunk family alone" : "reference"} | ${label} | ${view}`).png);
      written.push(file);
    }
    return written;
  }

  /**
   * `--mesh=trunk`: the figure's own head as it stands, in place of the reference: the stored trunk family's skin (its wall with its nets,
   * `AutoMovieLoftViewFullSource`) at every millimetre of `--loft=<from,to>` (default 620 to 905, the head below the crown's cap) and every half
   * degree, as a tube of triangles facing outward. Every mode then reads what the reference's modes read, so a round has its value before.
   */
  function lofted(): IMesh {
    const member: IAutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: IAutoMovieHumanF1.IMember): boolean => m.family.name === "trunk");
    if (member === undefined) throw new Error("f1 has no trunk family");
    const reader: IAutoMovieLoftViewFullSource.IReader = AutoMovieLoftViewFullSource.create(H.source(member.family));
    const [from, to]: number[] = numbers("loft", "620,905");
    const rows: number = Math.floor(Math.min(to!, reader.domain[1]) - from!) + 1;
    const cols: number = 720;
    const positions: number[] = [];
    for (let j: number = 0; j < rows; ++j)
      for (let i: number = 0; i < cols; ++i) {
        const p: readonly number[] = reader.point(from! + j, (2 * Math.PI * i) / cols);
        positions.push(p[0]!, p[1]!, p[2]!);
      }
    const indices: number[] = [];
    for (let j: number = 0; j + 1 < rows; ++j)
      for (let i: number = 0; i < cols; ++i) {
        const a: number = j * cols + i;
        const b: number = j * cols + ((i + 1) % cols);
        indices.push(a, b, a + cols, b, b + cols, a + cols);
      }

    // Outward: the triangles' signed volume about the tube's middle is positive; otherwise every triangle is turned over.
    const mesh: IMesh = { positions, indices };
    const middle: V = [0, 1, 2].map((c: number): number => positions.reduce((sum: number, x: number, k: number): number => (k % 3 === c ? sum + x : sum), 0) / (positions.length / 3)) as V;
    let volume: number = 0;
    for (let t: number = 0; t + 2 < indices.length; t += 3) volume += dot(sub(vertex(mesh, indices[t]!), middle), cross(sub(vertex(mesh, indices[t + 1]!), middle), sub(vertex(mesh, indices[t + 2]!), middle)));
    if (volume >= 0) return mesh;
    const turned: number[] = [];
    for (let t: number = 0; t + 2 < indices.length; t += 3) turned.push(indices[t]!, indices[t + 2]!, indices[t + 1]!);
    return { positions, indices: turned };
  }

  /**
   * The least turn within 6 mm that reads as a crease, degrees: half a right angle. It is a reading convention of this tool and no
   * measure of any person or source. Checked against the f1 reference's own turns at 6 mm (`o-wedge-level.txt`): the alar groove's floor
   * turns 71 and 77 degrees at the two levels through the ala, 30 at the level 4 mm under them and 45 above them, while the nasolabial
   * slope beside it turns 10 to 11; the convention keeps the first and leaves the rest.
   */
  const CREASE_DEG: number = 45;

  /** The sharpest valley of a plane cut inside a region, read 6 mm either side along the cut: its floor in the chart and its turn in degrees, or null. */
  function crease(skin: IMesh, frame: { origin: V; u: V; v: V }, inside: (p: [number, number]) => boolean, out: [number, number]): { u: number; v: number; turn: number } | null {
    let best: { u: number; v: number; turn: number } | null = null;
    for (const chain of R.chains(skin, frame)) {
      const points: [number, number][] = chain.points;
      const count: number = points.length;
      if (count < 5) continue;
      const walk = (i: number, way: 1 | -1): [number, number] | null => {
        let left: number = 6;
        let k: number = i;
        for (let guard: number = 0; guard < count; ++guard) {
          const n: number = k + way;
          if (!chain.closed && (n < 0 || n >= count)) return null;
          const p: [number, number] = points[k]!;
          const q: [number, number] = points[(n + count) % count]!;
          const length: number = Math.hypot(q[0] - p[0], q[1] - p[1]);
          if (length >= left) return [p[0] + ((q[0] - p[0]) * left) / length, p[1] + ((q[1] - p[1]) * left) / length];
          left -= length;
          k = (n + count) % count;
        }
        return null;
      };
      for (let i: number = 0; i < count; ++i) {
        if (!inside(points[i]!)) continue;
        const before: [number, number] | null = walk(i, -1);
        const after: [number, number] | null = walk(i, 1);
        if (before === null || after === null) continue;
        const x: [number, number] = [before[0] - points[i]![0], before[1] - points[i]![1]];
        const y: [number, number] = [after[0] - points[i]![0], after[1] - points[i]![1]];
        const lx: number = Math.hypot(x[0], x[1]);
        const ly: number = Math.hypot(y[0], y[1]);
        if ((x[0] / lx + y[0] / ly) * out[0] + (x[1] / lx + y[1] / ly) * out[1] < 0) continue;
        const turn: number = 180 - (Math.acos(Math.max(-1, Math.min(1, (x[0] * y[0] + x[1] * y[1]) / (lx * ly)))) * 180) / Math.PI;
        if (best === null || turn > best.turn) best = { u: points[i]![0], v: points[i]![1], turn };
      }
    }
    return best;
  }

  /** The head's landmarks on the stored side and the median plane, each by its rule. */
  interface ILandmarks {
    nasion: V;
    pronasale: V;
    subnasale: V;
    tragion: V;
    stomion: V;
    cheilion: V;
    labraleInferius: V;
    sublabiale: V;
    pogonion: V;
    cervical: V;
    globe: V;
    endocanthion: V;
    exocanthion: V;
    alarBase: V;
  }

  /**
   * `--landmarks`: the landmarks the face's centres are placed by, read on the reference by rule, on +Z and the median plane only.
   * Nasion, pronasale, subnasale and tragion are the figure's stored ones (`AutoMovieHumanF1Landmarks`). Stomion is the middle of the
   * lips' rim within 1.5 mm of the median plane and cheilion that rim's point of greatest z (Katina 2015: stomion where the mid-line
   * meets the labial seal, cheilion the seal's end). Going down the median profile from stomion, labrale inferius, sublabiale and
   * pogonion are its first forward, backward and forward extremes. The cervical point is the median cut's point farthest behind the
   * chord from pogonion to the neck's front 60 mm below it. The globe's centre is the middle of the eyeball piece on +Z, a piece whose
   * box is a cube of 18 to 36 mm within 15 percent; the canthi are the points of least and greatest z of the skin's rims within 6 mm of
   * that globe's surface (Katina: where the two lid curves cross).
   */
  function landmarks(mesh: IMesh, found: number[][], skin: IMesh): ILandmarks {
    const chains: { points: [number, number][]; closed: boolean }[] = R.chains(skin, { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] });
    const front = (y: number): number => {
      let best: number = -Infinity;
      for (const chain of chains)
        for (let k: number = 0; k + (chain.closed ? 0 : 1) < chain.points.length; ++k) {
          const a: [number, number] = chain.points[k]!;
          const b: [number, number] = chain.points[(k + 1) % chain.points.length]!;
          if (a[1] > y === b[1] > y) continue;
          best = Math.max(best, a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
        }
      return best;
    };
    const subnasale: V = L.subnasale;
    const loops: V[][] = rims(skin).map((loop: number[]): V[] => loop.map((i: number): V => vertex(skin, i)));
    const mean = (points: V[], c: number): number => points.reduce((sum: number, p: V): number => sum + p[c]!, 0) / points.length;
    const lips: V[] | undefined = loops.find((points: V[]): boolean => points.length > 2 && Math.abs(mean(points, 2)) < 5 && mean(points, 1) < subnasale[1] - 5 && mean(points, 1) > subnasale[1] - 30);
    if (lips === undefined) throw new Error("no rim between the lips");
    const seal: V[] = lips.filter((p: V): boolean => Math.abs(p[2]) < 1.5);
    const stomion: V = [mean(seal, 0), mean(seal, 1), 0];
    const cheilion: V = lips.reduce((a: V, b: V): V => (b[2] > a[2] ? b : a));

    // The first local extreme of the profile below a height: a sample past both neighbours either side, 0.5 mm apart.
    const extreme = (from: number, forward: boolean): V => {
      for (let y: number = from; y > from - 80; y -= 0.5) {
        const x: number = front(y);
        if ([front(y + 1), front(y + 0.5), front(y - 0.5), front(y - 1)].every((n: number): boolean => (forward ? x > n : x < n))) return [x, y, 0];
      }
      throw new Error("the median profile has no such extreme below " + from);
    };
    const labraleInferius: V = extreme(stomion[1] - 2, true);
    const sublabiale: V = extreme(labraleInferius[1] - 1, false);
    const pogonion: V = extreme(sublabiale[1] - 1, true);
    const neck: [number, number] = [front(pogonion[1] - 60), pogonion[1] - 60];
    const span: number = Math.hypot(neck[0] - pogonion[0], 60);
    let cervical: V = pogonion;
    let farthest: number = 0;
    for (const chain of chains)
      for (const p of chain.points) {
        if (p[1] > pogonion[1] || p[1] < neck[1] || p[0] < 0) continue;
        const chord: number = pogonion[0] + ((neck[0] - pogonion[0]) * (pogonion[1] - p[1])) / 60;
        const away: number = Math.abs((neck[0] - pogonion[0]) * (p[1] - pogonion[1]) + 60 * (p[0] - pogonion[0])) / span;
        if (p[0] < chord && away > farthest) {
          farthest = away;
          cervical = [p[0], p[1], 0];
        }
      }
    let globe: V | null = null;
    let radius: number = 0;
    for (const triangles of found.slice(1, 13)) {
      const [low, high]: [V, V] = box(part(mesh, triangles));
      const size: number[] = [high[0] - low[0], high[1] - low[1], high[2] - low[2]];
      if (Math.min(...size) > 18 && Math.max(...size) < 36 && Math.max(...size) < 1.15 * Math.min(...size) && low[2] + high[2] > 0) {
        globe = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
        radius = (size[0]! + size[1]! + size[2]!) / 6;
      }
    }
    if (globe === null) throw new Error("no eyeball piece on +Z");
    const centre: V = globe;
    const margin: V[] = loops.flat().filter((p: V): boolean => p[2] > 0 && Math.hypot(...sub(p, centre)) < radius + 6);
    if (margin.length === 0) throw new Error("no rim round the +Z globe");
    // The alar base (Katina 2015, alare crest: "the facial insertion of each alar base"; FaceBase: on the crease where the ala meets the
    // cheek, at its most lateral and posterior place): over the level cuts from subnasale's height to pronasale's, the floor of the
    // sharpest valley beside the nose on +Z; a valley is the crease where it turns `CREASE_DEG` or more; of those floors the most lateral.
    let alarBase: V | null = null;
    for (let y: number = subnasale[1] + 2; y <= L.pronasale[1]; y += 1) {
      const floor: { u: number; v: number; turn: number } | null = crease(skin, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] }, (p: [number, number]): boolean => p[0] > subnasale[0] - 15 && p[0] < L.pronasale[0] && p[1] > 5 && p[1] < 30, [0.7, 0.7]);
      if (floor !== null && floor.turn >= CREASE_DEG && (alarBase === null || floor.v > alarBase[2])) alarBase = [floor.u, y, floor.v];
    }
    if (alarBase === null) throw new Error("no alar crease on +Z");
    return {
      nasion: L.nasion,
      pronasale: L.pronasale,
      subnasale,
      tragion: L.tragion,
      stomion,
      cheilion,
      labraleInferius,
      sublabiale,
      pogonion,
      cervical,
      globe,
      alarBase,
      endocanthion: margin.reduce((a: V, b: V): V => (b[2] < a[2] ? b : a)),
      exocanthion: margin.reduce((a: V, b: V): V => (b[2] > a[2] ? b : a)),
    };
  }

  /**
   * `--divides [--neck=<x,y,z>]`: the head's dividing surfaces built from the landmarks by `AutoMovieHumanF1FaceCentres`, and whose skin
   * each makes it: of the outer skin's vertices on +Z above the ring, how many each part of `FamilyConicHeadParts.build` keeps by its clip, how many
   * two parts both keep and how many none keeps, with each set's box. Two parts that both keep a vertex would fit that skin twice.
   * `--neck` is the neck's base centre the course starts from (the joints batch's reading).
   */
  function divides(mesh: IMesh, found: number[][], skin: IMesh): string[] {
    const m: ILandmarks = landmarks(mesh, found, skin);
    const axes: [V, V, V] = AutoMovieHumanF1Placement.frame("head").axes;
    const origin: V = [m.tragion[0], m.tragion[1], 0];
    const ring: C.IPlane = C.ring(vector("neck", "-13.4,1415.5,0"), origin, m.cervical);
    const frame: ReturnType<typeof C.eye> = C.eye(m.globe, m.endocanthion, m.exocanthion, axes[0]);
    const mouth: C.IMuzzle = C.muzzle(m.stomion, m.cheilion, axes[0], axes[2]);
    const out: string[] = Object.entries(m).map(([name, p]: [string, V]): string => `${name} ${fixed(p)}`);
    out.push(
      "",
      `head origin ${fixed(origin)}; course ${fixed(ring.normal, 4)}; ring at station ${ring.station.toFixed(1)} through ${fixed(ring.point)}`,
      `eye frame: canthal line ${fixed(frame.axes[2], 3)} (tilt ${((Math.asin(frame.axes[2][1]) * 180) / Math.PI).toFixed(1)} degrees), forward ${fixed(frame.axes[0], 3)}`,
      `mouth line: origin ${fixed(mouth.frame.origin)}, half length ${mouth.half.toFixed(1)} mm`,
      "",
      "part | vertices | least corner | greatest corner",
    );
    const parts: FamilyConicHeadParts.IPart[] = FamilyConicHeadParts.build(m, axes, origin, vector("neck", "-13.4,1415.5,0"));
    const kept: Map<string, V[]> = new Map();
    for (const i of new Set(skin.indices)) {
      const p: V = vertex(skin, i);
      if (p[2] < 0 || dot(sub(p, ring.point), ring.normal) < 0) continue;
      const mine: string = parts.filter((one: FamilyConicHeadParts.IPart): boolean => one.keeps(p)).map((one: FamilyConicHeadParts.IPart): string => one.name).join(" and ") || "no part";
      kept.set(mine, [...(kept.get(mine) ?? []), p]);
    }
    for (const [name, points] of kept)
      out.push(points.length === 0 ? `${name} | 0 | - | -` : `${name} | ${points.length} | ${fixed([0, 1, 2].map((c: number): number => Math.min(...points.map((p: V): number => p[c]!))))} | ${fixed([0, 1, 2].map((c: number): number => Math.max(...points.map((p: V): number => p[c]!))))}`);
    return out;
  }

  /**
   * `--margins`: the +Z lid margins in the eye's own frame (`AutoMovieHumanF1FaceCentres.eye`), by station along the canthal line from
   * the globe's centre: of the skin's rim points within 22 mm of that centre, in bands 2 mm wide, the highest (the upper margin) and the
   * lowest (the lower), each as its height above the line and its distance from it. It is what `AutoMovieHumanF1EyeLaw` is read against.
   */
  function margins(mesh: IMesh, found: number[][], skin: IMesh): string[] {
    const m: ILandmarks = landmarks(mesh, found, skin);
    const frame: ReturnType<typeof C.eye> = C.eye(m.globe, m.endocanthion, m.exocanthion, AutoMovieHumanF1Placement.frame("head").axes[0]);
    const local = (p: V): V => {
      const d: V = sub(p, m.globe);
      return [dot(d, frame.axes[0]), dot(d, frame.axes[1]), dot(d, frame.axes[2])];
    };
    const points: V[] = rims(skin)
      .flatMap((loop: number[]): V[] => loop.map((i: number): V => vertex(skin, i)))
      .filter((p: V): boolean => p[2] > 0 && Math.hypot(...sub(p, m.globe)) < 22)
      .map(local);
    const out: string[] = [
      `eye frame at ${fixed(m.globe)}: forward ${fixed(frame.axes[0], 3)}, up ${fixed(frame.axes[1], 3)}, canthal line ${fixed(frame.axes[2], 3)}; ${points.length} rim points`,
      `endocanthion at station ${local(m.endocanthion)[2].toFixed(1)}, height ${local(m.endocanthion)[1].toFixed(1)}; exocanthion at station ${local(m.exocanthion)[2].toFixed(1)}, height ${local(m.exocanthion)[1].toFixed(1)}`,
      "station band | upper margin: height, distance from the line | lower margin: height, distance from the line",
    ];
    for (let s: number = -20; s < 20; s += 2) {
      const band: V[] = points.filter((q: V): boolean => q[2] >= s && q[2] < s + 2);
      if (band.length === 0) continue;
      const upper: V = band.reduce((a: V, b: V): V => (b[1] > a[1] ? b : a));
      const lower: V = band.reduce((a: V, b: V): V => (b[1] < a[1] ? b : a));
      out.push(`${s}..${s + 2} | ${upper[1].toFixed(1)}, ${Math.hypot(upper[0], upper[1]).toFixed(1)} | ${lower[1].toFixed(1)}, ${Math.hypot(lower[0], lower[1]).toFixed(1)}`);
    }

    // The same rim in the level frame the published contours use: about the globe's centre in the head's frontal plane, the distance of
    // the rim's points in each 15 degree sector from the nasal side (0 nasal, 90 up, 180 temporal), and its ratio to the sector straight
    // up (upper margin) or straight down (lower margin).
    const head: [V, V, V] = AutoMovieHumanF1Placement.frame("head").axes;
    const polar: [number, number][] = rims(skin)
      .flatMap((loop: number[]): V[] => loop.map((i: number): V => vertex(skin, i)))
      .filter((p: V): boolean => p[2] > 0 && Math.hypot(...sub(p, m.globe)) < 22)
      .map((p: V): [number, number] => {
        const d: V = sub(p, m.globe);
        const x: number = dot(d, head[2]);
        const y: number = dot(d, head[1]);
        return [(((Math.atan2(y, -x) * 180) / Math.PI) % 360 + 360) % 360, Math.hypot(x, y)];
      });
    const sector = (degrees: number): number => {
      const near: number[] = polar.filter((q: [number, number]): boolean => Math.abs(((q[0] - degrees + 540) % 360) - 180) <= 7.5).map((q: [number, number]): number => q[1]);
      return near.length === 0 ? NaN : near.reduce((sum: number, r: number): number => sum + r, 0) / near.length;
    };
    out.push("", "level frame about the globe's centre: direction from the nasal side | mean distance of the rim's points within 7.5 degrees | ratio to straight up (0 to 180) or straight down (195 to 345)");
    for (let degrees: number = 0; degrees < 360; degrees += 15) {
      const r: number = sector(degrees);
      if (!Number.isNaN(r)) out.push(`${degrees} | ${r.toFixed(2)} | ${(r / sector(degrees <= 180 ? 90 : 270)).toFixed(2)}`);
    }
    return out;
  }

  /** The front profile of a plane cut's chains: the greatest first chart coordinate at a second one, or -Infinity where the cut has none. */
  function profileOf(chains: { points: [number, number][]; closed: boolean }[]): (y: number) => number {
    return (y: number): number => {
      let best: number = -Infinity;
      for (const chain of chains)
        for (let k: number = 0; k + (chain.closed ? 0 : 1) < chain.points.length; ++k) {
          const a: [number, number] = chain.points[k]!;
          const b: [number, number] = chain.points[(k + 1) % chain.points.length]!;
          if (a[1] > y === b[1] > y) continue;
          best = Math.max(best, a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]));
        }
      return best;
    };
  }

  /** The first local extreme of a profile from a height, going up (`way` 1) or down (-1) in 0.5 mm steps over 40 mm: a sample past both neighbours either side; or null. */
  function extremeOf(front: (y: number) => number, from: number, way: 1 | -1, forward: boolean): [number, number] | null {
    for (let k: number = 0; k < 80; ++k) {
      const y: number = from + way * 0.5 * k;
      const x: number = front(y);
      if (Number.isFinite(x) && [front(y + 1), front(y + 0.5), front(y - 0.5), front(y - 1)].every((n: number): boolean => Number.isFinite(n) && (forward ? x > n : x < n))) return [x, y];
    }
    return null;
  }

  /**
   * The lips' lines by station, in the mouth's frame (`AutoMovieHumanF1FaceCentres.muzzle`: origin the incisors' front, forward, up, and
   * the station toward +Z): every 2 mm from the median plane to cheilion, in the sagittal cut there, the lips' line (the rim's points
   * within 1 mm of the plane), the upper and the lower lip's crest (the profile's first forward extreme above and below the line: the
   * lip's most forward point, since the mesh carries no vermilion colour) and the valley beyond each (the first backward extreme past
   * the crest: under the nose, and the sulcus under the lower lip). Each as height above the mouth's line and distance ahead of it.
   */
  function lipLines(mesh: IMesh, found: number[][], skin: IMesh): string[] {
    const m: ILandmarks = landmarks(mesh, found, skin);
    const axes: [V, V, V] = AutoMovieHumanF1Placement.frame("head").axes;
    const mouth: C.IMuzzle = C.muzzle(m.stomion, m.cheilion, axes[0], axes[2]);
    const seal: V[] | undefined = rims(skin)
      .map((loop: number[]): V[] => loop.map((i: number): V => vertex(skin, i)))
      .find((points: V[]): boolean => points.length > 2 && Math.abs(points.reduce((sum: number, p: V): number => sum + p[2], 0) / points.length) < 5 && points.every((p: V): boolean => p[1] < m.subnasale[1] && p[1] > m.subnasale[1] - 35));
    if (seal === undefined) return ["no rim between the lips"];
    const o: V = mouth.frame.origin;
    const read = (p: [number, number] | null): string => (p === null ? "-" : `${(p[1] - o[1]).toFixed(1)}, ${(p[0] - o[0]).toFixed(1)}`);
    const out: string[] = [`mouth frame: origin ${fixed(o)}, half length ${mouth.half.toFixed(1)}; each point as height above the line's origin, distance ahead of it`, "station | valley under the nose | upper lip's crest | lips' line | lower lip's crest | valley under the lower lip"];
    for (let z: number = 0; z <= mouth.half + 1e-9; z += 2) {
      const near: V[] = seal.filter((p: V): boolean => Math.abs(p[2] - z) < 1);
      if (near.length === 0) continue;
      const line: [number, number] = [near.reduce((sum: number, p: V): number => sum + p[0], 0) / near.length, near.reduce((sum: number, p: V): number => sum + p[1], 0) / near.length];
      const front: (y: number) => number = profileOf(R.chains(skin, { origin: [0, 0, z], u: [1, 0, 0], v: [0, 1, 0] }));
      const upper: [number, number] | null = extremeOf(front, line[1] + 1, 1, true);
      const lower: [number, number] | null = extremeOf(front, line[1] - 1, -1, true);
      out.push(`${z} | ${read(upper === null ? null : extremeOf(front, upper[1] + 1, 1, false))} | ${read(upper)} | ${read(line)} | ${read(lower)} | ${read(lower === null ? null : extremeOf(front, lower[1] - 1, -1, false))}`);
    }
    return out;
  }

  /**
   * The nose's lines by station, in the nose's own frame: the course parallel to subnasale to nasion through the median point level with
   * the alar bases, stations along it from subnasale's level, every 4 mm; in the cut square to the course there, the median outline
   * (the dorsum or the columella: the greatest distance ahead of the course on the median plane), the side outline (the greatest
   * distance from the median plane of the skin more than 2 mm ahead of the course), and the groove beside the nose (the sharpest valley
   * of the cut on +Z, its floor and its turn at 6 mm).
   */
  function noseLines(mesh: IMesh, found: number[][], skin: IMesh): string[] {
    const m: ILandmarks = landmarks(mesh, found, skin);
    const axes: [V, V, V] = AutoMovieHumanF1Placement.frame("head").axes;
    const axis: V = unit(sub(m.nasion, m.subnasale));
    const forward: V = unit(along(axes[0], axis, -dot(axes[0], axis)));
    const root: V = [m.alarBase[0], m.alarBase[1], 0];
    const base: number = dot(sub(m.subnasale, root), axis);
    const length: number = dot(sub(m.nasion, m.subnasale), axis);
    const out: string[] = [`nose frame: course from ${fixed(root)} along ${fixed(axis, 3)}, forward ${fixed(forward, 3)}; subnasale to nasion ${length.toFixed(1)} mm`, "station from subnasale | median outline ahead of the course | side outline from the median plane | groove: ahead, from the median plane, turn deg"];
    for (let s: number = -4; s <= length + 4 + 1e-9; s += 4) {
      const frame: { origin: V; u: V; v: V } = { origin: along(root, axis, base + s), u: forward, v: [0, 0, 1] };
      const chains: { points: [number, number][]; closed: boolean }[] = R.chains(skin, frame);
      const swapped: { points: [number, number][]; closed: boolean }[] = chains.map((chain: { points: [number, number][]; closed: boolean }): { points: [number, number][]; closed: boolean } => ({ points: chain.points.map((p: [number, number]): [number, number] => [p[0], p[1]]), closed: chain.closed }));
      const median: number = profileOf(swapped)(0);
      const side: number = Math.max(-Infinity, ...chains.flatMap((chain: { points: [number, number][] }): number[] => chain.points.filter((p: [number, number]): boolean => p[0] > 2 && p[1] > 0 && p[1] < 40).map((p: [number, number]): number => p[1])));

      // The groove beside the nose is the valley lateral of the nostril's rim: no nearer the median plane than the crease reader's own
      // 6 mm reading length inside the alar base, where the rim's roll would be read as a valley.
      const groove: { u: number; v: number; turn: number } | null = crease(skin, frame, (p: [number, number]): boolean => p[0] > -10 && p[0] < 20 && p[1] > m.alarBase[2] - 6 && p[1] < 30, [0.7, 0.7]);
      out.push(`${s} | ${Number.isFinite(median) ? median.toFixed(1) : "-"} | ${Number.isFinite(side) ? side.toFixed(1) : "-"} | ${groove === null ? "-" : `${groove.u.toFixed(1)}, ${groove.v.toFixed(1)}, ${groove.turn.toFixed(0)}`}`);
    }
    return out;
  }

  /** Run the one mode the arguments name and write its report. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const label: string = option("label") ?? "reading";
    const source: R.ISource = await R.load(root);
    const loaded: { positions: ArrayLike<number>; indices: ArrayLike<number> } = option("source") === "all" ? source.all : source.head;
    const mesh: IMesh = option("mesh") === "trunk" ? lofted() : { positions: Array.from(loaded.positions), indices: Array.from(loaded.indices) };
    const found: number[][] = components(mesh);
    const kept: IMesh = part(mesh, numbers("keep", "0").flatMap((k: number): number[] => found[k] ?? []));
    const folder: string = path.join(root, OUT);
    await fs.mkdir(folder, { recursive: true });

    // `--outer`: only the kept triangles that see the outside past the pieces `--behind` names (default the skin and both eyeballs); the list is computed once and kept beside the reports.
    let skin: IMesh = kept;
    if (process.argv.includes("--outer")) {
      const behind: string = option("behind") ?? "0,2,3";
      const cache: string = path.join(folder, `outer.${option("source") ?? "head"}.${(option("keep") ?? "0").replaceAll(",", "-")}.${behind.replaceAll(",", "-")}.json`);
      const stored: string | null = await fs.readFile(cache, "utf8").catch((): null => null);
      const indices: number[] = stored !== null ? (JSON.parse(stored) as number[]) : outer(kept, part(mesh, behind.split(",").flatMap((k: string): number[] => found[Number(k)] ?? [])));
      if (stored === null) await fs.writeFile(cache, JSON.stringify(indices));
      skin = { positions: mesh.positions, indices };
    }
    const lines: string[] = process.argv.includes("--contours")
      ? [...margins(mesh, found, skin), "", ...lipLines(mesh, found, skin), "", ...noseLines(mesh, found, skin)]
      : process.argv.includes("--margins")
        ? margins(mesh, found, skin)
      : process.argv.includes("--landmarks")
      ? Object.entries(landmarks(mesh, found, skin)).map(([name, p]: [string, V]): string => `${name} ${fixed(p)}`)
      : process.argv.includes("--divides")
        ? divides(mesh, found, skin)
        : process.argv.includes("--components")
      ? pieces(mesh, found, skin)
      : process.argv.includes("--profile")
        ? profile(skin)
        : process.argv.includes("--cast")
          ? cast(skin)
          : process.argv.includes("--radial")
            ? radial(skin)
            : process.argv.includes("--wedge")
              ? wedge(skin)
              : process.argv.includes("--stills")
                ? await stills(skin, folder, label)
                : ["no mode named"];
    await fs.writeFile(path.join(folder, label + ".txt"), [process.argv.slice(2).join(" "), "", ...lines].join("\n") + "\n");
    process.stdout.write(lines.slice(0, 12).join("\n") + "\n");
  }
}

void FamilyConicFace.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
