import type { IAutoMovieLoftRelief } from "../../../packages/engine/src/geometry/construction/IAutoMovieLoftRelief";
import { FamilyConicFit as F } from "./FamilyConicFit";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * Least-squares fit of an engine relief to what lies inside a part's tape
 * wall.
 *
 * The engine moves a wall point at chart station `s` and phase `t` along the
 * relief's fixed axis by a height `d(s, t)`, a tensor-product uniform cubic
 * B-spline over the relief's window with its three outer rings of control
 * points zero (`AutoMovieLoftRelief`). The height that carries a wall point
 * onto the observed skin is the distance from that point to the observed
 * section along the axis, so the control heights solve a linear
 * least-squares problem; a second-difference penalty keeps the net fair
 * where the observations leave it open.
 */
export namespace FamilyConicRelief {
  /** A relief window to fit. */
  export interface IWindow {
    /** Relief name. */
    name: string;

    /** Station range of the window, mm. */
    stations: [number, number];

    /** Phase range of the window, radians, in increasing phase. */
    phases: [number, number];

    /** Unit world direction of the height; it must lie in the section planes. */
    axis: [number, number, number];

    /** Control points across the station range, at least 7. */
    rows: number;

    /** Control points across the phase range, at least 7. */
    columns: number;

    /** The window is centred on the median line and its net is tied symmetric across it. */
    mirror: boolean;
  }

  /** One observed section with the wall beneath it. */
  export interface IRow {
    /** Station, mm. */
    s: number;

    /** Observed skin polygon in the section chart, mm. */
    skin: C.P[];

    /** The wall's chart point at a phase. */
    wall: (phi: number) => C.P;

    /** The relief axis in the section chart. */
    axis: C.P;

    /** Withheld from the fit. */
    heldout: boolean;
  }

  /** A fitted relief and its sampled errors along the axis. */
  export interface IResult {
    /** The relief as the engine reads it. */
    relief: IAutoMovieLoftRelief;

    /** Independent control heights. */
    scalars: number;

    /** Largest height the observations ask for, mm. */
    deepestMm: number;

    /** Largest along-axis miss on fitting sections, mm. */
    trainMaxMm: number;

    /** Largest along-axis miss on withheld sections, mm. */
    heldMaxMm: number;
  }

  /** Phase samples per control span. */
  const PER_SPAN: number = 4;

  /** Weight of the squared second differences of the net against the summed squared misses, per control point. */
  const FAIR: number = 1e-3;

