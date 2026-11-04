import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanSkinChartGrid } from "./AutoMovieHumanSkinChartGrid";
import { AutoMovieHumanSkinChartPack } from "./AutoMovieHumanSkinChartPack";

/**
 * Texture coordinates of the generated skin in rest-surface millimetres, read
 * from the lofting surfaces' own parameters.
 *
 * The coordinates serve tiled micro-detail images, so they need to be
 * locally close to an isometry (one millimetre of skin, one millimetre of
 * texture, in every direction) and continuous over large areas; they are
 * not an atlas and no two regions need distinct coordinates.
 *
 * - The head family (`head`, `head.*`) and the neck and trunk (`upper`,
 *   `trunk`) each form one chart, their chains taken from the lowest up:
 *   each chain's meridian lengths start from those the chain below carries
 *   at the shared ring, so the face and the torso carry no seam between
 *   their chains. Their reference direction is `+X`, forward.
 * - Every other chain is its own chart, its reference `+X` square to its
 *   axis, or `+Y` for an axis that runs forward (the feet and toes).
 *
 * On a chain (`AutoMovieHumanSkinChartGrid`) `u` is the signed arc length
 * round the section from its front point, the point farthest along the
 * reference, and `v` the meridian length along the fixed phase. A vertex
 * takes them at its loft coordinates; one whose owner publishes none, or
 * whose owner belongs to another chart, is first located on its piece's own
 * chain by Gauss-Newton on that chain's surface. The cut is at the back,
 * where `u` meets plus and minus half the perimeter: a triangle spanning
 * more than half a turn takes copies of its vertices on the negative side,
 * one perimeter on, so the coordinates stay continuous inside every
 * triangle. Chart boundaries at chain junctions (shoulder, hip, wrist,
 * ankle, finger and toe roots, ears) are discontinuities of the coordinates
 * only, not of position or normal.
 *
 * Remaining distortion: where the phases cross the sections obliquely the
 * chart shears by the cosine of that angle, and near a pole (crown,
 * fingertips) the sections' arcs shrink to a point.
 */
export namespace AutoMovieHumanSkinChart {
  /** One skin piece in millimetres, as split from the whole skin. */
  export interface IPiece {
    /** Part name without the `human.skin.` prefix: `<chain>/<k>`. */
    name: string;

    /** Flat vertex positions in mm. */
    positions: number[];

    /** Flat unit vertex normals. */
    normals: number[];

    /** Flat triangle indices. */
    indices: number[];

    /** Flat loft coordinates `[chain, station, phase]`, three per vertex; NaN where the owner publishes none. */
    coordinates: number[];
  }

  /** A piece with texture coordinates and its cut vertices duplicated. */
  export interface IOutput extends IPiece {
    /** Flat `[u, v, ...]` in rest-surface mm, one pair per vertex. */
    uvs: number[];
  }

  /**
   * Chart every piece.
   *
   * @param pieces Skin pieces of the whole body, in mm
   * @param chains The calibration's chains in mm, in calibration order
   * @returns The pieces in the same order, with coordinates
   */
  export function generate(pieces: readonly IPiece[], chains: readonly IAutoMovieHumanLoftChain[]): IOutput[] {
    const index: Map<string, number> = new Map(chains.map((c: IAutoMovieHumanLoftChain, i: number): [string, number] => [c.name, i]));
    const groups: Map<string, number[]> = new Map();
    pieces.forEach((piece: IPiece, i: number): void => {
      const key: string = chartOf(chainOf(piece.name));
      const list: number[] | undefined = groups.get(key);
      if (list === undefined) groups.set(key, [i]);
      else list.push(i);
    });

    const out: IOutput[] = new Array(pieces.length);
    for (const [key, members] of groups) {
      const grids: Map<number, AutoMovieHumanSkinChartGrid.IGrid> = gridsOf(
        key,
        [...new Set(members.map((i: number): string => chainOf(pieces[i]!.name)))]
          .map((name: string): number | undefined => index.get(name))
          .filter((c: number | undefined): c is number => c !== undefined),
        chains,
      );
      for (const i of members) out[i] = unroll(pieces[i]!, grids, index);
    }
    AutoMovieHumanSkinChartPack.pack(
      [...groups.values()].map((members: number[]): IOutput[] => members.map((i: number): IOutput => out[i]!)),
    );
    return out;
  }

  /** Chain name `<chain>` of a piece name `<chain>/<k>`. */
  export function chainOf(name: string): string {
    return name.slice(0, name.lastIndexOf("/"));
  }

  /** Chart key of a chain: the head family and the neck and trunk share one each. */
  export function chartOf(chain: string): string {
    if (chain === "head" || chain.startsWith("head.")) return "head";
    if (chain === "upper" || chain === "trunk") return "trunk";
    return chain;
  }

