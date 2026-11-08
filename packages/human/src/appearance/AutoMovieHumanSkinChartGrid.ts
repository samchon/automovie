import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

/**
 * One chain's texture chart on its own parameters: a grid over its stations
 * and phases, a node every {@link STEP} millimetres of skin, holding at each
 * node `u`, the signed arc length round its section from the section's front
 * point (the point farthest along the chart's reference direction), and `v`,
 * the meridian length along the fixed phase from the chain's first station,
 * plus the length the chain below carries at the shared ring.
 *
 * Along a section `u` is exact arc length and along a phase `v` is exact
 * meridian length, so the chart is an isometry to first order wherever the
 * phases cross the sections square; the cut is at the back, where `u` meets
 * plus and minus half the section's perimeter.
 */
export namespace AutoMovieHumanSkinChartGrid {
  /** Skin between two grid nodes, mm. */
  export const STEP: number = 2;

  /** Fewest phases of a grid ring. */
  const LEAST: number = 64;

  /** Node stride of a location's seed search, each way. */
  const SEED: number = 4;

  /** A chain's chart grid. */
  export interface IGrid {
    /** The chain. */
    chain: IAutoMovieLoftChain;

    /** Lowest station, mm. */
    from: number;

    /** Station step, mm. */
    step: number;

    /** Rows of stations. */
    stations: number;

    /** Nodes round each row. */
    phases: number;

    /** Each node's point, `[x, y, z]` per node, row by row. */
    points: Float64Array;

    /** Each node's signed arc length from its row's front point, mm. */
    u: Float64Array;

    /** Each node's meridian length, mm. */
    v: Float64Array;

    /** Each row's perimeter, mm. */
    perimeter: Float64Array;
  }