  /** Fit one window. */
  export function fit(window: IWindow, rows: readonly IRow[]): IResult {
    const span: number = window.phases[1] - window.phases[0];
    const R: number = window.rows;
    const Cn: number = window.columns;

    // Unknowns: the inner control points, tied across the median when mirrored.
    const slot: number[] = new Array<number>(R * Cn).fill(-1);
    let unknowns: number = 0;
    for (let r: number = 3; r < R - 3; ++r)
      for (let c: number = 3; c < Cn - 3; ++c) {
        const twin: number = r * Cn + (Cn - 1 - c);
        slot[r * Cn + c] = window.mirror && slot[twin]! >= 0 ? slot[twin]! : unknowns++;
      }

    // Observations: for each section inside the window, the along-axis height at phases across the window.
    const samples: { weights: [number, number][]; target: number; heldout: boolean }[] = [];
    let deepest: number = 0;
    const phases: number = (Cn - 3) * PER_SPAN;
    for (const row of rows) {
      if (row.s <= window.stations[0] || row.s >= window.stations[1]) continue;
      const [iu, wu] = basis(((row.s - window.stations[0]) / (window.stations[1] - window.stations[0])) * (R - 3), R);
      for (let k: number = 1; k < phases; ++k) {
        const offset: number = (span * k) / phases;
        const target: number | null = cast(row.skin, row.wall(window.phases[0] + offset), row.axis);
        if (target === null) continue;
        const [iv, wv] = basis((offset / span) * (Cn - 3), Cn);
        const weights: [number, number][] = [];
        for (let a: number = 0; a < 4; ++a)
          for (let b: number = 0; b < 4; ++b) {
            const at: number = slot[(iu + a) * Cn + iv + b]!;
            if (at >= 0) weights.push([at, wu[a]! * wv[b]!]);
          }
        deepest = Math.max(deepest, Math.abs(target));
        samples.push({ weights, target, heldout: row.heldout });
      }
    }

    // Normal equations with the fairness penalty on second differences along both directions.
    const A: number[][] = Array.from({ length: unknowns }, (): number[] => new Array<number>(unknowns).fill(0));
    const b: number[] = new Array<number>(unknowns).fill(0);
    for (const sample of samples) {
      if (sample.heldout) continue;
      for (const [i, wi] of sample.weights) {
        b[i]! += wi * sample.target;
        for (const [j, wj] of sample.weights) A[i]![j]! += wi * wj;
      }
    }
    const fair: number = FAIR * Math.max(1, samples.length / Math.max(1, unknowns));
    const penalise = (cells: number[]): void => {
      const terms: [number, number][] = [];
      [1, -2, 1].forEach((w: number, k: number): void => {
        if (slot[cells[k]!]! >= 0) terms.push([slot[cells[k]!]!, w]);
      });
      for (const [i, wi] of terms) for (const [j, wj] of terms) A[i]![j]! += fair * wi * wj;
    };
    for (let r: number = 0; r < R; ++r)
      for (let c: number = 0; c < Cn; ++c) {
        if (r + 2 < R) penalise([r * Cn + c, (r + 1) * Cn + c, (r + 2) * Cn + c]);
        if (c + 2 < Cn) penalise([r * Cn + c, r * Cn + c + 1, r * Cn + c + 2]);
      }
    for (let i: number = 0; i < unknowns; ++i) A[i]![i]! += 1e-9;
    const solved: number[] | null = F.solve(A, b);
    if (solved === null) throw new Error("relief " + window.name + ": the net is not determined by its observations");
    const heights: number[] = slot.map((at: number): number => (at >= 0 ? Math.round(solved[at]! * 100) / 100 : 0));
    let trainMaxMm: number = 0;
    let heldMaxMm: number = 0;
    for (const sample of samples) {
      const miss: number = Math.abs(sample.weights.reduce((sum: number, [i, w]: [number, number]): number => sum + w * Math.round(solved[i]! * 100) / 100, 0) - sample.target);
      if (sample.heldout) heldMaxMm = Math.max(heldMaxMm, miss);
      else trainMaxMm = Math.max(trainMaxMm, miss);
    }
    return { relief: { name: window.name, stations: window.stations, phases: window.phases, axis: window.axis, rows: R, columns: Cn, heights }, scalars: unknowns, deepestMm: deepest, trainMaxMm, heldMaxMm };
  }

  /** Signed distance from a chart point along a unit direction to the nearest crossing of a polygon; null when the line misses it. */
  export function cast(polygon: readonly C.P[], from: C.P, direction: C.P): number | null {
    let best: number | null = null;
    for (let i: number = 0; i < polygon.length; ++i) {
      const a: C.P = polygon[i]!;
      const e: C.P = polygon[(i + 1) % polygon.length]!;
      const edge: C.P = [e[0] - a[0], e[1] - a[1]];
      const den: number = direction[0] * edge[1] - direction[1] * edge[0];
      if (den === 0) continue;
      const delta: C.P = [a[0] - from[0], a[1] - from[1]];
      const along: number = (delta[0] * direction[1] - delta[1] * direction[0]) / den;
      if (along < 0 || along > 1) continue;
      const t: number = (delta[0] * edge[1] - delta[1] * edge[0]) / den;
      if (best === null || Math.abs(t) < Math.abs(best)) best = t;
    }
    return best;
  }

  /** The engine's uniform cubic B-spline span and weights at a parameter (`AutoMovieLoftRelief`'s private `basis`). */
  function basis(x: number, count: number): [number, number[]] {
    const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
    const f: number = x - i;
    return [i, [(1 - f) ** 3 / 6, (3 * f ** 3 - 6 * f ** 2 + 4) / 6, (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6, f ** 3 / 6]];
  }
}
