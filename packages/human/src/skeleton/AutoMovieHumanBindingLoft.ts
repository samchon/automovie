import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanBindingQuantize } from "./AutoMovieHumanBindingQuantize";

/**
 * The binding read on the lofting surfaces' own parameters.
 *
 * Each chain carries a grid over its station and phase, a node every
 * {@link SPACING} millimetres of skin each way. A node's pulls are the
 * binding's pulls (`AutoMovieHumanBindingInfluence.pull`) at the chain's own
 * surface point there, read once when a point first needs the node. A
 * tessellated point takes the bilinear blend of its cell's four nodes by its
 * loft coordinates `[chain, station, phase]` and then the strongest four
 * bones. Equal parameters give equal weights, so the copies of one point on
 * a seam share them, and no point of the mesh is searched.
 *
 * A point whose phase is NaN (a pole's apex, a chain's axis) takes the mean
 * of its stations' nodes over the whole ring.
 */
export namespace AutoMovieHumanBindingLoft {
  /** A reader of the pulls at a point in metres, by rig slot. */
  export type Reader = (p: [number, number, number]) => Float64Array;

  /** The binder of one body's chains. */
  export interface IBinder {
    /**
     * The strongest four bones at a point's loft coordinates, or null when
     * the chain is not one of the binder's.
     *
     * @param chain Index of the chain in the calibration.
     * @param station Station on the chain, mm.
     * @param phase Phase in radians, or NaN for the station's centre.
     */
    at(chain: number, station: number, phase: number): [number, number][] | null;
  }

  /** Skin between two grid nodes, mm. */
  export const SPACING: number = 4;

  /** Bones a node keeps: the strongest of its pulls. */
  const KEPT: number = 8;

  /** Fewest phases of a grid ring. */
  const LEAST: number = 8;

  /**
   * A binder of a body's chains.
   *
   * @param chains The calibration's chains, mm, in calibration order.
   * @param scale Metres per calibration millimetre.
   * @param read The pulls at a point in metres.
   * @param count Rig bones, the length of a pull table.
   */
  export function create(
    chains: readonly IAutoMovieLoftChain[],
    scale: number,
    read: Reader,
    count: number,
  ): IBinder {
    const grids: (IGrid | null)[] = chains.map((): IGrid | null => null);
    const sum: Float64Array = new Float64Array(count);
    const touched: number[] = [];
    const add = (grid: IGrid, node: number, w: number): void => {
      if (w <= 0) return;
      if (grid.done[node] === 0) fill(grid, node, scale, read);
      for (let k: number = 0; k < KEPT; k++) {
        const slot: number = grid.slots[node * KEPT + k]!;
        if (slot < 0) break;
        if (sum[slot] === 0) touched.push(slot);
        sum[slot]! += w * grid.weights[node * KEPT + k]!;
      }
    };
    return {
      at: (c: number, station: number, phase: number): [number, number][] | null => {
        const chain: IAutoMovieLoftChain | undefined = chains[c];
        if (chain === undefined || !Number.isFinite(station)) return null;
        const grid: IGrid = grids[c] ?? (grids[c] = gridOf(chain));
        const u: number = Math.min(grid.stations - 1, Math.max(0, (station - grid.from) / grid.step));
        const i: number = Math.min(grid.stations - 2, Math.floor(u));
        const fu: number = grid.stations === 1 ? 0 : u - i;
        if (Number.isFinite(phase)) {
          const turn: number = 2 * Math.PI;
          const v: number = ((((phase % turn) + turn) % turn) / turn) * grid.phases;
          const j: number = Math.floor(v) % grid.phases;
          const fv: number = v - Math.floor(v);
          const j1: number = (j + 1) % grid.phases;
          add(grid, node(grid, i, j), (1 - fu) * (1 - fv));
          add(grid, node(grid, i, j1), (1 - fu) * fv);
          add(grid, node(grid, i + 1, j), fu * (1 - fv));
          add(grid, node(grid, i + 1, j1), fu * fv);
        } else
          for (let j: number = 0; j < grid.phases; j++) {
            add(grid, node(grid, i, j), (1 - fu) / grid.phases);
            add(grid, node(grid, i + 1, j), fu / grid.phases);
          }
        const top: [number, number][] = AutoMovieHumanBindingQuantize.strongest(sum);
        for (const slot of touched) sum[slot] = 0;
        touched.length = 0;
        return top;
      },
    };
  }

