import { AutoMovieHumanSkinChartAxis } from "./AutoMovieHumanSkinChartAxis";
import { AutoMovieHumanSkinChartMath } from "./AutoMovieHumanSkinChartMath";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import type { IAutoMovieHumanSkinChartAxis } from "./IAutoMovieHumanSkinChartAxis";
import type { IAutoMovieHumanSkinChartGrid } from "./IAutoMovieHumanSkinChartGrid";

type IAxis = IAutoMovieHumanSkinChartAxis;
type IGrid = IAutoMovieHumanSkinChartGrid;
const { bandOf }: typeof AutoMovieHumanSkinChartAxis = AutoMovieHumanSkinChartAxis;
const { fillCircular, wrap }: typeof AutoMovieHumanSkinChartMath = AutoMovieHumanSkinChartMath;

/** The skin chart flattening: a chart sampled on a polar grid, the grid flattened by least squares, and each vertex placed on it. */
export namespace AutoMovieHumanSkinChartFlatten {
  /** Point or direction in mm. */
  export type Vec3 = AutoMovieHumanSkinVector.Vec3;

  /** Vector arithmetic. */
  export const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

  /** Most angular sectors of a polar grid. */
  export const MAX_SECTORS: number = 256;

  /** Fewest angular sectors of a polar grid. */
  export const MIN_SECTORS: number = 32;

  /** Successive over-relaxation sweeps of the flattening. */
  export const SWEEPS: number = 300;

  /** Over-relaxation factor. */
  export const OMEGA: number = 1.85;

