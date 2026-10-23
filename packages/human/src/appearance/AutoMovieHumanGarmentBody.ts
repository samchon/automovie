import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

/**
 * The generated skin a garment is cut from, welded into one mesh, and the
 * body landmarks its pattern is drawn against.
 *
 * Garments read the skin the generator actually emitted (`human.skin.<chain>/<k>`
 * parts in model metres), never the calibration, so any later body warp or
 * parameter law dresses correctly without a second shape authority. Only the
 * chains a basic garment can cover are read: `trunk`, `upper`, `leg.left` and
 * `leg.right`. The split parts duplicate the vertices they share, with equal
 * positions and normals, so welding by position restores the one closed
 * surface the lofter built, including the crotch contact ring.
 *
 * Landmarks are measured on that surface in height bins of one hundredth of
 * the trunk's height, in the registered frame (forward +X, up +Y, lateral +Z):
 *
 * - `crotch` and `axilla` are the trunk's bottom and top, its branch events;
 * - `waist` is the narrowest lateral width in the middle half of the trunk;
 * - `buttock` is the most posterior point between crotch and waist;
 * - `bust` is the most anterior point of the breast columns (lateral offset
 *   0.15 to 0.6 of the half-width) between waist and a tenth of the trunk
 *   height above the axilla, and `underbust` the least anterior one between
 *   waist and bust, the inframammary fold;
 * - `midline` is the mean lateral centre and `crotchCentre` the middle of the
 *   front and back pinch points of the crotch ring.
 *
 * These are rules on the surface, not values of one person, so every body
 * the generator emits yields its own landmarks.
 */
export namespace AutoMovieHumanGarmentBody {
  /** Chain kinds a garment may cover, by bit. */
  export const enum Chain {
    /** `trunk`: crotch ring to the axillary ring. */
    Trunk = 1,

    /** `upper`: axillary ring to the neck, shoulders included. */
    Upper = 2,

    /** `leg.left` (+Z side). */
    LegLeft = 4,

    /** `leg.right` (-Z side). */
    LegRight = 8,
  }

  /** Welded skin of the covered chains and its landmarks, model metres. */
  export interface IBody {
    /** Flat vertex positions. */
    positions: Float64Array;

    /** Flat unit vertex normals of the whole skin. */
    normals: Float64Array;

    /** Flat triangle vertex indices, counter-clockwise from outside. */
    triangles: Uint32Array;

    /** {@link Chain} bit of each triangle. */
    chains: Uint8Array;

    /** Body landmarks. */
    landmarks: ILandmarks;

    /** Offsets of each vertex's skin neighbours in `neighbours`, length V + 1. */
    offsets: Uint32Array;

    /** Concatenated skin neighbour lists. */
    neighbours: Uint32Array;

    /** Skin vertices by cubic cell of side {@link CELL}, keyed by {@link cell}. */
    grid: Map<number, number[]>;
  }

  /** Side of the proximity grid's cells, model metres. */
  export const CELL: number = 0.005;

  /** Grid key of the cell holding a point. */
  export function cell(x: number, y: number, z: number): number {
    return key(
      Math.floor(x / CELL),
      Math.floor(y / CELL),
      Math.floor(z / CELL),
    );
  }

  /** Grid key of integer cell coordinates, each within +-2^9 cells. */
  function key(i: number, j: number, k: number): number {
    return ((i + 512) * 1024 + (j + 512)) * 1024 + (k + 512);
  }

