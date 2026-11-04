import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/**
 * Surface health over every chain of a body, one data-driven pass (#3057):
 * the defect classes of `packages/human/docs/testing/consistency.md` read on
 * each chain's own surface points, not per site.
 *
 * - Step (STEP, DENT): the sharpest turn of each meridian (the chain's points
 *   at one phase along its stations, resampled every 1 mm of arc) over a
 *   10 mm chord, as the sagitta past the 12.5 mm radius' 1.04 mm; at most the
 *   crease bound `HumanAnatomyShared.CREASE`, 1 mm, so a turn tighter than
 *   about 7 mm of radius fails, a rim or a groove alike.
 * - Ripple (RIB): runs of one turning sense along a meridian shorter than the
 *   10 mm chord, each turning more than the class A 0.1 degree, between runs
 *   of the other sense: an alternation finer than the shortest feature the
 *   catalog resolves, which shades as stripes.
 * - Fold: surface cells whose normal `P_s x P_t`, from differences of the
 *   chain's points, faces against the chain's own outward sense (the sense
 *   most of its cells take, read from the section's centroid outward), where
 *   the surface has turned over on itself.
 *
 * - Centre track (CUR-4): the section centres resampled every 1 mm keep the
 *   same crease bound, since a turn of the centre is carried by the outline
 *   on at least one side; an offset layer reads as a tent in the track.
 *
 * Self-crossing rings are the section audit's (`HumanSectionAudit`); seams
 * and blends the seam audit's; 5 mm at each chain end, where a ring closes to
 * a pole or a join takes over, are left to those.
 */
export namespace HumanSurfaceAudit {
  /** Meridians read per chain, evenly spread in phase. */
  export const MERIDIANS: number = 48;

  /** Chord of the step reading, input mm. */
  export const CHORD: number = 10;

  /** Sagitta of the 12.5 mm radius over the 10 mm chord, `12.5 - sqrt(12.5^2 - 5^2)`, mm. */
  export const SMOOTH: number = 12.5 - Math.sqrt(12.5 ** 2 - 5 ** 2);

  /** Length at each chain end left to the seam and cap readers, input mm. */
  export const ENDS: number = 5;

  /** Least turn of a ripple's run, radians: the class A 0.1 degree. */
  export const TURN: number = (0.1 * Math.PI) / 180;

  /** Every surface-health row of every chain of a body. */
  export function rows(person: string, body: IAutoMovieHumanBodyCalibration, k: number): IRow[] {
    return body.chains.flatMap((c: IAutoMovieHumanLoftChain): IRow[] => chain(person, c, k));
  }