  /**
   * Sample a chart's surface on a polar grid and flatten the grid.
   *
   * @param axis The chart's axis
   * @param pieces The chart's pieces
   * @returns The flattened grid
   */
  export function flatten(
    axis: IAxis,
    pieces: readonly AutoMovieHumanSkinChart.IPiece[],
  ): IGrid {
    // Station range and the mean edge length set the station step.
    let lo: number = Infinity;
    let hi: number = -Infinity;
    let edge: number = 0;
    let edges: number = 0;
    const located: number[][] = pieces.map(
      (piece: AutoMovieHumanSkinChart.IPiece): number[] => {
        const band: number = bandOf(piece.name);
        const list: number[] = [];
        for (let i: number = 0; i < piece.positions.length / 3; ++i) {
          const c: [number, number, number] = axis.locate(
            V.at(piece.positions, i),
            band,
          );
          lo = Math.min(lo, c[0]);
          hi = Math.max(hi, c[0]);
          list.push(c[0], c[1], c[2]);
        }
        for (let t: number = 0; t < piece.indices.length; t += 3) {
          edge += V.norm(
            V.sub(
              V.at(piece.positions, piece.indices[t]!),
              V.at(piece.positions, piece.indices[t + 1]!),
            ),
          );
          edges += 1;
        }
        return list;
      },
    );
    const step: number = Math.max(1.5, Math.min(6, edges > 0 ? edge / edges : 1));
    const rows: number = Math.max(2, Math.ceil((hi - lo) / step) + 1);

    // About one station step of arc per sector at the mean radius.
    let rhoSum: number = 0;
    let rhoCount: number = 0;
    for (const list of located)
      for (let i: number = 1; i < list.length; i += 3) {
        rhoSum += list[i]!;
        rhoCount += 1;
      }
    const circumference: number = (2 * Math.PI * rhoSum) / Math.max(1, rhoCount);
    const SECTORS: number =
      16 *
      Math.round(
        Math.min(MAX_SECTORS, Math.max(MIN_SECTORS, circumference / step)) / 16,
      );
    const OVERLAP: number = SECTORS / 16;
    const dTheta: number = (2 * Math.PI) / SECTORS;

    // Mean radius of the vertices nearest each node; empty nodes take the
    // circular interpolation of their row, empty rows the nearest row, and one
    // 3x3 average removes the scatter of vertices off the main sheet.
    const sum: Float64Array = new Float64Array(rows * SECTORS);
    const count: Float64Array = new Float64Array(rows * SECTORS);
    for (const list of located)
      for (let i: number = 0; i < list.length; i += 3) {
        const j: number = Math.min(
          rows - 1,
          Math.max(0, Math.round((list[i]! - lo) / step)),
        );
        const k: number = wrap(
          Math.round((list[i + 2]! + Math.PI) / dTheta),
          SECTORS,
        );
        sum[j * SECTORS + k]! += list[i + 1]!;
        count[j * SECTORS + k]! += 1;
      }
    const sampled: number[][] = [];
    for (let j: number = 0; j < rows; ++j) {
      const row: number[] = [];
      for (let k: number = 0; k < SECTORS; ++k) {
        const n: number = count[j * SECTORS + k]!;
        row.push(n > 0 ? sum[j * SECTORS + k]! / n : NaN);
      }
      sampled.push(fillCircular(row));
    }
    for (let j: number = 0; j < rows; ++j)
      if (Number.isNaN(sampled[j]![0]!))
        for (let d: number = 1; d < rows; ++d) {
          const near: number[] | undefined = [
            sampled[j - d],
            sampled[j + d],
          ].find(
            (r: number[] | undefined): boolean =>
              r !== undefined && !Number.isNaN(r[0]!),
          );
          if (near !== undefined) {
            sampled[j] = near;
            break;
          }
        }
    const radius: Float64Array = new Float64Array(rows * SECTORS);
    for (let j: number = 0; j < rows; ++j)
      for (let k: number = 0; k < SECTORS; ++k) {
        let s: number = 0;
        let n: number = 0;
        for (let dj: number = -1; dj <= 1; ++dj) {
          const row: number[] | undefined = sampled[j + dj];
          if (row === undefined) continue;
          for (let dk: number = -1; dk <= 1; ++dk) {
            s += row[wrap(k + dk, SECTORS)]!;
            n += 1;
          }
        }
        radius[j * SECTORS + k] = s / n;
      }

    // Node positions over the extended columns.
    const C: number = SECTORS + OVERLAP + 1;
    const X: Vec3[] = new Array(rows * C);
    for (let j: number = 0; j < rows; ++j)
      for (let k: number = 0; k < C; ++k)
        X[j * C + k] = axis.point(
          lo + j * step,
          -Math.PI + k * dTheta,
          radius[j * SECTORS + (k % SECTORS)]!,
        );

    // Node frames: section direction e1 and the in-surface direction e2
    // perpendicular to it toward increasing station; NaN where degenerate.
    const frame: Float64Array = new Float64Array(rows * C * 6).fill(NaN);
    for (let j: number = 0; j < rows; ++j)
      for (let k: number = 0; k < C; ++k) {
        const along: Vec3 = V.sub(
          X[j * C + Math.min(C - 1, k + 1)]!,
          X[j * C + Math.max(0, k - 1)]!,
        );
        const up: Vec3 = V.sub(
          X[Math.min(rows - 1, j + 1) * C + k]!,
          X[Math.max(0, j - 1) * C + k]!,
        );
        const normal: Vec3 = V.cross(along, up);
        if (V.norm(along) < 1e-6 || V.norm(normal) < 1e-9) continue;
        const e1: Vec3 = V.normalize(along);
        const e2: Vec3 = V.normalize(V.cross(normal, e1));
        frame.set([...e1, ...e2], (j * C + k) * 6);
      }

    // Initial coordinates: the unrolled cylinder, section arc length from the
    // front reference and the mean meridian.
    const uv: Float64Array = new Float64Array(rows * C * 2);
    const front: number = SECTORS / 2;
    const meanRadius: number[] = [];
    for (let j: number = 0; j < rows; ++j) {
      let s: number = 0;
      for (let k: number = 0; k < SECTORS; ++k) s += radius[j * SECTORS + k]!;
      meanRadius.push(s / SECTORS);
    }
    let meridian: number = 0;
    for (let j: number = 0; j < rows; ++j) {
      if (j > 0)
        meridian += Math.hypot(step, meanRadius[j]! - meanRadius[j - 1]!);
      let arc: number = 0;
      for (let k: number = front; k < C; ++k) {
        if (k > front) arc += V.norm(V.sub(X[j * C + k]!, X[j * C + k - 1]!));
        uv[(j * C + k) * 2] = arc;
        uv[(j * C + k) * 2 + 1] = meridian;
      }
      arc = 0;
      for (let k: number = front - 1; k >= 0; --k) {
        arc -= V.norm(V.sub(X[j * C + k + 1]!, X[j * C + k]!));
        uv[(j * C + k) * 2] = arc;
        uv[(j * C + k) * 2 + 1] = meridian;
      }
    }

    // Edge targets: the edge vector in the mean frame of its two nodes, NaN
    // where neither node has a frame. Horizontal edges join a node to its
    // next sector, vertical edges to its next row.
    const N: number = rows * C;
    const hu: Float64Array = new Float64Array(N).fill(NaN);
    const hv: Float64Array = new Float64Array(N).fill(NaN);
    const vu: Float64Array = new Float64Array(N).fill(NaN);
    const vv: Float64Array = new Float64Array(N).fill(NaN);
    const target: (a: number, b: number) => [number, number] | null = (
      a: number,
      b: number,
    ): [number, number] | null => {
      const okA: boolean = !Number.isNaN(frame[a * 6]!);
      const okB: boolean = !Number.isNaN(frame[b * 6]!);
      if (!okA && !okB) return null;
      const pick: (o: number) => Vec3 = (o: number): Vec3 => {
        const sum: Vec3 = [0, 0, 0];
        for (const node of okA && okB ? [a, b] : okA ? [a] : [b])
          for (let c: number = 0; c < 3; ++c) sum[c] += frame[node * 6 + o + c]!;
        return sum;
      };
      const e1: Vec3 = V.normalize(pick(0));
      const raw: Vec3 = pick(3);
      const e2: Vec3 = V.normalize(V.sub(raw, V.scale(e1, V.dot(raw, e1))));
      const d: Vec3 = V.sub(X[b]!, X[a]!);
      return [V.dot(d, e1), V.dot(d, e2)];
    };
    for (let j: number = 0; j < rows; ++j)
      for (let k: number = 0; k < C; ++k) {
        const node: number = j * C + k;
        const h: [number, number] | null =
          k + 1 < C ? target(node, node + 1) : null;
        if (h !== null) {
          hu[node] = h[0];
          hv[node] = h[1];
        }
        const v: [number, number] | null =
          j + 1 < rows ? target(node, node + C) : null;
        if (v !== null) {
          vu[node] = v[0];
          vv[node] = v[1];
        }
      }

    // Successive over-relaxation of the least-squares edge equations: each
    // node moves toward the mean of what its incident edges ask of it.
    for (let sweep: number = 0; sweep < SWEEPS; ++sweep)
      for (let node: number = 0; node < N; ++node) {
        const k: number = node % C;
        let su: number = 0;
        let sv: number = 0;
        let n: number = 0;
        if (!Number.isNaN(hu[node]!)) {
          su += uv[(node + 1) * 2]! - hu[node]!;
          sv += uv[(node + 1) * 2 + 1]! - hv[node]!;
          ++n;
        }
        if (k > 0 && !Number.isNaN(hu[node - 1]!)) {
          su += uv[(node - 1) * 2]! + hu[node - 1]!;
          sv += uv[(node - 1) * 2 + 1]! + hv[node - 1]!;
          ++n;
        }
        if (!Number.isNaN(vu[node]!)) {
          su += uv[(node + C) * 2]! - vu[node]!;
          sv += uv[(node + C) * 2 + 1]! - vv[node]!;
          ++n;
        }
        if (node >= C && !Number.isNaN(vu[node - C]!)) {
          su += uv[(node - C) * 2]! + vu[node - C]!;
          sv += uv[(node - C) * 2 + 1]! + vv[node - C]!;
          ++n;
        }
        if (n === 0) continue;
        uv[node * 2] = uv[node * 2]! + OMEGA * (su / n - uv[node * 2]!);
        uv[node * 2 + 1] =
          uv[node * 2 + 1]! + OMEGA * (sv / n - uv[node * 2 + 1]!);
      }

    // Gauge: the front node of the middle row keeps its initial coordinates.
    const anchor: number = (Math.floor(rows / 2) * C + front) * 2;
    const shiftU: number = uv[anchor]!;
    for (let i: number = 0; i < uv.length; i += 2) uv[i] = uv[i]! - shiftU;
    return {
      lo,
      step,
      rows,
      sectors: SECTORS,
      overlap: OVERLAP,
      radius,
      uv,
      frame,
    };
  }

