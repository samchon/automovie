import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";

import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];
type V2 = [number, number];

/**
 * The head renderer's shape table: the realized head/neck chain against the
 * registered reference (verification, "Curves Against The Reference"), as
 * the deviation of each of four readings, maximum and mean in millimetres.
 *
 * Each reading compares like with like (2026-11-08 12:2x; the earlier table
 * read a 6 mm band of her points against our curve at one height, read her
 * slab's mouth, nasal and orbital interior as section skin, and took the
 * chain's phase parameter for a polar angle):
 * - anterior and posterior midline: along each outward normal of our
 *   realized midsagittal curve (phase 0 and pi, every 0.5 mm of station), her
 *   outermost midsagittal point (|Z| < 2 mm) within 1.5 mm of that normal
 *   line and 20 mm of our curve; the deviation is ours less hers along the
 *   normal (positive: ours outside), so a near-level contour such as the
 *   submental is read by its height, not by a horizontal offset;
 * - front silhouette: the same normal reading in the (|Z|, Y) plane between
 *   our largest half breadth at each station and her points;
 * - sections: at every 5 mm of height, her points within 1.5 mm of the plane
 *   binned every 2 degrees of polar angle about our section's centroid, the
 *   outermost of each bin (her skin, not the mouth, nose or orbit interior)
 *   against our ring's radius at that exact angle (the ring sampled at 720
 *   phases and read by polar angle).
 * Rows are taken every 5 mm of the curve's length.
 */
export namespace NodeHeadDeviation {
  /** One row of a reading. */
  export interface IRow {
    /** Our curve's height at the row, mm. */
    y: number;

    /** Our curve's other coordinate at the row (X for midlines, |Z| for the silhouette, the bins read for sections). */
    at: number;

    /** Worst signed deviation in the row, mm (positive: ours outside). */
    worst: number;

    /** Mean absolute deviation in the row, mm. */
    mean: number;

    /** Readings in the row. */
    count: number;
  }

  /** One reading in one registration. */
  export interface IReading {
    /** Reading name. */
    curve: string;

    /** Registration name. */
    registration: string;

    /** Rows. */
    rows: IRow[];

    /** Largest absolute deviation, mm. */
    max: number;

    /** Mean absolute deviation, mm. */
    mean: number;
  }

  /** Every reading of the chain against one registered point set. */
  export function read(chain: IAutoMovieLoftChain, registration: string, points: readonly V3[]): IReading[] {
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const ys: number[] = [];
    for (let y: number = a; y <= z; y += 0.5) ys.push(y);
    const midline: (phase: number) => V2[] = (phase: number): V2[] => ys.map((y: number): V2 => {
      const p: number[] = AutoMovieLoftChain.point(chain, y, phase);
      return [p[0]!, p[1]!];
    });
    const phases: number[] = Array.from({ length: 181 }, (_: unknown, k: number): number => (Math.PI * k) / 180);
    const silhouette: V2[] = ys.map((y: number): V2 => [Math.max(...phases.map((phi: number): number => Math.abs(AutoMovieLoftChain.point(chain, y, phi)[2]!))), y]);
    const mid: V3[] = points.filter((p: V3): boolean => Math.abs(p[2]) < 2);
    return [
      normal("anterior midline", registration, midline(0), mid.filter((p: V3): boolean => p[0] > 0).map((p: V3): V2 => [p[0], p[1]]), 1),
      normal("posterior midline", registration, midline(Math.PI), mid.filter((p: V3): boolean => p[0] < 0).map((p: V3): V2 => [p[0], p[1]]), -1),
      normal("front silhouette", registration, silhouette, points.map((p: V3): V2 => [Math.abs(p[2]), p[1]]), 1),
      sections(chain, registration, points, a, z),
    ];
  }