  /** The surface-health rows of one chain. */
  export function chain(person: string, c: IAutoMovieHumanLoftChain, k: number): IRow[] {
    const first: number = c.layers[0]!.y;
    const last: number = c.layers[c.layers.length - 1]!.y;
    const count: number = Math.max(2, Math.round(((last - first) * k) / 1));
    const stations: number[] = Array.from({ length: count + 1 }, (_: unknown, i: number): number => first + ((last - first) * i) / count);
    const phases: number[] = Array.from({ length: MERIDIANS }, (_: unknown, m: number): number => (2 * Math.PI * m) / MERIDIANS);
    const rings: V3[][] = stations.map((s: number): V3[] => AutoMovieHumanLoftChain.ring(c, s, phases).map((p: [number, number, number]): V3 => [p[0] * k, p[1] * k, p[2] * k]));

    let step: [number, string] = [0, "none"];
    let ripple: [number, string] = [0, "none"];
    for (let m: number = 0; m < MERIDIANS; m++) {
      const line: V3[] = resample(rings.map((ring: V3[]): V3 => ring[m]!), 1);
      const s: { value: number; at: number } = sharpest(line);
      if (s.value > step[0]) step = [s.value, `phase ${phases[m]!.toFixed(3)}, ${s.at.toFixed(0)} mm along`];
      const r: { count: number; at: number } = ripples(line);
      if (r.count > ripple[0]) ripple = [r.count, `phase ${phases[m]!.toFixed(3)}, ${r.at.toFixed(0)} mm along`];
    }
    const folds: { count: number; at: string } = folded(rings, stations.map((s: number): number => s * k));

    // The section centres' track (CUR-4): a turn of the centre is carried by the outline on one side, so it keeps the meridians' crease bound.
    const centres: V3[] = rings.map((ring: V3[]): V3 => {
      const mean: V3 = [0, 0, 0];
      for (const p of ring) for (let i: number = 0; i < 3; i++) mean[i]! += p[i]! / ring.length;
      return mean;
    });
    const track: { value: number; at: number } = sharpest(resample(centres, 1));
    return [
      { person, site: `${c.name} meridian step: sagitta over ${CHORD} mm past the 12.5 mm radius, worst at ${step[1]} (STEP)`, value: step[0], low: 0, high: HumanAnatomyShared.CREASE, unit: "mm" },
      { person, site: `${c.name} meridian ripple: alternating runs shorter than ${CHORD} mm, most at ${ripple[1]} (RIB)`, value: ripple[0], low: 0, high: 0, unit: "runs" },
      { person, site: `${c.name} folded cells facing against the chain's outward sense, first at ${folds.at} (FOLD)`, value: folds.count, low: 0, high: 0, unit: "cells" },
      { person, site: `${c.name} centre track: sagitta over ${CHORD} mm past the 12.5 mm radius, at ${track.at.toFixed(0)} mm along (CUR-4)`, value: track.value, low: 0, high: HumanAnatomyShared.CREASE, unit: "mm" },
    ];
  }