  /** One chain's grid. */
  interface IGrid {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Lowest station, mm. */
    from: number;

    /** Station step, mm. */
    step: number;

    /** Rows of stations, at least two. */
    stations: number;

    /** Nodes round each row. */
    phases: number;

    /** Whether each node is read. */
    done: Uint8Array;

    /** Each node's strongest bones by slot, -1 past the last. */
    slots: Int16Array;

    /** Each node's pulls of those bones. */
    weights: Float32Array;

    /** Each row's section sampler, made on the row's first read and shared by its nodes. */
    rows: Map<number, (t: number) => [number, number, number]>;
  }

  /** The node at a station row and phase column. */
  function node(grid: IGrid, i: number, j: number): number {
    return Math.min(grid.stations - 1, i) * grid.phases + j;
  }

  /**
   * A chain's grid: rows every SPACING millimetres from its lowest to its
   * highest layer, and round each row as many nodes as SPACING millimetres
   * fit round its largest section.
   */
  function gridOf(chain: IAutoMovieLoftChain): IGrid {
    const ys: number[] = chain.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y);
    const from: number = Math.min(...ys);
    const to: number = Math.max(...ys);
    const stations: number = Math.max(2, Math.ceil((to - from) / SPACING) + 1);
    const step: number = (to - from) / (stations - 1) || 1;
    let girth: number = 0;
    for (const y of ys) girth = Math.max(girth, perimeter(chain, y));
    const phases: number = Math.max(LEAST, Math.ceil(girth / SPACING));
    const nodes: number = stations * phases;
    return {
      chain,
      from,
      step,
      stations,
      phases,
      done: new Uint8Array(nodes),
      slots: new Int16Array(nodes * KEPT).fill(-1),
      weights: new Float32Array(nodes * KEPT),
      rows: new Map(),
    };
  }

  /** A section's perimeter by a polygon of 64 of its points, mm. */
  function perimeter(chain: IAutoMovieLoftChain, y: number): number {
    const point: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, y);
    let length: number = 0;
    let last: [number, number, number] = point(0);
    for (let k: number = 1; k <= 64; k++) {
      const p: [number, number, number] = point((2 * Math.PI * k) / 64);
      length += Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]);
      last = p;
    }
    return length;
  }

  /** Read one node: the pulls at the chain's surface point there, its strongest KEPT bones. */
  function fill(grid: IGrid, n: number, scale: number, read: Reader): void {
    const i: number = Math.floor(n / grid.phases);
    const j: number = n % grid.phases;
    let row: ((t: number) => [number, number, number]) | undefined = grid.rows.get(i);
    if (row === undefined) grid.rows.set(i, (row = AutoMovieLoftChain.sampler(grid.chain, grid.from + i * grid.step)));
    const p: [number, number, number] = row((2 * Math.PI * j) / grid.phases);
    const pulls: Float64Array = read([p[0] * scale, p[1] * scale, p[2] * scale]);
    let kept: number = 0;
    for (let slot: number = 0; slot < pulls.length; slot++) {
      const w: number = pulls[slot]!;
      if (!(w > 0)) continue;
      // Insert by strength among the kept.
      let at: number = Math.min(kept, KEPT);
      while (at > 0 && w > grid.weights[n * KEPT + at - 1]!) at--;
      if (at >= KEPT) continue;
      for (let k: number = Math.min(kept, KEPT - 1); k > at; k--) {
        grid.slots[n * KEPT + k] = grid.slots[n * KEPT + k - 1]!;
        grid.weights[n * KEPT + k] = grid.weights[n * KEPT + k - 1]!;
      }
      grid.slots[n * KEPT + at] = slot;
      grid.weights[n * KEPT + at] = w;
      kept = Math.min(KEPT, kept + 1);
    }
    grid.done[n] = 1;
  }
}