  /** The normal reading of a plane curve (increasing height) against her plane points; `sign` turns the left normal outward. */
  function normal(curve: string, registration: string, ours: readonly V2[], hers: readonly V2[], sign: 1 | -1): IReading {
    const samples: { y: number; at: number; s: number; d: number | null }[] = [];
    let s: number = 0;
    for (let k: number = 1; k + 1 < ours.length; ++k) {
      const c: V2 = ours[k]!;
      s += Math.hypot(c[0] - ours[k - 1]![0], c[1] - ours[k - 1]![1]);
      const tx: number = ours[k + 1]![0] - ours[k - 1]![0];
      const ty: number = ours[k + 1]![1] - ours[k - 1]![1];
      const l: number = Math.hypot(tx, ty);
      if (!(l > 0)) continue;
      const t: V2 = [tx / l, ty / l];
      const n: V2 = [sign * t[1], -sign * t[0]];
      let best: number | null = null;
      for (const p of hers) {
        const dx: number = p[0] - c[0];
        const dy: number = p[1] - c[1];
        const along: number = dx * n[0] + dy * n[1];
        if (Math.abs(dx * t[0] + dy * t[1]) < 1.5 && Math.abs(along) < 20 && (best === null || along > best)) best = along;
      }
      samples.push({ y: c[1], at: c[0], s, d: best === null ? null : -best });
    }
    return table(curve, registration, samples);
  }