  /**
   * Coordinates of one piece, duplicating vertices of triangles that cross the
   * chart's cut.
   *
   * @param axis The chart's axis
   * @param grid The flattened grid
   * @param piece The piece
   * @returns The piece with coordinates
   */
  export function unroll(
    axis: IAxis,
    grid: IGrid,
    piece: AutoMovieHumanSkinChart.IPiece,
  ): AutoMovieHumanSkinChart.IOutput {
    const band: number = bandOf(piece.name);
    const positions: number[] = [...piece.positions];
    const normals: number[] = [...piece.normals];
    const uvs: number[] = [];
    const cylinder: Array<[number, number, number]> = [];
    const count: number = piece.positions.length / 3;
    for (let i: number = 0; i < count; ++i) {
      const c: [number, number, number] = axis.locate(
        V.at(piece.positions, i),
        band,
      );
      cylinder.push(c);
      uvs.push(...evaluate(axis, grid, c[0], c[1], c[2]));
    }

    // A triangle whose angles span more than half a turn crosses the cut at
    // the back; its vertices on the negative side take copies evaluated one
    // turn later, on the grid's continuation past the cut.
    const copies: Map<number, number> = new Map();
    const indices: number[] = [...piece.indices];
    for (let t: number = 0; t < indices.length; t += 3) {
      const a: number = cylinder[indices[t]!]![2];
      const b: number = cylinder[indices[t + 1]!]![2];
      const c: number = cylinder[indices[t + 2]!]![2];
      if (Math.max(a, b, c) - Math.min(a, b, c) <= Math.PI) continue;
      for (let e: number = 0; e < 3; ++e) {
        const v: number = indices[t + e]!;
        const at: [number, number, number] = cylinder[v]!;
        if (at[2] >= 0) continue;
        let copy: number | undefined = copies.get(v);
        if (copy === undefined) {
          copy = positions.length / 3;
          copies.set(v, copy);
          positions.push(...V.at(piece.positions, v));
          normals.push(...V.at(piece.normals, v));
          uvs.push(...evaluate(axis, grid, at[0], at[1], at[2] + 2 * Math.PI));
        }
        indices[t + e] = copy;
      }
    }
    return { name: piece.name, positions, normals, indices, uvs };
  }