  /**
   * Skin vertex nearest a point.
   *
   * Walks the skin graph from `from` to a closer neighbour while one exists;
   * a negative `from` or `reseed` first takes the nearest vertex of the
   * point's grid neighbourhood (27 cells), which also escapes a walk stuck on
   * the far wall of a narrow hollow. Falls back to `from` when the
   * neighbourhood is empty.
   *
   * @param body Welded skin
   * @param x Point X
   * @param y Point Y
   * @param z Point Z
   * @param from Starting vertex, or -1
   * @param reseed Whether to start from the grid neighbourhood
   * @returns Index of the nearest skin vertex found
   */
  export function nearest(
    body: IBody,
    x: number,
    y: number,
    z: number,
    from: number,
    reseed: boolean,
  ): number {
    const P: Float64Array = body.positions;
    const distance = (v: number): number =>
      (P[3 * v]! - x) ** 2 +
      (P[3 * v + 1]! - y) ** 2 +
      (P[3 * v + 2]! - z) ** 2;
    let best: number = from;
    let value: number = from < 0 ? Infinity : distance(from);
    if (from < 0 || reseed) {
      const i: number = Math.floor(x / CELL);
      const j: number = Math.floor(y / CELL);
      const k: number = Math.floor(z / CELL);
      for (let a: number = -1; a <= 1; a++)
        for (let b: number = -1; b <= 1; b++)
          for (let c: number = -1; c <= 1; c++)
            for (const v of body.grid.get(key(i + a, j + b, k + c)) ?? []) {
              const d: number = distance(v);
              if (d < value) {
                value = d;
                best = v;
              }
            }
    }
    if (best < 0) return from;
    for (let step: number = 0; step < 64; step++) {
      let moved: boolean = false;
      for (
        let n: number = body.offsets[best]!;
        n < body.offsets[best + 1]!;
        n++
      ) {
        const v: number = body.neighbours[n]!;
        const d: number = distance(v);
        if (d < value) {
          value = d;
          best = v;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return best;
  }

  /** Heights (Y), lateral and forward positions of the body landmarks, model metres. */
  export interface ILandmarks {
    /** Crotch height: the trunk's bottom ring. */
    crotch: number;

    /** Axillary height: the trunk's top ring. */
    axilla: number;

    /** Waist height: narrowest lateral width of the middle trunk. */
    waist: number;

    /** Height of the most posterior buttock point. */
    buttock: number;

    /** Height of the most anterior breast point. */
    bust: number;

    /** Height of the inframammary fold, least anterior between waist and bust. */
    underbust: number;

    /** Lateral (Z) position of the body midline. */
    midline: number;

    /** Forward (X) middle of the crotch ring's front and back pinch points. */
    crotchCentre: number;

    /** Crotch-to-waist height, the length unit of lower-garment patterns. */
    span: number;

    /**
     * Forward (X) centre of the trunk section at a height, clamped to the
     * trunk; with `midline`, the axis that phase angles turn about.
     */
    centre: (y: number) => number;
  }

  /**
   * Weld the covered skin parts and measure the landmarks.
   *
   * @param parts Generated model parts in model metres; only `human.skin.`
   *   parts of the covered chains are read.
   * @returns The welded skin, or null when the model lacks a trunk.
   */
  export function create(parts: readonly IAutoMovieModelPart[]): IBody | null {
    const index: Map<string, number> = new Map();
    const positions: number[] = [];
    const normals: number[] = [];
    const triangles: number[] = [];
    const chains: number[] = [];

    for (const part of parts) {
      const kind: Chain | null = chainOf(part.id);
      if (kind === null || part.geometry.type !== "mesh") continue;
      const mesh: IAutoMovieMesh = part.geometry.mesh;
      const p: readonly number[] = mesh.positions;
      const n: readonly number[] | null = mesh.normals;
      const local: number[] = [];
      for (let v: number = 0; v < p.length / 3; v++) {
        const key: string = `${p[3 * v]},${p[3 * v + 1]},${p[3 * v + 2]}`;
        let welded: number | undefined = index.get(key);
        if (welded === undefined) {
          welded = positions.length / 3;
          index.set(key, welded);
          positions.push(p[3 * v]!, p[3 * v + 1]!, p[3 * v + 2]!);
          normals.push(
            n?.[3 * v] ?? 0,
            n?.[3 * v + 1] ?? 0,
            n?.[3 * v + 2] ?? 0,
          );
        }
        local.push(welded);
      }
      const indices: readonly number[] =
        mesh.indices ?? local.map((_: number, i: number): number => i);
      for (let t: number = 0; t + 2 < indices.length; t += 3) {
        triangles.push(
          local[indices[t]!]!,
          local[indices[t + 1]!]!,
          local[indices[t + 2]!]!,
        );
        chains.push(kind);
      }
    }
    if (!chains.includes(Chain.Trunk)) return null;

    const body: Omit<IBody, "landmarks"> = {
      positions: Float64Array.from(positions),
      normals: Float64Array.from(normals),
      triangles: Uint32Array.from(triangles),
      chains: Uint8Array.from(chains),
      ...proximity(positions, triangles),
    };
    return { ...body, landmarks: measure(body) };
  }

  /** Skin adjacency and the proximity grid of {@link nearest}. */
  function proximity(
    positions: readonly number[],
    triangles: readonly number[],
  ): Pick<IBody, "offsets" | "neighbours" | "grid"> {
    const count: number = positions.length / 3;
    const sets: Set<number>[] = Array.from(
      { length: count },
      (): Set<number> => new Set(),
    );
    for (let t: number = 0; t < triangles.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const a: number = triangles[t + k]!;
        const b: number = triangles[t + ((k + 1) % 3)]!;
        sets[a]!.add(b);
        sets[b]!.add(a);
      }
    const offsets: Uint32Array = new Uint32Array(count + 1);
    for (let v: number = 0; v < count; v++)
      offsets[v + 1] = offsets[v]! + sets[v]!.size;
    const neighbours: Uint32Array = new Uint32Array(offsets[count]!);
    sets.forEach((s: Set<number>, v: number): void => {
      let i: number = offsets[v]!;
      for (const n of s) neighbours[i++] = n;
    });

    const grid: Map<number, number[]> = new Map();
    for (let v: number = 0; v < count; v++) {
      const k: number = cell(
        positions[3 * v]!,
        positions[3 * v + 1]!,
        positions[3 * v + 2]!,
      );
      const list: number[] | undefined = grid.get(k);
      if (list === undefined) grid.set(k, [v]);
      else list.push(v);
    }
    return { offsets, neighbours, grid };
  }

  /** Covered chain kind of a skin part id, or null. */
  function chainOf(id: string): Chain | null {
    if (!id.startsWith("human.skin.")) return null;
    const chain: string = id.slice("human.skin.".length, id.lastIndexOf("/"));
    return chain === "trunk"
      ? Chain.Trunk
      : chain === "upper"
        ? Chain.Upper
        : chain === "leg.left"
          ? Chain.LegLeft
          : chain === "leg.right"
            ? Chain.LegRight
            : null;
  }

  /** Extents of the skin within one height bin. */
  interface IBin {
    /** Least and greatest forward (X) position. */
    x: [number, number];

    /** Least and greatest lateral (Z) position. */
    z: [number, number];

    /** Whether any vertex fell in the bin. */
    filled: boolean;
  }

  /** Measure the landmarks of the module note on the welded skin. */
  function measure(body: Omit<IBody, "landmarks">): ILandmarks {
    // Vertex sets by chain: trunk alone, and trunk with upper for the bust.
    const trunk: Set<number> = new Set();
    const chest: Set<number> = new Set();
    body.chains.forEach((kind: number, t: number): void => {
      for (let k: number = 0; k < 3; k++) {
        const v: number = body.triangles[3 * t + k]!;
        if (kind === Chain.Trunk) trunk.add(v);
        if (kind === Chain.Trunk || kind === Chain.Upper) chest.add(v);
      }
    });
    const y = (v: number): number => body.positions[3 * v + 1]!;

    let crotch: number = Infinity;
    let axilla: number = -Infinity;
    for (const v of trunk) {
      crotch = Math.min(crotch, y(v));
      axilla = Math.max(axilla, y(v));
    }
    const length: number = axilla - crotch;
    const count: number = 100;
    const step: number = length / count;
    const bin = (h: number): number =>
      Math.min(count - 1, Math.max(0, Math.floor((h - crotch) / step)));
    const height = (b: number): number => crotch + (b + 0.5) * step;

    const bins: IBin[] = Array.from(
      { length: count },
      (): IBin => ({
        x: [Infinity, -Infinity],
        z: [Infinity, -Infinity],
        filled: false,
      }),
    );
    for (const v of trunk) {
      const b: IBin = bins[bin(y(v))]!;
      const x: number = body.positions[3 * v]!;
      const z: number = body.positions[3 * v + 2]!;
      b.x = [Math.min(b.x[0], x), Math.max(b.x[1], x)];
      b.z = [Math.min(b.z[0], z), Math.max(b.z[1], z)];
      b.filled = true;
    }
    const filled: number[] = bins
      .map((b: IBin, k: number): number => (b.filled ? k : -1))
      .filter((k: number): boolean => k >= 0);
    const midline: number =
      filled.reduce(
        (sum: number, k: number): number =>
          sum + (bins[k]!.z[0] + bins[k]!.z[1]) / 2,
        0,
      ) / filled.length;

    // Extremum of a per-bin measure over a bin range.
    const extremum = (
      from: number,
      to: number,
      measure: (k: number) => number,
      sign: 1 | -1,
    ): number => {
      let best: number = from;
      let value: number = -Infinity;
      for (let k: number = from; k <= to; k++) {
        if (!bins[k]!.filled) continue;
        const m: number = sign * measure(k);
        if (m > value) {
          value = m;
          best = k;
        }
      }
      return best;
    };

    const waistBin: number = extremum(
      Math.round(0.25 * count),
      Math.round(0.75 * count),
      (k: number): number => bins[k]!.z[1] - bins[k]!.z[0],
      -1,
    );
    const buttockBin: number = extremum(
      0,
      waistBin,
      (k: number): number => bins[k]!.x[0],
      -1,
    );

    // Breast columns: front-most X of trunk and upper vertices whose lateral
    // offset is 0.15 to 0.6 of the trunk half-width at the waist, in bins
    // extended a tenth of the trunk height above the axilla.
    const extended: number = Math.round(1.1 * count);
    const front: number[] = new Array<number>(extended).fill(-Infinity);
    const half: number = (bins[waistBin]!.z[1] - bins[waistBin]!.z[0]) / 2;
    for (const v of chest) {
      const h: number = y(v);
      const k: number = Math.floor((h - crotch) / step);
      if (k < 0 || k >= extended) continue;
      const lateral: number = Math.abs(body.positions[3 * v + 2]! - midline);
      if (lateral < 0.15 * half || lateral > 0.6 * half) continue;
      front[k] = Math.max(front[k]!, body.positions[3 * v]!);
    }
    const anterior = (from: number, to: number, sign: 1 | -1): number => {
      let best: number = from;
      let value: number = -Infinity;
      for (let k: number = from; k <= to; k++) {
        if (!Number.isFinite(front[k]!)) continue;
        if (sign * front[k]! > value) {
          value = sign * front[k]!;
          best = k;
        }
      }
      return best;
    };
    const bustBin: number = anterior(waistBin, extended - 1, 1);
    const underbustBin: number = anterior(waistBin, bustBin, -1);

    // Crotch ring pinch points: the lowest bin's vertices nearest the midline.
    let frontPinch: number = -Infinity;
    let backPinch: number = Infinity;
    for (const v of trunk) {
      if (y(v) > crotch + step) continue;
      if (Math.abs(body.positions[3 * v + 2]! - midline) > 0.05 * half)
        continue;
      frontPinch = Math.max(frontPinch, body.positions[3 * v]!);
      backPinch = Math.min(backPinch, body.positions[3 * v]!);
    }
    const crotchCentre: number = Number.isFinite(frontPinch)
      ? (frontPinch + backPinch) / 2
      : (bins[filled[0]!]!.x[0] + bins[filled[0]!]!.x[1]) / 2;

    const waist: number = height(waistBin);
    return {
      crotch,
      axilla,
      waist,
      buttock: height(buttockBin),
      bust: crotch + (bustBin + 0.5) * step,
      underbust: crotch + (underbustBin + 0.5) * step,
      midline,
      crotchCentre,
      span: waist - crotch,
      centre: (h: number): number => {
        // Nearest filled bin; centres change slowly with height.
        let k: number = bin(h);
        for (let d: number = 0; d < count; d++) {
          if (bins[Math.max(0, k - d)]!.filled) {
            k = Math.max(0, k - d);
            break;
          }
          if (bins[Math.min(count - 1, k + d)]!.filled) {
            k = Math.min(count - 1, k + d);
            break;
          }
        }
        return (bins[k]!.x[0] + bins[k]!.x[1]) / 2;
      },
    };
  }
}