  /** The outer-skin section reading at every 5 mm of height. */
  function sections(chain: IAutoMovieLoftChain, registration: string, points: readonly V3[], a: number, z: number): IReading {
    const rows: IRow[] = [];
    const turns: number[] = Array.from({ length: 720 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 720);
    for (let y: number = a + 2; y <= z - 3; y += 5) {
      const slab: V3[] = points.filter((p: V3): boolean => Math.abs(p[1] - y) < 1.5);
      if (slab.length < 10) continue;
      const ring: V3[] = AutoMovieLoftChain.ring(chain, y, turns) as V3[];
      const cx: number = ring.reduce((m: number, p: V3): number => m + p[0], 0) / ring.length;
      const cz: number = ring.reduce((m: number, p: V3): number => m + p[2], 0) / ring.length;
      const polar: V2[] = ring.map((p: V3): V2 => [Math.atan2(p[2] - cz, p[0] - cx), Math.hypot(p[0] - cx, p[2] - cz)]).sort((u: V2, v: V2): number => u[0] - v[0]);
      const radius: (theta: number) => number = (theta: number): number => {
        const n: number = polar.length;
        let k: number = polar.findIndex((q: V2): boolean => q[0] >= theta);
        if (k < 0) k = 0;
        const hi: V2 = polar[k]!;
        const lo: V2 = polar[(k - 1 + n) % n]!;
        const span: number = (((hi[0] - lo[0]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const off: number = (((theta - lo[0]) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        return span > 0 ? lo[1] + ((hi[1] - lo[1]) * off) / span : lo[1];
      };
      const bins: Map<number, { theta: number; r: number }> = new Map();
      for (const p of slab) {
        const theta: number = Math.atan2(p[2] - cz, p[0] - cx);
        const r: number = Math.hypot(p[0] - cx, p[2] - cz);
        const k: number = Math.floor(((theta + Math.PI) * 90) / Math.PI);
        const known: { theta: number; r: number } | undefined = bins.get(k);
        if (known === undefined || r > known.r) bins.set(k, { theta, r });
      }
      // A bin whose outermost point stands more than 6 mm inside the median outermost radius of the bins within 10 degrees holds no skin point (the slab is sparse there; what it holds is the mouth's, nose's or orbit's interior): it is not read.
      const keys: number[] = [...bins.keys()];
      const skin: { theta: number; r: number }[] = keys
        .filter((k: number): boolean => {
          const near: number[] = keys.filter((j: number): boolean => Math.abs(j - k) <= 5 || Math.abs(j - k) >= 180 - 5).map((j: number): number => bins.get(j)!.r).sort((u: number, v: number): number => u - v);
          return bins.get(k)!.r >= near[Math.floor(near.length / 2)]! - 6;
        })
        .map((k: number): { theta: number; r: number } => bins.get(k)!);
      const d: number[] = skin.map((b: { theta: number; r: number }): number => radius(b.theta) - b.r);
      if (d.length === 0) continue;
      const worst: number = d.reduce((m: number, v: number): number => (Math.abs(v) > Math.abs(m) ? v : m), 0);
      rows.push({ y, at: bins.size, worst, mean: d.reduce((m: number, v: number): number => m + Math.abs(v), 0) / d.length, count: d.length });
    }
    return {
      curve: "sections (outer skin per 2-degree bin)",
      registration,
      rows,
      max: Math.max(0, ...rows.map((r: IRow): number => Math.abs(r.worst))),
      mean: rows.reduce((m: number, r: IRow): number => m + r.mean * r.count, 0) / Math.max(1, rows.reduce((m: number, r: IRow): number => m + r.count, 0)),
    };
  }

  /** Rows every 5 mm of the curve's length from the samples that found her skin. */
  function table(curve: string, registration: string, samples: readonly { y: number; at: number; s: number; d: number | null }[]): IReading {
    const found: { y: number; at: number; s: number; d: number }[] = samples.filter((x: { d: number | null }): boolean => x.d !== null) as { y: number; at: number; s: number; d: number }[];
    const rows: IRow[] = [];
    for (const x of found) {
      const k: number = Math.floor(x.s / 5);
      const last: (IRow & { k: number }) | undefined = rows[rows.length - 1] as (IRow & { k: number }) | undefined;
      if (last === undefined || last.k !== k) rows.push({ k, y: x.y, at: x.at, worst: x.d, mean: Math.abs(x.d), count: 1 } as IRow & { k: number });
      else {
        last.mean = (last.mean * last.count + Math.abs(x.d)) / (last.count + 1);
        last.count += 1;
        if (Math.abs(x.d) > Math.abs(last.worst)) last.worst = x.d;
      }
    }
    const abs: number[] = found.map((x: { d: number }): number => Math.abs(x.d));
    return {
      curve,
      registration,
      rows: rows.map((r: IRow): IRow => ({ y: r.y, at: r.at, worst: r.worst, mean: r.mean, count: r.count })),
      max: abs.length === 0 ? NaN : Math.max(...abs),
      mean: abs.length === 0 ? NaN : abs.reduce((m: number, v: number): number => m + v, 0) / abs.length,
    };
  }

  /** The side overlay of one registration: her midsagittal points (red) and our realized midlines (front orange, back violet), with the reading's worst rows marked. */
  export function side(chain: IAutoMovieLoftChain, registration: string, points: readonly V3[], readings: readonly IReading[], floor: number): NodeArmDraw.IView {
    const mid: V3[] = points.filter((p: V3): boolean => Math.abs(p[2]) < 2 && p[1] > floor);
    const v: NodeArmDraw.IView = NodeArmDraw.open([0, 0, 1], mid);
    NodeArmDraw.dots(v, mid, "#d03030", 2);
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const ys: number[] = [];
    for (let y: number = a; y <= z; y += 0.5) ys.push(y);
    NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, 0) as V3), "#e07000", 2);
    NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, Math.PI) as V3), "#8040c0", 2);
    for (const r of readings.filter((x: IReading): boolean => x.curve.endsWith("midline")))
      for (const row of r.rows.filter((x: IRow): boolean => Math.abs(x.worst) >= 3)) NodeArmDraw.text(v, [row.at, row.y, 0], `${row.worst.toFixed(1)}`, "#006000");
    NodeArmDraw.caption(v, [
      `f1 head/neck, realized midline front (orange) and back (violet) over her midsagittal points (red), ${registration} registration`,
      `normal deviation (ours less hers, green where |d| >= 3 mm): ${readings.map((x: IReading): string => `${x.curve} max ${x.max.toFixed(1)} mean ${x.mean.toFixed(1)}`).join("; ")}`,
    ]);
    return v;
  }
}