  /**
   * Coordinates of a point given in cylindrical coordinates: bilinear grid
   * coordinates plus the radial offset from the sampled surface in the
   * nearest node's frame.
   *
   * @param axis The chart's axis
   * @param grid The flattened grid
   * @param s Station in mm
   * @param rho Radius in mm
   * @param theta Angle, up to the grid's overlap past `+pi`
   * @returns `[u, v]` in mm
   */
  export function evaluate(
    axis: IAxis,
    grid: IGrid,
    s: number,
    rho: number,
    theta: number,
  ): [number, number] {
    const SECTORS: number = grid.sectors;
    const C: number = SECTORS + grid.overlap + 1;
    const gx: number = Math.min(
      C - 1,
      Math.max(0, ((theta + Math.PI) / (2 * Math.PI)) * SECTORS),
    );
    const gy: number = Math.min(
      grid.rows - 1,
      Math.max(0, (s - grid.lo) / grid.step),
    );
    const k: number = Math.min(C - 2, Math.floor(gx));
    const j: number = Math.min(grid.rows - 2, Math.floor(gy));
    const fx: number = gx - k;
    const fy: number = gy - j;
    const w: number[] = [
      (1 - fx) * (1 - fy),
      fx * (1 - fy),
      (1 - fx) * fy,
      fx * fy,
    ];
    const nodes: number[] = [
      j * C + k,
      j * C + k + 1,
      (j + 1) * C + k,
      (j + 1) * C + k + 1,
    ];
    let u: number = 0;
    let v: number = 0;
    let r: number = 0;
    nodes.forEach((node: number, i: number): void => {
      u += w[i]! * grid.uv[node * 2]!;
      v += w[i]! * grid.uv[node * 2 + 1]!;
      const row: number = Math.floor(node / C);
      r += w[i]! * grid.radius[row * SECTORS + ((node % C) % SECTORS)]!;
    });

    // Radial offset from the sampled sheet, resolved in the nearest valid frame.
    const offset: number = rho - r;
    if (Math.abs(offset) > 1e-6) {
      let node: number = -1;
      let weight: number = -1;
      nodes.forEach((n: number, i: number): void => {
        if (!Number.isNaN(grid.frame[n * 6]!) && w[i]! > weight) {
          node = n;
          weight = w[i]!;
        }
      });
      if (node !== -1) {
        const radial: Vec3 = V.sub(
          axis.point(s, theta, 1),
          axis.point(s, theta, 0),
        );
        const f: Float64Array = grid.frame.subarray(node * 6, node * 6 + 6);
        u += offset * (radial[0] * f[0]! + radial[1] * f[1]! + radial[2] * f[2]!);
        v += offset * (radial[0] * f[3]! + radial[1] * f[4]! + radial[2] * f[5]!);
      }
    }
    return [u, v];
  }

}