  /**
   * A polyline resampled at a fixed arc step, its ends kept: the reading's
   * chord then spans the same skin length wherever the stations crowd.
   */
  export function resample(points: readonly V3[], step: number): V3[] {
    const out: V3[] = [points[0]!];
    let carry: number = 0;
    for (let i: number = 1; i < points.length; i++) {
      const a: V3 = points[i - 1]!;
      const b: V3 = points[i]!;
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      let t: number = step - carry;
      while (t <= d) {
        const f: number = t / d;
        out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])]);
        t += step;
      }
      carry = d - (t - step);
    }
    return out;
  }

  /**
   * The sharpest turn of a 1 mm polyline: at each point away from the ends,
   * the distance of the point from the chord between the points 5 mm before
   * and after it, less {@link SMOOTH}, and the arc length where it is largest.
   */
  export function sharpest(line: readonly V3[]): { value: number; at: number } {
    const half: number = CHORD / 2;
    let value: number = 0;
    let at: number = 0;
    for (let i: number = Math.max(half, ENDS + half); i + Math.max(half, ENDS + half) < line.length; i++) {
      const a: V3 = line[i - half]!;
      const b: V3 = line[i + half]!;
      const p: V3 = line[i]!;
      const sag: number = distance(p, a, b) - SMOOTH;
      if (sag > value) {
        value = sag;
        at = i;
      }
    }
    return { value, at };
  }

  /**
   * Ripples of a 1 mm polyline: the turning angle of each 1 mm step, signed
   * by the plane of the line's own bending (the turn's sense against the
   * mean bending normal); runs of one sign summed; a run shorter than the
   * chord whose turn passes {@link TURN}, between runs of the other sign that
   * also pass it, is one ripple. Returns their count and where the first is.
   */
  export function ripples(line: readonly V3[]): { count: number; at: number } {
    const n: number = line.length;
    if (n < 2 * ENDS + 3) return { count: 0, at: 0 };

    // Each interior point's bending vector, and the mean bending direction as the sense.
    const bend: V3[] = [];
    for (let i: number = ENDS + 1; i + ENDS + 1 < n; i++) {
      const a: V3 = line[i - 1]!;
      const p: V3 = line[i]!;
      const b: V3 = line[i + 1]!;
      bend.push([a[0] + b[0] - 2 * p[0], a[1] + b[1] - 2 * p[1], a[2] + b[2] - 2 * p[2]]);
    }
    const mean: V3 = [0, 0, 0];
    for (const v of bend) for (let c: number = 0; c < 3; c++) mean[c]! += v[c]!;
    const length: number = Math.hypot(...mean);
    if (!(length > 0)) return { count: 0, at: 0 };
    const sense: number[] = bend.map((v: V3): number => (v[0] * mean[0] + v[1] * mean[1] + v[2] * mean[2]) / length);

    // Runs of one sign, each with its length and its summed turn (a 1 mm step's bending is its turn in radians).
    const runs: IRun[] = [];
    sense.forEach((v: number, i: number): void => {
      const sign: number = Math.sign(v);
      const top: IRun | undefined = runs[runs.length - 1];
      if (top !== undefined && top.sign === sign) {
        top.length++;
        top.turn += Math.abs(v);
      } else runs.push({ sign, length: 1, turn: Math.abs(v), start: i + ENDS + 1 });
    });
    let count: number = 0;
    let at: number = 0;
    for (let i: number = 1; i + 1 < runs.length; i++) {
      const r: IRun = runs[i]!;
      if (r.length < CHORD && r.turn > TURN && runs[i - 1]!.turn > TURN && runs[i + 1]!.turn > TURN) {
        if (count === 0) at = r.start;
        count++;
      }
    }
    return { count, at };
  }

  /**
   * Cells whose normal faces against the chain's dominant sense. Each cell's
   * normal is the cross product of its station and phase edge differences;
   * its sense is the sign against the direction from the ring's centroid to
   * the cell. A chain whose cells mostly face inward (a hole) takes that as
   * its outward sense, so only the minority counts.
   */
  export function folded(rings: readonly V3[][], stations: readonly number[]): { count: number; at: string } {
    let plus: number = 0;
    let minus: number = 0;
    let firstMinus: string = "none";
    let firstPlus: string = "none";
    for (let i: number = 0; i + 1 < rings.length; i++) {
      const ring: V3[] = rings[i]!;
      const next: V3[] = rings[i + 1]!;
      const centre: V3 = [0, 0, 0];
      for (const p of ring) for (let c: number = 0; c < 3; c++) centre[c]! += p[c]! / ring.length;
      for (let m: number = 0; m < ring.length; m++) {
        const p: V3 = ring[m]!;
        const du: V3 = sub(next[m]!, p);
        const dv: V3 = sub(ring[(m + 1) % ring.length]!, p);
        const n: V3 = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
        const out: V3 = sub(p, centre);
        const s: number = n[0] * out[0] + n[1] * out[1] + n[2] * out[2];
        if (s > 0) {
          plus++;
          if (firstPlus === "none") firstPlus = `${stations[i]!.toFixed(0)} mm, cell ${m}`;
        } else if (s < 0) {
          minus++;
          if (firstMinus === "none") firstMinus = `${stations[i]!.toFixed(0)} mm, cell ${m}`;
        }
      }
    }
    return plus >= minus ? { count: minus, at: firstMinus } : { count: plus, at: firstPlus };
  }

  /** Distance of a point from the line through two points. */
  function distance(p: V3, a: V3, b: V3): number {
    const d: V3 = sub(b, a);
    const q: V3 = sub(p, a);
    const c: V3 = [q[1] * d[2] - q[2] * d[1], q[2] * d[0] - q[0] * d[2], q[0] * d[1] - q[1] * d[0]];
    return Math.hypot(...c) / Math.hypot(...d);
  }

  /** Difference of two points. */
  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
}

/** One run of a meridian's turning in one sense. */
interface IRun {
  /** Sense of the turn against the meridian's mean bending, +1, -1 or 0. */
  sign: number;

  /** Points in the run, 1 mm apart. */
  length: number;

  /** Summed turn over the run, radians. */
  turn: number;

  /** Index of the run's first point along the resampled meridian, mm from its start. */
  start: number;
}