  /**
   * The grids of one chart's chains, lowest first, each chain's meridians
   * carried on from the chain below where its first station meets that
   * chain's last.
   */
  function gridsOf(
    key: string,
    members: readonly number[],
    chains: readonly IAutoMovieHumanLoftChain[],
  ): Map<number, AutoMovieHumanSkinChartGrid.IGrid> {
    const lowest: (c: number) => number = (c: number): number => Math.min(...chains[c]!.layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y));
    const ordered: number[] = [...members].sort((a: number, b: number): number => lowest(a) - lowest(b));
    const family: boolean = key === "head" || key === "trunk";
    const grids: Map<number, AutoMovieHumanSkinChartGrid.IGrid> = new Map();
    let previous: AutoMovieHumanSkinChartGrid.IGrid | null = null;
    for (const c of ordered) {
      const chain: IAutoMovieHumanLoftChain = chains[c]!;
      const reference: [number, number, number] = family ? [1, 0, 0] : referenceOf(chain);
      const below: ((u: number) => number) | null =
        family && previous !== null && Math.abs(previous.from + previous.step * (previous.stations - 1) - lowest(c)) <= AutoMovieHumanSkinChartGrid.STEP
          ? topOf(previous)
          : null;
      const grid: AutoMovieHumanSkinChartGrid.IGrid = AutoMovieHumanSkinChartGrid.create(chain, reference, below);
      grids.set(c, grid);
      previous = grid;
    }
    return grids;
  }

  /** A chain's reference: `+X` square to its axis, or `+Y` for an axis that runs forward. */
  function referenceOf(chain: IAutoMovieHumanLoftChain): [number, number, number] {
    const ys: number[] = chain.layers.map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y);
    const a: [number, number, number] = AutoMovieHumanLoftChain.axis(chain, Math.min(...ys));
    const b: [number, number, number] = AutoMovieHumanLoftChain.axis(chain, Math.max(...ys));
    const d: number[] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l: number = Math.hypot(d[0]!, d[1]!, d[2]!) || 1;
    const axis: number[] = d.map((x: number): number => x / l);
    const base: number[] = Math.abs(axis[0]!) > 0.9 ? [0, 1, 0] : [1, 0, 0];
    const along: number = base[0]! * axis[0]! + base[1]! * axis[1]! + base[2]! * axis[2]!;
    const r: number[] = base.map((x: number, k: number): number => x - along * axis[k]!);
    const m: number = Math.hypot(r[0]!, r[1]!, r[2]!) || 1;
    return [r[0]! / m, r[1]! / m, r[2]! / m];
  }

  /** The meridian length a grid's last row carries, as a function of `u`. */
  function topOf(grid: AutoMovieHumanSkinChartGrid.IGrid): (u: number) => number {
    const base: number = (grid.stations - 1) * grid.phases;
    const row: [number, number][] = Array.from({ length: grid.phases }, (_: unknown, j: number): [number, number] => [grid.u[base + j]!, grid.v[base + j]!]).sort(
      (a: [number, number], b: [number, number]): number => a[0] - b[0],
    );
    return (u: number): number => {
      if (u <= row[0]![0]) return row[0]![1];
      if (u >= row[row.length - 1]![0]) return row[row.length - 1]![1];
      let lo: number = 0;
      let hi: number = row.length - 1;
      while (hi - lo > 1) {
        const m: number = (lo + hi) >> 1;
        if (row[m]![0] <= u) lo = m;
        else hi = m;
      }
      const f: number = (u - row[lo]![0]) / Math.max(1e-9, row[hi]![0] - row[lo]![0]);
      return row[lo]![1] + f * (row[hi]![1] - row[lo]![1]);
    };
  }

  /** A piece with its coordinates and the cut's copies. */
  function unroll(
    piece: IPiece,
    grids: ReadonlyMap<number, AutoMovieHumanSkinChartGrid.IGrid>,
    index: ReadonlyMap<string, number>,
  ): IOutput {
    const own: number | undefined = index.get(chainOf(piece.name));
    const count: number = piece.positions.length / 3;
    const uvs: number[] = [];
    const perimeter: number[] = [];
    for (let v: number = 0; v < count; v++) {
      const c: number = piece.coordinates[3 * v]!;
      let grid: AutoMovieHumanSkinChartGrid.IGrid | undefined = Number.isFinite(c) ? grids.get(c) : undefined;
      let s: number = piece.coordinates[3 * v + 1]!;
      let t: number = piece.coordinates[3 * v + 2]!;
      if (grid === undefined || !Number.isFinite(s)) {
        grid = own === undefined ? undefined : grids.get(own);
        if (grid === undefined) {
          uvs.push(0, 0);
          perimeter.push(0);
          continue;
        }
        [s, t] = AutoMovieHumanSkinChartGrid.locate(grid, [piece.positions[3 * v]!, piece.positions[3 * v + 1]!, piece.positions[3 * v + 2]!]);
      }
      const [u, w, L] = AutoMovieHumanSkinChartGrid.at(grid, s, t);
      uvs.push(u, w);
      perimeter.push(L);
    }
    // A triangle spanning more than half a turn crosses the cut at the back;
    // its vertices on the negative side take copies one perimeter on.
    const positions: number[] = [...piece.positions];
    const normals: number[] = [...piece.normals];
    const coordinates: number[] = [...piece.coordinates];
    const indices: number[] = [...piece.indices];
    const copies: Map<number, number> = new Map();
    for (let t: number = 0; t < indices.length; t += 3) {
      const corners: number[] = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
      const us: number[] = corners.map((v: number): number => uvs[2 * v]!);
      const half: number = Math.max(...corners.map((v: number): number => perimeter[v]!)) / 2;
      if (!(Math.max(...us) - Math.min(...us) > half)) continue;
      for (let e: number = 0; e < 3; e++) {
        const v: number = corners[e]!;
        if (!(uvs[2 * v]! < 0)) continue;
        let copy: number | undefined = copies.get(v);
        if (copy === undefined) {
          copy = positions.length / 3;
          copies.set(v, copy);
          positions.push(piece.positions[3 * v]!, piece.positions[3 * v + 1]!, piece.positions[3 * v + 2]!);
          normals.push(piece.normals[3 * v]!, piece.normals[3 * v + 1]!, piece.normals[3 * v + 2]!);
          coordinates.push(piece.coordinates[3 * v]!, piece.coordinates[3 * v + 1]!, piece.coordinates[3 * v + 2]!);
          uvs.push(uvs[2 * v]! + perimeter[v]!, uvs[2 * v + 1]!);
        }
        indices[t + e] = copy;
      }
    }
    return { name: piece.name, positions, normals, indices, coordinates, uvs };
  }
}