  /**
   * A chain's grid.
   *
   * @param chain The chain.
   * @param reference The chart's reference direction: a section's front point lies farthest along it.
   * @param below The meridian length the chain below carries at this chain's first station, as a function of `u`; null for a chain that starts the chart.
   */
  export function create(
    chain: IAutoMovieLoftChain,
    reference: readonly [number, number, number],
    below: ((u: number) => number) | null,
  ): IGrid {
    const ys: number[] = chain.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y);
    const from: number = Math.min(...ys);
    const to: number = Math.max(...ys);
    let girth: number = 0;
    for (const y of [from, (from + to) / 2, to]) girth = Math.max(girth, ringLength(chain, y));
    const stations: number = Math.max(2, Math.ceil((to - from) / STEP) + 1);
    const phases: number = Math.max(LEAST, Math.ceil(girth / STEP));
    const step: number = (to - from) / (stations - 1) || 1;
    const points: Float64Array = new Float64Array(stations * phases * 3);
    const u: Float64Array = new Float64Array(stations * phases);
    const v: Float64Array = new Float64Array(stations * phases);
    const perimeter: Float64Array = new Float64Array(stations);
    for (let k: number = 0; k < stations; k++) {
      const point: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, from + k * step);
      for (let j: number = 0; j < phases; j++) points.set(point((2 * Math.PI * j) / phases), 3 * (k * phases + j));
      perimeter[k] = arcs(points, k, phases, reference, u);
      for (let j: number = 0; j < phases; j++) {
        const n: number = k * phases + j;
        if (k === 0) v[n] = below === null ? 0 : below(u[n]!);
        else {
          const m: number = n - phases;
          v[n] = v[m]! + Math.hypot(points[3 * n]! - points[3 * m]!, points[3 * n + 1]! - points[3 * m + 1]!, points[3 * n + 2]! - points[3 * m + 2]!);
        }
      }
    }
    return { chain, from, step, stations, phases, points, u, v, perimeter };
  }

  /**
   * A chart point and its row's perimeter at loft coordinates: the bilinear
   * blend of the cell's four nodes, `u` unwrapped across the cut first.
   *
   * @param grid The prepared chain grid, borrowed without mutation.
   * @param station Finite station, mm, clamped to the grid's rows.
   * @param phase Phase, radians; NaN marks a pole's apex and takes u=0 with the row-mean meridian. The existing nonfinite-phase branch also handles infinities.
   * @returns A fresh ordinary [u,v,perimeter] array in mm.
   *
   * @evidence contracts/common.md#principled-implementation Bilinearly combines the same four periodic chart nodes in row-major order, first unwrapping each u against the first corner with its own row perimeter, then wrapping by the interpolated perimeter. The producer supplies at least two rows and positive phase count; this reader does not validate arbitrary grid records.
   * @evidence contracts/common.md#clear-and-simple-design Four scalar addresses and weights replace the temporary corner tuples; one loop retains the original lookup and accumulation order.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No resampling, precision change, person rule or cache is added. NaN remains the caller's pole marker, and strict half-perimeter comparisons and the existing nonfinite-phase branch are unchanged.
   * @evidence contracts/common.md#meaningful-documentation States prepared-grid ownership, station/phase and result units, clamping, the intentional pole convention and fresh ordinary-array ownership.
   * @evidence contracts/performance.md#efficient-algorithms A finite-phase query reads four corners with constant scalar scratch and one returned triple, removing the outer corner array and four pair arrays. A nonfinite phase still scans P columns for its required row mean. These are source-level allocation/work counts, not a measured heap or time improvement.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrows the caller's prepared u/v/perimeter tables rather than reevaluating the chain; no query cache, key or invalidation policy is introduced.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fresh three-number result escapes; the query retains no grid, temporary population, task or handle after return or failure. Grid lifetime remains with its caller.
   */
  export function at(grid: IGrid, station: number, phase: number): [number, number, number] {
    const fs: number = Math.min(grid.stations - 1, Math.max(0, (station - grid.from) / grid.step));
    const i: number = Math.min(grid.stations - 2, Math.floor(fs));
    const a: number = fs - i;
    const L: number = (1 - a) * grid.perimeter[i]! + a * grid.perimeter[i + 1]!;
    if (!Number.isFinite(phase)) {
      let mean: number = 0;
      for (let j: number = 0; j < grid.phases; j++) mean += (1 - a) * grid.v[i * grid.phases + j]! + a * grid.v[(i + 1) * grid.phases + j]!;
      return [0, mean / grid.phases, L];
    }
    const turn: number = 2 * Math.PI;
    const fp: number = ((((phase % turn) + turn) % turn) / turn) * grid.phases;
    const j: number = Math.floor(fp) % grid.phases;
    const b: number = fp - Math.floor(fp);
    const j1: number = (j + 1) % grid.phases;
    /** Lower row's first corner; keep all address/weight preparation before grid-value reads. */
    const n0: number = i * grid.phases + j;
    /** Its original bilinear weight. */
    const w0: number = (1 - a) * (1 - b);
    /** Lower row's periodic successor. */
    const n1: number = i * grid.phases + j1;
    /** Its original weight, without reassociating either factor. */
    const w1: number = (1 - a) * b;
    /** Upper row's first corner. */
    const n2: number = (i + 1) * grid.phases + j;
    /** Its original bilinear weight. */
    const w2: number = a * (1 - b);
    /** Upper row's periodic successor. */
    const n3: number = (i + 1) * grid.phases + j1;
    /** Its original bilinear weight. */
    const w3: number = a * b;
    const first: number = grid.u[n0]!;
    let u: number = 0;
    let v: number = 0;
    /** The original lower-left, lower-right, upper-left, upper-right visit order. */
    for (let corner: number = 0; corner < 4; corner++) {
      /** One already prepared address; no grid property is read to select it. */
      const n: number = corner === 0 ? n0 : corner === 1 ? n1 : corner === 2 ? n2 : n3;
      /** The weight prepared alongside that address. */
      const w: number = corner === 0 ? w0 : corner === 1 ? w1 : corner === 2 ? w2 : w3;
      let value: number = grid.u[n]!;
      const row: number = grid.perimeter[Math.floor(n / grid.phases)]!;
      if (value - first > row / 2) value -= row;
      else if (first - value > row / 2) value += row;
      u += w * value;
      v += w * grid.v[n]!;
    }
    if (u > L / 2) u -= L;
    else if (u < -L / 2) u += L;
    return [u, v, L];
  }

  /**
   * The loft coordinates of a point near the chain's surface: the nearest
   * grid node, then Gauss-Newton on the distance to the chain's own surface.
   *
   * @param grid The chain's grid.
   * @param p The point, mm.
   */
  export function locate(grid: IGrid, p: readonly number[]): [number, number] {
    // The seed: the nearest of every SEED-th node each way, then the surface.
    let best: number = 0;
    let least: number = Infinity;
    const rows: number[] = [];
    for (let i: number = 0; i < grid.stations - 1; i += SEED) rows.push(i);
    rows.push(grid.stations - 1);
    for (const i of rows)
      for (let j: number = 0; j < grid.phases; j += SEED) {
        const n: number = i * grid.phases + j;
        const d: number = (grid.points[3 * n]! - p[0]!) ** 2 + (grid.points[3 * n + 1]! - p[1]!) ** 2 + (grid.points[3 * n + 2]! - p[2]!) ** 2;
        if (d < least) {
          least = d;
          best = n;
        }
      }
    const lowest: number = grid.from;
    const highest: number = grid.from + grid.step * (grid.stations - 1);
    let s: number = grid.from + grid.step * Math.floor(best / grid.phases);
    let t: number = (2 * Math.PI * (best % grid.phases)) / grid.phases;
    for (let k: number = 0; k < 8; k++) {
      const q: [number, number, number] = AutoMovieLoftChain.point(grid.chain, s, t);
      const qs: [number, number, number] = AutoMovieLoftChain.point(grid.chain, Math.min(highest, s + 0.05), t);
      const qt: [number, number, number] = AutoMovieLoftChain.point(grid.chain, s, t + 1e-3);
      const ds: number[] = [0, 1, 2].map((c: number): number => (qs[c]! - q[c]!) / Math.max(1e-9, Math.min(highest, s + 0.05) - s));
      const dt: number[] = [0, 1, 2].map((c: number): number => (qt[c]! - q[c]!) / 1e-3);
      const r: number[] = [0, 1, 2].map((c: number): number => p[c]! - q[c]!);
      const a11: number = dot(ds, ds);
      const a12: number = dot(ds, dt);
      const a22: number = dot(dt, dt);
      const b1: number = dot(ds, r);
      const b2: number = dot(dt, r);
      const det: number = a11 * a22 - a12 * a12;
      if (!(Math.abs(det) > 1e-12)) break;
      s = Math.min(highest, Math.max(lowest, s + (b1 * a22 - b2 * a12) / det));
      t += (a11 * b2 - a12 * b1) / det;
    }
    return [s, t];
  }

  /** A row's signed arc lengths from its front point into `u`, and its perimeter. */
  function arcs(points: Float64Array, k: number, phases: number, reference: readonly [number, number, number], u: Float64Array): number {
    const base: number = k * phases;
    let front: number = 0;
    let most: number = -Infinity;
    const along: number[] = [];
    for (let j: number = 0; j < phases; j++) {
      const n: number = 3 * (base + j);
      const d: number = points[n]! * reference[0] + points[n + 1]! * reference[1] + points[n + 2]! * reference[2];
      along.push(d);
      if (d > most) {
        most = d;
        front = j;
      }
    }
    // The front point between samples, by the parabola through the peak and its neighbours.
    const l: number = along[(front - 1 + phases) % phases]!;
    const r: number = along[(front + 1) % phases]!;
    const bend: number = l - 2 * most + r;
    const shift: number = bend < 0 ? Math.max(-0.5, Math.min(0.5, (l - r) / (2 * bend))) : 0;
    const chord: (j: number) => number = (j: number): number => {
      const a: number = 3 * (base + (j % phases));
      const b: number = 3 * (base + ((j + 1) % phases));
      return Math.hypot(points[b]! - points[a]!, points[b + 1]! - points[a + 1]!, points[b + 2]! - points[a + 2]!);
    };
    let total: number = 0;
    for (let j: number = 0; j < phases; j++) total += chord(j);
    // Arc from the front sample onward, less the part of its first chord the front point lies past.
    const offset: number = shift * (shift >= 0 ? chord(front) : chord(front - 1 + phases));
    let run: number = -offset;
    for (let m: number = 0; m < phases; m++) {
      const j: number = (front + m) % phases;
      let value: number = run;
      if (value > total / 2) value -= total;
      u[base + j] = value;
      run += chord(j);
    }
    return total;
  }

  /** A section's perimeter by 128 of its points, mm. */
  function ringLength(chain: IAutoMovieLoftChain, y: number): number {
    const point: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, y);
    let length: number = 0;
    let last: [number, number, number] = point(0);
    for (let k: number = 1; k <= 128; k++) {
      const p: [number, number, number] = point((2 * Math.PI * k) / 128);
      length += Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]);
      last = p;
    }
    return length;
  }

  /** Dot product of two 3-vectors. */
  function dot(a: readonly number[], b: readonly number[]): number {
    return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  }
}
