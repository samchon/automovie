import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieLoftRelief, type AutoMovieViewAxis, AutoMovieViewChain, type AutoMovieViewLoft, type IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicRelief, AutoMovieHumanConicSection as S, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { FamilyConicProject as P } from "./FamilyConicProject";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The lower trunk's wall solved against f1 as it is stored (issue #3197, phase 2.5 part two): one measurement of how far the wall alone,
 * under layouts with more named inflection lines, carries the skin that the stored wall and its nets draw together. Nothing is emitted
 * and no module is read but the stored trunk; the reference is not read at all.
 *
 * - `target`: the stored trunk (wall and every net, `AutoMovieHumanConicLoft.create` with its reliefs) cut by the fit's own section
 *   planes from the trunk's first station to `TO`, and how it was sampled.
 * - `fit --layout=<L0|L1|L2|L3>`: the wall alone fitted to that target by `FamilyConicFit.fit` on the stored wall's knots under one
 *   layout, its admission checked as the fit and the construction check it, lofted again and measured back, and the residual projected
 *   onto relief nets on the stored nets' windows at their grids and at the coarsest grid within `BOUND_MM`.
 * - `table`: every layout's row read back from the run's files.
 * - `frames --layouts=<a,b>`: clay frames of the named fitted walls alone beside the stored trunk with its nets, over the same stretch.
 *
 * Every command takes `--out=<directory>`, the run's folder. Usage, from `test/`: `pnpm conic:build`, then
 * `node .shots/esbuild/FamilyConicLowerTrunk.cjs <command> --out=<directory> [--barrier --seeds]`; `--barrier` and `--seeds` are read by
 * `FamilyConicFit` itself.
 */
namespace FamilyConicLowerTrunk {
  type P2 = S.P;
  type V3 = [number, number, number];
  type Family = H.IFamily;
  type Chain = NonNullable<AutoMovieViewLoft.IResult["chain"]>;

  /** The stretch's first station, mm: the trunk's first knot, where its wall begins (`AutoMovieHumanF1Trunk.knots[0]`). */
  const FROM: number = 28;

  /** The stretch's last station, mm: the brief's bound, below the chest's nets (from 380) and the armpit's held stations (from about 400). */
  const TO: number = 380;

  /** Spacing of the fitting sections, mm, the withheld ones midway: the fit tool's own (`FamilyConicBody`, `STEP_MM`). */
  const FIT_STEP_MM: number = 4;

  /**
   * Spacing of the sections the residual is measured and projected on, mm: a quarter of the finest stored net's row spacing in the
   * stretch (`trunk.navel`, 32 mm over 16 spans, 2 mm), so every net's rows are sampled at least four times a span.
   */
  const DENSE_MM: number = 0.5;

  /**
   * Phases a section is sampled at, uniform in the stored chain's own phase: 2 pi / 1024 = 0.0061 rad, under a quarter of the finest net
   * column in the stretch (`trunk.navel`, 0.6 rad over 20 spans, 0.03 rad), the quarter lofting.md asks of any sampling across an edge.
   */
  const PHASES: number = 1024;

  /** Spacing of the relieved rings a section is cut from, mm: a cubic through four rings 1 mm apart reads a C2 surface to well under 0.01 mm. */
  const GRID_MM: number = 1;

  /** How far along the course a relieved point is sought from its own station's plane, mm: a net's height leaves the plane only by its axis's tilt. */
  const REACH_MM: number = 12;

  /** Phases a lofted wall's ring is read at to take its radius along a ray: 0.5 mm apart round a girth of 1 m, a chord sagitta under 0.001 mm. */
  const RING: number = 2048;

  /**
   * Residual power of the fit: 2, plain least squares (RMS). The phase's aim is the general form and flowing curves, and the supervisor's
   * ruling of 2026-11-15 after the first run: a power-4 fit (the fit tool's `attempt` default) chases the largest misses, the fine-detail
   * precision the owner set below universality, and in that run the 60 to 80 mm bridge at the bottom drew level bands up the wall.
   */
  const POWER: number = 2;

  /**
   * The first station fitted, mm: `--from`, the trunk's first knot when absent. Above the trunk's first knot the wall below it is held as
   * stored and the fitted window is joined to it by the fit tool's held window splice (`splice`).
   */
  let START: number = FROM;

  /** The last held station of the wall above the stretch the admission and the native check read, mm: the stored knot past `TO`. */
  const ABOVE: number = 418;

  /** The bound a coarser residual net must keep from the net at its stored grid, mm: the ruling stage B2 used for every net but the face's. */
  const BOUND_MM: number = 0.25;

  /** The shares of its rows and columns a residual net is tried at, as stage B2 tried them (`FamilyConicCoarse`). */
  const SHARES: number[] = [3 / 4, 2 / 3, 1 / 2, 1 / 3];

  /** Samples per control spacing a coarser net is fitted on, and the difference read at: stage B2's (`FamilyConicCoarse`, `FIT`, `CHECK`). */
  const FIT_PER_SPAN: number = 4;
  const CHECK_PER_SPAN: number = 5;

  /** Phase samples per column a residual net is fitted on at its stored grid: as many as the coarser projection's. */
  const NET_PER_COLUMN: number = 4;

  /** Decimal places of a stored height (`FamilyConicCoarse`, `DECIMALS.height`). */
  const DECIMALS: number = 2;

  /** Frame size in pixels: the figure tool's close frames (`FamilyConicFigure`). */
  const FRAME_PX: number = 900;

  /** Display grid of a rendered wall: a ring every millimetre of station at this many phases, finer than any net's spacing in the stretch. */
  const DISPLAY_PHASES: number = 720;

  // ------------------------------------------------------------------------------------------------------------------------------
  // Layouts
  // ------------------------------------------------------------------------------------------------------------------------------

  /**
   * The front median line after the front extreme (anchor 0 of `bilateral(1)`): an inflection and the crest beside the groove, so the
   * front extreme on the median line is the groove's floor where it has one: the linea alba and the navel's groove. Windows are shares of
   * the run's arclength where a section's seed seeks each feature, the fit tool's trunk entry's (`FamilyConicBody`, `TRUNK_RUNS`).
   */
  const FRONT_MEDIAN: S.IAnchor[] = [
    { kind: "f", feature: "inflection", window: [0.02, 0.25] },
    { kind: "f", feature: "convex", window: [0.05, 0.4] },
  ];

  /** The off-axis groove after the front median's crest: an inflection, its floor and an inflection: the inguinal fold and the abdomen's side. */
  const OFF_AXIS: S.IAnchor[] = [
    { kind: "f", feature: "inflection", window: [0.2, 0.6] },
    { kind: "f", feature: "concave", window: [0.3, 0.8] },
    { kind: "f", feature: "inflection", window: [0.45, 0.95] },
  ];

  /** The back median line before the back extreme (anchor 4): a crest and an inflection, the back extreme the floor: the spinal furrow and the natal cleft. */
  const BACK_MEDIAN: S.IAnchor[] = [
    { kind: "f", feature: "convex", window: [0.3, 0.9] },
    { kind: "f", feature: "inflection", window: [0.6, 0.97] },
  ];

  /** One layout of the experiment, built from the stored wall's `bilateral(1)`. */
  interface ISpec {
    /** Its name in the table. */
    name: string;

    /** What it adds, anatomically. */
    title: string;

    /** The feature runs inserted into `bilateral(1)`. */
    runs: S.IFeatureRun[];

    /** The medians of `bilateral(1)` turned into feature anchors: each one next to a run, so the stored wall converts exactly (`S.featured`). */
    freed: number[];
  }

  const SPECS: ISpec[] = [
    { name: "L0", title: "the stored layout, bilateral(1)", runs: [], freed: [] },
    { name: "L1", title: "L0 + front median line (linea alba, navel groove)", runs: [{ after: 0, anchors: FRONT_MEDIAN }], freed: [1] },
    { name: "L2", title: "L1 + back median line (spinal furrow, natal cleft)", runs: [{ after: 0, anchors: FRONT_MEDIAN }, { after: 3, anchors: BACK_MEDIAN }], freed: [1, 3] },
    { name: "L3", title: "L2 + mirrored off-axis line (inguinal fold, side of the abdomen)", runs: [{ after: 0, anchors: [...FRONT_MEDIAN, ...OFF_AXIS] }, { after: 3, anchors: BACK_MEDIAN }], freed: [1, 3] },
  ];

  /**
   * A spec's layout: `featured(bilateral(1), runs, freed)`, every freed median given the seed window the fit tool's trunk entry gives it
   * (`FamilyConicBody`, `TRUNK_LINED`: before the side extreme 0.6 to 0.95 of its run, after it 0.05 to 0.5).
   */
  function layoutOf(spec: ISpec): S.ILayout {
    const base: S.ILayout = S.bilateral(1);
    if (spec.runs.length === 0) return base;
    const made: S.ILayout = S.featured(base, spec.runs, spec.freed);
    const side: number = made.anchors.findIndex((a: S.IAnchor): boolean => a.kind === "v");
    return { ...made, anchors: made.anchors.map((a: S.IAnchor, k: number): S.IAnchor => (a.kind === "f" && a.window === undefined ? { ...a, window: k < side ? [0.6, 0.95] : [0.05, 0.5] } : a)) };
  }

  /** The stored trunk. */
  function stored(): Family {
    return AutoMovieHumanF1.BODY.trunk;
  }

  /** The fit's knots: the stored wall's knots inside the stretch, and its last station as the end knot (the brief: the stored knots kept). */
  function knots(): number[] {
    return [...(START === FROM ? [] : [START]), ...stored().knots.filter((k: number): boolean => k >= START && k < TO && k !== START), TO];
  }

  /**
   * The start of a layout's fit: the stored wall read at the fit's knots (`F.resample`), and for a featured layout every knot's section
   * converted exactly onto it (`S.convert`, de Casteljau's split of each stored arc where a feature is inserted), so the fit starts on the
   * stored wall itself.
   */
  function start(spec: ISpec): number[][] {
    return converted(spec, knots(), START === FROM ? "raw" : "read");
  }

  /**
   * The stored wall read at `at` (`F.resample`) and, for a featured layout, every knot's section converted onto it (`S.convert`). With
   * `read`, every shoulder is taken as the model reads it (`S.shoulder`, inside its edge and its fairness bound), so a fit started there
   * does not sit on a bound the stored number lies past: the first run's L0 stored the front arcs' shoulders at 0.86 to 0.997 and 0.013
   * to 0.086 at stations 28 and 40, which the model clamps to 0.85 and 0.03.
   */
  function converted(spec: ISpec, at: readonly number[], form: "raw" | "read"): number[][] {
    const wall: Family = stored();
    const layout: S.ILayout = layoutOf(spec);
    const resampled: number[][] = F.resample(wall.values, wall.knots, at);
    const values: number[][] =
      spec.runs.length === 0
        ? resampled
        : ((): number[][] => {
            const columns: number[][] = at.map((_: number, m: number): number[] => S.convert(resampled.map((field: number[]): number => field[m]!), S.bilateral(1), spec.runs, spec.freed));
            return columns[0]!.map((_: number, f: number): number[] => columns.map((column: number[]): number => column[f]!));
          })();
    if (form === "raw") return values;
    const first: number = S.offsets(layout).shoulders;
    return values.map((field: number[], f: number): number[] => (f < first ? field : field.map((x: number): number => S.shoulder(x, layout, f - first))));
  }

  /**
   * The natural cubic's second derivatives (moments) at its knots through `y`: the tridiagonal system of the fit tool's held window splice
   * (`FamilyConicBody`, `--splice=<directory>@<from>..<to>`), copied so the join is that splice's and no other.
   */
  function moments(x: readonly number[], y: readonly number[]): number[] {
    const n: number = x.length;
    const a: number[] = new Array<number>(n).fill(0), b: number[] = new Array<number>(n).fill(1), cc: number[] = new Array<number>(n).fill(0), r: number[] = new Array<number>(n).fill(0);
    for (let i: number = 1; i + 1 < n; ++i) {
      const h0: number = x[i]! - x[i - 1]!, h1: number = x[i + 1]! - x[i]!;
      a[i] = h0;
      b[i] = 2 * (h0 + h1);
      cc[i] = h1;
      r[i] = 6 * ((y[i + 1]! - y[i]!) / h1 - (y[i]! - y[i - 1]!) / h0);
    }
    for (let i: number = 1; i < n; ++i) {
      const w: number = a[i]! / b[i - 1]!;
      b[i]! -= w * cc[i - 1]!;
      r[i]! -= w * r[i - 1]!;
    }
    const m: number[] = new Array<number>(n).fill(0);
    m[n - 1] = r[n - 1]! / b[n - 1]!;
    for (let i: number = n - 2; i >= 0; --i) m[i] = (r[i]! - cc[i]! * m[i + 1]!) / b[i]!;
    return m;
  }

  /**
   * A window fitted on `[START, TO]` joined to the held wall as the fit tool's held window splice joins it (`FamilyConicBody`,
   * `--splice=<directory>@<from>..<to>`): the held wall's knots with `START` and `TO` inserted at their own values (the interpolating
   * natural cubic is unique, so the held wall is unchanged), its values kept at and outside the window's end knots, the fitted values at
   * the knots inside it, and the inside values then given the least change in their sum of squares that sets the held wall's moments at
   * both end knots, so the window meets the held wall with equal value, slope and bend and every interval outside it is the held wall's.
   *
   * @returns The joined wall, and the largest miss of a moment at an end knot after the join.
   */
  function splice(spec: ISpec, window: { knots: readonly number[]; values: readonly (readonly number[])[] }): { knots: number[]; values: number[][]; momentMiss: number } {
    const all: number[] = [...new Set([...stored().knots, START, TO])].sort((x: number, y: number): number => x - y);
    const held: number[][] = converted(spec, all, "raw");
    const ends: [number, number] = [all.indexOf(START), all.indexOf(TO)];
    const free: number[] = all.map((k: number, i: number): number => (k > START + 1e-9 && k < TO - 1e-9 ? i : -1)).filter((i: number): boolean => i >= 0);
    let worst: number = 0;
    const values: number[][] = held.map((field: number[], f: number): number[] => {
      const joined: number[] = field.map((y: number, i: number): number => {
        if (!free.includes(i)) return y;
        const m: number = window.knots.findIndex((k: number): boolean => Math.abs(k - all[i]!) < 1e-9);
        if (m < 0) throw new Error("splice: the window has no knot at " + all[i]);
        return window.values[f]![m]!;
      });
      const target: number[] = moments(all, field);
      const want: [number, number] = [target[ends[0]]!, target[ends[1]]!];
      const at = (y: number[]): [number, number] => {
        const m: number[] = moments(all, y);
        return [m[ends[0]]!, m[ends[1]]!];
      };
      const base: [number, number] = at(joined);
      const columns: [number, number][] = free.map((k: number): [number, number] => {
        const y: number[] = [...joined];
        y[k]! += 1;
        const g: [number, number] = at(y);
        return [g[0] - base[0], g[1] - base[1]];
      });
      const [p, q, rr] = [columns.reduce((s: number, g) => s + g[0] * g[0], 0), columns.reduce((s: number, g) => s + g[0] * g[1], 0), columns.reduce((s: number, g) => s + g[1] * g[1], 0)];
      const det: number = p * rr - q * q;
      const need: [number, number] = [want[0] - base[0], want[1] - base[1]];
      const lambda: [number, number] = [(rr * need[0] - q * need[1]) / det, (p * need[1] - q * need[0]) / det];
      const out: number[] = [...joined];
      free.forEach((k: number, j: number): void => {
        out[k]! += columns[j]![0] * lambda[0] + columns[j]![1] * lambda[1];
      });
      const check: [number, number] = at(out);
      worst = Math.max(worst, Math.abs(check[0] - want[0]), Math.abs(check[1] - want[1]));
      return out;
    });
    return { knots: all, values, momentMiss: worst };
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Geometry helpers
  // ------------------------------------------------------------------------------------------------------------------------------

  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const round2 = (x: number): number => Math.round(x * 100) / 100;
  const round3 = (x: number): number => Math.round(x * 1000) / 1000;
  const degrees = (phi: number): number => Math.round((((phi * 180) / Math.PI) % 360 + 360) % 360);

  /** A closed polygon's radius along the ray at polar angle `phi` from the chart's origin: the nearest crossing outward, NaN if none. */
  function polar(points: readonly P2[]): (phi: number) => number {
    const n: number = points.length;
    const angles: number[] = points.map((p: P2): number => Math.atan2(p[1], p[0]));
    // A star-shaped polygon's angles advance once round; its segments are then searched by angle, and the rest by a scan.
    const order: number[] = angles.map((_: number, k: number): number => k).sort((a: number, b: number): number => angles[a]! - angles[b]!);
    const sorted: number[] = order.map((k: number): number => angles[k]!);
    const cross = (k: number, d: P2): number => {
      const a: P2 = points[k]!;
      const b: P2 = points[(k + 1) % n]!;
      const e: P2 = [b[0] - a[0], b[1] - a[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) return NaN;
      const r: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
      return w >= -1e-9 && w <= 1 + 1e-9 && r > 0 ? r : NaN;
    };
    return (phi: number): number => {
      const d: P2 = [Math.cos(phi), Math.sin(phi)];
      const x: number = Math.atan2(d[1], d[0]);
      let lo: number = 0;
      let hi: number = n;
      while (lo < hi) {
        const mid: number = (lo + hi) >> 1;
        if (sorted[mid]! < x) lo = mid + 1;
        else hi = mid;
      }
      let best: number = NaN;
      for (const j of [lo - 2, lo - 1, lo, lo + 1]) {
        const k: number = order[((j % n) + n) % n]!;
        for (const at of [k, (k + n - 1) % n]) {
          const r: number = cross(at, d);
          if (Number.isFinite(r) && !(r >= best)) best = r;
        }
      }
      if (Number.isFinite(best)) return best;
      for (let k: number = 0; k < n; ++k) {
        const r: number = cross(k, d);
        if (Number.isFinite(r) && !(r >= best)) best = r;
      }
      return best;
    };
  }

  /** How many vertices of a polygon do not advance in polar angle about the origin: zero for a section star-shaped about its course. */
  function folds(points: readonly P2[]): number {
    let count: number = 0;
    for (let k: number = 0; k < points.length; ++k) {
      const a: P2 = points[k]!;
      const b: P2 = points[(k + 1) % points.length]!;
      if (a[0] * b[1] - a[1] * b[0] <= 0) ++count;
    }
    return count;
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Target
  // ------------------------------------------------------------------------------------------------------------------------------

  /** The stored trunk cut by the section planes: its relieved skin in each station's own chart. */
  interface ITarget {
    /** The stored chain, wall and nets. */
    chain: Chain;

    /** The trunk's course. */
    axis: AutoMovieViewAxis.IAxis;

    /** The course's unit direction: the trunk's course is one straight segment, so every section plane is normal to it. */
    along: V3;

    /** The section at a station: `PHASES` points in its chart in the stored chain's phase order, the phases whose crossing was not found, and folds. */
    at: (s: number) => { points: P2[]; dropped: number; folds: number };
  }

  /**
   * The relieved skin at a station's plane. A net moves its wall point along its own axis, which leaves the plane by the axis's tilt, so
   * for each phase the relieved point is followed along the stations (rings `GRID_MM` apart through the engine's own evaluator,
   * `AutoMovieLoftChain.sampler`, nets included) and its crossing of the plane is read on the cubic through the four rings round it.
   */
  function target(): ITarget {
    const family: Family = stored();
    const grid: number[] = [];
    for (let s: number = FROM; s <= TO + REACH_MM + 1e-9; s += GRID_MM) grid.push(s);
    const loft: AutoMovieViewLoft.IResult = H.create(family, grid);
    if (loft.chain === null) throw new Error("the stored trunk did not loft: " + JSON.stringify(loft.diagnostics).slice(0, 400));
    const chain: Chain = loft.chain;
    const axis: AutoMovieViewAxis.IAxis = H.axis(family);
    const o0: number[] = axis.at(FROM).origin as number[];
    const o1: number[] = axis.at(TO).origin as number[];
    const length: number = Math.hypot(o1[0]! - o0[0]!, o1[1]! - o0[1]!, o1[2]! - o0[2]!);
    const along: V3 = [(o1[0]! - o0[0]!) / length, (o1[1]! - o0[1]!) / length, (o1[2]! - o0[2]!) / length];
    if (family.halves.length !== 0 || Math.abs(dot(axis.at(FROM).u, along)) > 1e-6) throw new Error("the trunk's course is not one straight segment normal to its sections");
    const rings: number[][][] = grid.map((s: number): number[][] => {
      const read: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, s);
      return Array.from({ length: PHASES }, (_: unknown, j: number): number[] => read((2 * Math.PI * j) / PHASES));
    });
    const cache: Map<number, { points: P2[]; dropped: number; folds: number }> = new Map();
    const at = (s: number): { points: P2[]; dropped: number; folds: number } => {
      const key: number = Math.round(s * 1000);
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
      const origin: number[] = frame.origin as number[];
      const height = (p: readonly number[]): number => (p[0]! - origin[0]!) * along[0] + (p[1]! - origin[1]!) * along[1] + (p[2]! - origin[2]!) * along[2];
      const points: P2[] = [];
      let dropped: number = 0;
      const k0: number = Math.round((s - FROM) / GRID_MM);
      const reach: number = Math.round(REACH_MM / GRID_MM);
      for (let j: number = 0; j < PHASES; ++j) {
        // The bracket nearest the station's own ring where the relieved point passes the plane upward.
        let found: number = -1;
        for (let step: number = 0; step <= reach && found < 0; ++step)
          for (const k of step === 0 ? [k0] : [k0 - step, k0 + step]) {
            if (k < 0 || k + 1 >= grid.length) continue;
            if (height(rings[k]![j]!) <= 0 && height(rings[k + 1]![j]!) > 0) {
              found = k;
              break;
            }
            if (k === k0 && height(rings[k]![j]!) > 0 && k - 1 >= 0 && height(rings[k - 1]![j]!) <= 0) {
              found = k - 1;
              break;
            }
          }
        if (found < 0) {
          ++dropped;
          continue;
        }
        // Lagrange's cubic through rings found - 1 .. found + 2 (straight where one of them is missing), solved for the plane by bisection.
        const nodes: number[] = [found - 1, found, found + 1, found + 2];
        const cubic: boolean = nodes[0]! >= 0 && nodes[3]! < grid.length;
        const weights = (x: number): number[] => (cubic ? [(-x * (x - 1) * (x - 2)) / 6, ((x + 1) * (x - 1) * (x - 2)) / 2, (-(x + 1) * x * (x - 2)) / 2, ((x + 1) * x * (x - 1)) / 6] : [0, 1 - x, x, 0]);
        const point = (x: number): number[] => {
          const w: number[] = weights(x);
          const out: number[] = [0, 0, 0];
          nodes.forEach((k: number, i: number): void => {
            if (w[i] === 0) return;
            const p: number[] = rings[k]![j]!;
            for (let c: number = 0; c < 3; ++c) out[c]! += w[i]! * p[c]!;
          });
          return out;
        };
        let lo: number = 0;
        let hi: number = 1;
        for (let i: number = 0; i < 48; ++i) {
          const mid: number = (lo + hi) / 2;
          if (height(point(mid)) <= 0) lo = mid;
          else hi = mid;
        }
        const p: number[] = point((lo + hi) / 2);
        const d: number[] = [p[0]! - origin[0]!, p[1]! - origin[1]!, p[2]! - origin[2]!];
        points.push([dot(d, frame.u), dot(d, frame.v)]);
      }
      const made = { points, dropped, folds: folds(points) };
      cache.set(key, made);
      return made;
    };
    return { chain, axis, along, at };
  }

  /** Stations from `from` (the fitted stretch's first, `START`, when absent) to `TO` at a spacing. */
  function stations(step: number, from: number = START): number[] {
    const out: number[] = [];
    for (let i: number = 0; from + i * step <= TO + 1e-9; ++i) out.push(from + i * step);
    return out;
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Admission
  // ------------------------------------------------------------------------------------------------------------------------------

  /** A wall's admission as the fit admits a candidate (`FamilyConicFit.fit`, `admissible`): every 0.25 mm, raw and as stored, under the margin. */
  interface IAdmission {
    /** Station readings refused, of all read (raw and stored at every station). */
    refused: number;
    read: number;

    /** The first refused reading: station, form and the premise that failed. */
    first: string | null;

    /** The least tangent meeting over every reading, with where it stands. */
    least: number;
    leastAt: string;
  }

  /** Values as a module stores them: millimetres to 0.01, shares and angles to 1e-4 (`FamilyConicFit`, `stored`). */
  function rounded(values: readonly (readonly number[])[], layout: S.ILayout): number[][] {
    const units: S.Unit[] = S.units(layout);
    return values.map((field: readonly number[], f: number): number[] => field.map((y: number): number => (units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4)));
  }

  function admission(at: readonly number[], values: readonly (readonly number[])[], layout: S.ILayout, margin: number, range: [number, number] = [at[0]!, at.at(-1)!]): IAdmission {
    const basis: (s: number) => number[] = F.basisOf(at);
    const units: S.Unit[] = S.units(layout);
    const shares: number[] = units.map((u: S.Unit, f: number): number => (u === "share" ? f : -1)).filter((f: number): boolean => f >= 0);
    const store: number[][] = rounded(values, layout);
    const out: IAdmission = { refused: 0, read: 0, first: null, least: Infinity, leastAt: "" };
    for (let s: number = range[0]; s <= range[1] + 1e-9; s += 0.25) {
      const b: number[] = basis(Math.min(s, at.at(-1)!));
      for (const [form, set] of [["raw", values], ["stored", store]] as const) {
        const t: number[] = set.map((field: readonly number[]): number => field.reduce((sum: number, y: number, m: number): number => sum + y * b[m]!, 0));
        ++out.read;
        const fault: string | null = S.chain(t, layout).fault;
        const meets: { arc: number; a: number; b: number }[] = F.meetingSides(t, layout);
        const worst = meets.reduce((x, y) => (Math.min(y.a, y.b) < Math.min(x.a, x.b) ? y : x));
        const least: number = Math.min(worst.a, worst.b);
        if (least < out.least) [out.least, out.leastAt] = [least, `${s.toFixed(2)} ${form} arc ${worst.arc} ${worst.a <= worst.b ? "a" : "b"}`];
        const outside: number[] = shares.filter((f: number): boolean => !(t[f]! > 0 && t[f]! < 1));
        if (fault === null && least >= margin && outside.length === 0) continue;
        ++out.refused;
        out.first ??= `${s.toFixed(2)} ${form}: ${fault !== null ? "chain refused (" + fault.slice(0, 100) + ")" : outside.length > 0 ? "shares outside (0, 1): fields " + outside.join(",") : `least tangent meeting ${least.toFixed(4)} under the margin ${margin} at arc ${worst.arc}`}`;
      }
    }
    return out;
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Residual nets
  // ------------------------------------------------------------------------------------------------------------------------------

  /** A residual net fitted to its samples by `FamilyConicProject.fitSamples`, the projection stage B2's coarser grids come from, its heights stored to `DECIMALS` places. */
  function fitNet(window: Omit<IAutoMovieLoftRelief, "heights" | "rows" | "columns">, rows: number, columns: number, symmetric: boolean, at: { stations: number[]; phases: number[]; heights: number[][] }): IAutoMovieLoftRelief | null {
    return P.fitSamples(window, rows, columns, symmetric, DECIMALS, at);
  }

  /** One window of the stored nets the residual is projected onto, clipped to the stretch, with the stored grid's spacing kept. */
  interface IWindow {
    /** The stored net it follows. */
    net: string;

    /** Whether the net is its own mirror image (stored as its half) or has a twin (stored once for both). */
    mirror: "self" | "twin" | "none";
  }

  /** The stored nets inside the stretch: `trunk.low` round the whole trunk, `trunk.crotch` and its twin, `trunk.navel`; the chest's begin at `TO`. */
  const WINDOWS: IWindow[] = [
    { net: "trunk.low", mirror: "self" },
    { net: "trunk.crotch", mirror: "twin" },
    { net: "trunk.navel", mirror: "self" },
  ];

  /** Heights a net's module would store: half the columns of a self-mirrored net, all of them otherwise (a twin stores none). */
  function storedCount(rows: number, columns: number, mirror: IWindow["mirror"]): number {
    return mirror === "self" ? rows * ((columns + 1) / 2) : rows * columns;
  }

  /**
   * What the stored trunk spends on the fitted stretch: its wall's numbers at the knots inside it (each knot one value per field), and
   * its nets' free controls whose rows stand in it, a row at its Greville station (parameter `i - 1` of `[0, R - 3]`), counted as the
   * module stores them (`AutoMovieHumanConicRelief.stored`: half the columns of a self-mirrored net, none for a twin). The fitted window's
   * own count to set beside it: its knots inside the stretch times its fields, since the join keeps the held wall's values at both ends.
   *
   * @param at The fitted window's knots.
   */
  function storedSpend(at: readonly number[]): { wallKnotsInside: number; wallNumbers: number; netControls: number; byNet: Record<string, number>; windowInsideKnots: number } {
    const wall: Family = stored();
    const inside: number = wall.knots.filter((k: number): boolean => k > START + 1e-9 && k < TO - 1e-9).length;
    const byNet: Record<string, number> = {};
    for (const relief of wall.reliefs ?? []) {
      const kept: number = AutoMovieHumanConicRelief.stored(relief);
      if (kept === 0) continue;
      const perRow: number = kept / relief.rows;
      let count: number = 0;
      for (let i: number = 3; i <= relief.rows - 4; ++i) {
        const s: number = relief.stations[0] + ((i - 1) / (relief.rows - 3)) * (relief.stations[1] - relief.stations[0]);
        if (s >= START && s < TO) count += perRow;
      }
      if (count > 0) byNet[relief.name] = count;
    }
    return { wallKnotsInside: inside, wallNumbers: inside * wall.values.length, netControls: Object.values(byNet).reduce((a: number, b: number): number => a + b, 0), byNet, windowInsideKnots: at.filter((k: number): boolean => k > START + 1e-9 && k < TO - 1e-9).length };
  }

  // ------------------------------------------------------------------------------------------------------------------------------
  // Commands
  // ------------------------------------------------------------------------------------------------------------------------------

  const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3);

  /** The world height of a station's course point, mm. */
  const heightOf = (axis: AutoMovieViewAxis.IAxis, s: number): number => (axis.at(s).origin as number[])[1]!;

  /** Max, 99th percentile and root mean square of absolute values. */
  function stats(values: readonly number[]): { max: number; p99: number; rms: number; n: number } {
    const a: number[] = values.map(Math.abs).sort((x: number, y: number): number => x - y);
    return { max: round3(a.at(-1) ?? 0), p99: round3(a[Math.min(a.length - 1, Math.floor(0.99 * a.length))] ?? 0), rms: round3(Math.sqrt(a.reduce((s: number, x: number): number => s + x * x, 0) / Math.max(1, a.length))), n: a.length };
  }

  /** `target`: the target's sampling, its folds, its dropped phases, and what the nets add to the wall by station band. */
  async function commandTarget(out: string): Promise<void> {
    const started: number = performance.now();
    const t: ITarget = target();
    const wall: Family = { ...stored(), reliefs: [] };
    const bare: Chain = H.create(wall, stations(GRID_MM)).chain!;
    const bands: { from: number; to: number; heightMm: [number, number]; depth: ReturnType<typeof stats>; folds: number; dropped: number }[] = [];
    for (let b: number = FROM; b < TO; b += 40) {
      const depth: number[] = [];
      let fold: number = 0;
      let drop: number = 0;
      for (const s of stations(DENSE_MM).filter((x: number): boolean => x >= b && x < Math.min(TO + 1e-9, b + 40))) {
        const section = t.at(s);
        fold += section.folds;
        drop += section.dropped;
        const read: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(bare, s);
        const frame: AutoMovieLoftFrame.IFrame = t.axis.at(s);
        const ring: P2[] = Array.from({ length: RING }, (_: unknown, j: number): P2 => {
          const p: number[] = read((2 * Math.PI * j) / RING);
          const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
          return [dot(d, frame.u), dot(d, frame.v)];
        });
        const radius: (phi: number) => number = polar(ring);
        for (const p of section.points) depth.push(Math.hypot(p[0], p[1]) - radius(Math.atan2(p[1], p[0])));
      }
      bands.push({ from: b, to: Math.min(TO, b + 40), heightMm: [round2(heightOf(t.axis, b)), round2(heightOf(t.axis, Math.min(TO, b + 40)))], depth: stats(depth), folds: fold, dropped: drop });
    }
    const receipt = {
      stretch: { from: FROM, to: TO, heightMm: [round2(heightOf(t.axis, FROM)), round2(heightOf(t.axis, TO))] },
      sampling: { phases: PHASES, phaseStepRad: (2 * Math.PI) / PHASES, gridMm: GRID_MM, reachMm: REACH_MM, fitStepMm: FIT_STEP_MM, denseMm: DENSE_MM, nets: (stored().reliefs ?? []).filter((r: IAutoMovieLoftRelief): boolean => r.stations[0] < TO && r.stations[1] > FROM).map((r: IAutoMovieLoftRelief) => ({ name: r.name, stations: r.stations, phases: r.phases.map(round3), rows: r.rows, columns: r.columns, rowMm: round3((r.stations[1] - r.stations[0]) / (r.rows - 3)), columnRad: round3(AutoMovieLoftRelief.width(r) / (r.columns - 3)) })) },
      netsOverWallByBand: bands,
      ms: Math.round(performance.now() - started),
    };
    await fs.writeFile(path.join(out, "target.json"), JSON.stringify(receipt, null, 2));
    process.stdout.write(JSON.stringify(receipt) + "\n");
  }

  /** One layout's measured row, as written to `<name>.json`. */
  interface IRow {
    name: string;
    title: string;
    layout: S.ILayout;
    fields: number;
    knots: number[];
    wallNumbers: number;
    values: number[][];
    margin: number;
    startAdmission: IAdmission;
    fit: { fault: string | null; iterations: number; ms: number; training: F.IError; heldout: F.IError; chordMaximumMm: number; folds: number };
    resultAdmission: IAdmission;
    native: string[];
    admitted: boolean;
    residual: { all: ReturnType<typeof stats>; interior: ReturnType<typeof stats>; worst: { s: number; heightMm: number; phaseDeg: number; mm: number }; byBand: { from: number; to: number; heightMm: number; max: number; rms: number; worstDeg: number }[]; byPhase: { fromDeg: number; toDeg: number; max: number; rms: number }[] };
    nets: { net: string; window: { stations: [number, number]; phases: [number, number] }; storedGrid: [number, number]; storedHeights: number; coarse: [number, number]; coarseHeights: number; coarseFromStoredMax: number; carried: ReturnType<typeof stats> }[];
    leftover: { all: ReturnType<typeof stats>; interior: ReturnType<typeof stats> };
    /** The fitted window's own knots; `knots` and `values` are the wall joined to the held wall (`splice`). */
    windowKnots?: number[];
    join?: { from: number; to: number; momentMiss: number; heldMm: number };
    windowAdmission?: IAdmission;
    spend?: ReturnType<typeof storedSpend>;
    refusedAfterFit?: string;
    bands?: { from: number; to: number; heightMm: [number, number]; residual: ReturnType<typeof stats>; leftover: ReturnType<typeof stats>; controls: { stored: number; coarsest: number } }[];
    residualHeights: { atStoredGrids: number; atCoarsest: number };
    total: { atStoredGrids: number; atCoarsest: number };
  }

  /** `fit --layout=<name>`: one layout fitted, admitted, measured back and its residual projected. */
  async function commandFit(out: string, name: string): Promise<void> {
    const spec: ISpec | undefined = SPECS.find((x: ISpec): boolean => x.name === name);
    if (spec === undefined) throw new Error("no layout " + name);
    const layout: S.ILayout = layoutOf(spec);
    const at: number[] = knots();
    const t: ITarget = target();
    const log = (what: string, data: unknown): void => void process.stdout.write(JSON.stringify({ at: new Date().toISOString(), what, layout: name, ...(data as object) }) + "\n");

    // The rows the fit reads: every `FIT_STEP_MM / 2`, the odd ones withheld, as the fit tool lays them (`FamilyConicBody`).
    const rows: F.IRow[] = stations(FIT_STEP_MM / 2).map((s: number, i: number): F.IRow => ({ s, points: t.at(s).points, heldout: i % 2 === 1 }));
    log("rows", { rows: rows.length, fitting: rows.filter((r: F.IRow): boolean => !r.heldout).length, folds: rows.reduce((sum: number, r: F.IRow): number => sum + folds(r.points), 0), dropped: stations(FIT_STEP_MM / 2).reduce((sum: number, s: number): number => sum + t.at(s).dropped, 0) });

    const initial: number[][] = start(spec);
    const margin: number = F.ADMISSIBLE_MARGIN;
    const startAdmission: IAdmission = admission(at, initial, layout, margin);
    log("start", { fields: S.units(layout).length, knots: at.length, ...startAdmission });

    let fitted: F.IResult;
    try {
      fitted = F.fit(rows, at, layout, POWER, initial, margin);
    } catch (error: unknown) {
      fitted = { layout, knots: at, values: [], training: { maximumMm: Infinity, meanMm: Infinity, rmsMm: Infinity }, heldout: { maximumMm: Infinity, meanMm: Infinity, rmsMm: Infinity }, rows: [], chordMaximumMm: Infinity, iterations: 0, folds: 0, fault: "thrown: " + (error instanceof Error ? error.message : String(error)).slice(0, 400), milliseconds: 0 };
    }
    log("fit", { fault: fitted.fault, iterations: fitted.iterations, ms: Math.round(fitted.milliseconds), training: fitted.training, heldout: fitted.heldout });
    // Above the trunk's first knot the window is joined to the held wall (`splice`); the admission and the native check then read the
    // joined wall from the trunk's first knot to the held knot above the stretch, so the join and the held wall on either side are read.
    const window: { knots: number[]; values: number[][] } = { knots: at, values: (fitted.fault === null ? fitted.values : initial).map((field: number[]): number[] => [...field]) };
    const joined: { knots: number[]; values: number[][]; momentMiss: number } = START === FROM ? { ...window, momentMiss: 0 } : splice(spec, window);
    const values: number[][] = rounded(joined.values, layout);
    const range: [number, number] = START === FROM ? [at[0]!, at.at(-1)!] : [FROM, ABOVE];
    const resultAdmission: IAdmission = admission(joined.knots, joined.values, layout, margin, range);
    const family: Family = { name: "trunk.lower." + name, centres: stored().centres, halves: stored().halves, up: stored().up, layout, knots: joined.knots, values };
    const inside: number[] = joined.knots.map((k: number, i: number): number => (k <= range[1] + 1e-9 ? i : -1)).filter((i: number): boolean => i >= 0);
    const native: string[] = K.refusals({ ...family, knots: inside.map((i: number): number => joined.knots[i]!), values: values.map((field: number[]): number[] => inside.map((i: number): number => field[i]!)) });
    // A featured layout holds the wall outside the window as the stored wall converted knot by knot, a natural cubic through converted
    // knots and not the stored one's conversion between them: its largest radial difference from the stored wall over the held stations.
    const heldMm: number = START === FROM || spec.runs.length === 0 ? 0 : ((): number => {
      const mine: (s: number) => number[] = H.reader({ knots: joined.knots, values: converted(spec, joined.knots, "raw") });
      const theirs: (s: number) => number[] = H.reader(stored());
      let worst: number = 0;
      for (let s: number = FROM; s <= ABOVE + 1e-9; s += 0.5) {
        if (s > START + 1e-9 && s < TO - 1e-9) continue;
        const [a, b] = [S.chain(mine(s), layout), S.chain(theirs(s), S.bilateral(1))];
        if (a.fault !== null || b.fault !== null) return Infinity;
        for (let j: number = 0; j < 360; ++j) worst = Math.max(worst, Math.abs(AutoMovieViewChain.radius(a, (2 * Math.PI * j) / 360) - AutoMovieViewChain.radius(b, (2 * Math.PI * j) / 360)));
      }
      return round3(worst);
    })();
    // The window as the fit returned it, read under the same admission over its own stations, and what the join changed: each field's
    // largest change at the window's inside knots, and its end values against the held wall's at the window's two end knots. A refusal
    // after the fit is placed by these: the fit's admission read the window, the join then moved it.
    const windowAdmission: IAdmission = admission(at, window.values, layout, margin, [START, TO]);
    const units: S.Unit[] = S.units(layout);
    const change: { field: number; unit: S.Unit; inside: number; ends: [number, number] }[] = START === FROM ? [] : window.values.map((field: number[], f: number) => {
      const inside: number = Math.max(0, ...joined.knots.map((k: number, i: number): number => {
        const m: number = at.findIndex((x: number): boolean => Math.abs(x - k) < 1e-9);
        return m > 0 && m < at.length - 1 ? Math.abs(joined.values[f]![i]! - field[m]!) : 0;
      }));
      const end = (k: number): number => Math.abs(field[at.indexOf(k)]! - joined.values[f]![joined.knots.indexOf(k)]!);
      return { field: f, unit: units[f]!, inside: round3(inside), ends: [round3(end(START)), round3(end(TO))] as [number, number] };
    });
    log("admission", { ...resultAdmission, range, momentMiss: joined.momentMiss, heldMm, window: windowAdmission, change: change.filter((c): boolean => c.inside > 0.01 || c.ends[0] > 0.01 || c.ends[1] > 0.01), native: native.map((x: string): string => x.slice(0, 300)) });
    const spend: ReturnType<typeof storedSpend> = storedSpend(at);

    // Measured back: the stored wall's values lofted through the engine and read along every target point's ray.
    const loft: AutoMovieViewLoft.IResult = H.create(family, stations(GRID_MM));
    if (loft.chain === null) {
      // Refused after the fit: the row records where and by which premise, and the measurements that place it, with no residual.
      const refusal: string = loft.diagnostics.map((d): string => d.detail).find((d: string): boolean => d.length > 0) ?? "no chain";
      await fs.writeFile(path.join(out, name + ".json"), JSON.stringify({ name, title: spec.title, layout, fields: units.length, knots: joined.knots, windowKnots: at, wallNumbers: units.length * at.length, values, margin, startAdmission, fit: { fault: fitted.fault, iterations: fitted.iterations, ms: Math.round(fitted.milliseconds), training: fitted.training, heldout: fitted.heldout }, windowValues: window.values, windowAdmission, resultAdmission, change, native, admitted: false, refusedAfterFit: refusal, diagnostics: loft.diagnostics.length, spend }, null, 2));
      log("refused after fit", { refusal, diagnostics: loft.diagnostics.length });
      return;
    }
    const chain: Chain = loft.chain;
    const ringAt = (s: number): { ring: P2[]; read: (t: number) => P2 } => {
      const read: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, s);
      const frame: AutoMovieLoftFrame.IFrame = t.axis.at(s);
      const chart = (p: readonly number[]): P2 => {
        const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
        return [dot(d, frame.u), dot(d, frame.v)];
      };
      return { ring: Array.from({ length: RING }, (_: unknown, j: number): P2 => chart(read((2 * Math.PI * j) / RING))), read: (phase: number): P2 => chart(read(phase)) };
    };
    const dense: number[] = stations(DENSE_MM);
    const all: number[] = [];
    const interior: number[] = [];
    let worst = { s: START, heightMm: 0, phaseDeg: 0, mm: 0 };
    const bands: Map<number, { values: number[]; max: number; worstDeg: number }> = new Map();
    const phaseBands: { values: number[] }[] = Array.from({ length: 12 }, () => ({ values: [] as number[] }));
    const walls: Map<number, { radius: (phi: number) => number; read: (t: number) => P2 }> = new Map();
    for (const s of dense) {
      const { ring, read } = ringAt(s);
      const radius: (phi: number) => number = polar(ring);
      walls.set(Math.round(s * 1000), { radius, read });
      const band = bands.get(bandOf(s)) ?? { values: [], max: 0, worstDeg: 0 };
      for (const p of t.at(s).points) {
        const phi: number = Math.atan2(p[1], p[0]);
        const e: number = Math.hypot(p[0], p[1]) - radius(phi);
        if (!Number.isFinite(e)) continue;
        all.push(e);
        if (s >= START + 30 && s <= TO - 30) interior.push(e);
        band.values.push(e);
        phaseBands[Math.min(11, Math.floor((((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 6)))]!.values.push(e);
        if (Math.abs(e) > band.max) [band.max, band.worstDeg] = [Math.abs(e), degrees(phi)];
        if (Math.abs(e) > Math.abs(worst.mm)) worst = { s, heightMm: round2(heightOf(t.axis, s)), phaseDeg: degrees(phi), mm: round3(e) };
      }
      bands.set(bandOf(s), band);
    }
    const residual: IRow["residual"] = {
      all: stats(all),
      interior: stats(interior),
      worst,
      byBand: [...bands.entries()].sort((a, b): number => a[0] - b[0]).map(([k, b]) => ({ from: k, to: Math.min(TO, k + BAND_MM), heightMm: round2(heightOf(t.axis, Math.min(TO, k + BAND_MM / 2))), max: round3(b.max), rms: stats(b.values).rms, worstDeg: b.worstDeg })),
      byPhase: phaseBands.map((b, k: number) => ({ fromDeg: k * 30, toDeg: (k + 1) * 30, max: stats(b.values).max, rms: stats(b.values).rms })),
    };
    log("residual", { all: residual.all, interior: residual.interior, worst });

    // The residual as heights over the fitted wall's own chart (station, chain phase): the target's radius along the ray through the wall's
    // point less the wall's, positive outward. Each window is fitted in turn to what the ones before it leave.
    const carriedNets: IAutoMovieLoftRelief[] = [];
    const carried = (s: number, phase: number): number => carriedNets.reduce((sum: number, r: IAutoMovieLoftRelief): number => sum + AutoMovieLoftRelief.height(r, s, phase)[0], 0);
    const nets: IRow["nets"] = [];
    const polars: Map<number, (phi: number) => number> = new Map();
    const targetRadius = (s: number, phi: number): number => {
      const key: number = Math.round(s * 1000);
      let read = polars.get(key);
      if (read === undefined) polars.set(key, (read = polar(t.at(s).points)));
      return read(phi);
    };
    const field = (s: number, phase: number): number => {
      const p: P2 = walls.get(Math.round(s * 1000))!.read(phase);
      return targetRadius(s, Math.atan2(p[1], p[0])) - Math.hypot(p[0], p[1]) - carried(s, phase);
    };
    for (const window of WINDOWS) {
      const relief: IAutoMovieLoftRelief | undefined = (stored().reliefs ?? []).find((r: IAutoMovieLoftRelief): boolean => r.name === window.net);
      if (relief === undefined) throw new Error("no stored net " + window.net);
      const width: number = AutoMovieLoftRelief.width(relief);
      // The stored grid's spacing kept on the window clipped to the stretch.
      const rowMm: number = (relief.stations[1] - relief.stations[0]) / (relief.rows - 3);
      const clipped: [number, number] = [Math.max(START, relief.stations[0]), Math.min(TO, relief.stations[1])];
      // A window that does not reach into the fitted stretch carries nothing of it (`trunk.crotch` ends at 88 mm).
      if (clipped[1] - clipped[0] < 4 * rowMm) continue;
      const rows: number = Math.max(7, Math.round((clipped[1] - clipped[0]) / rowMm) + 3);
      const columns: number = relief.columns;
      const base: Omit<IAutoMovieLoftRelief, "heights" | "rows" | "columns"> = { name: relief.name + ".residual", stations: clipped, phases: relief.phases, axis: relief.axis, ...(relief.turn === undefined ? {} : { turn: relief.turn }) };
      const sampleStations: number[] = dense.filter((s: number): boolean => s > clipped[0] && s < clipped[1]);
      const sampleCount: number = (columns - 3) * NET_PER_COLUMN + 1;
      const samplePhases: number[] = Array.from({ length: sampleCount }, (_: unknown, j: number): number => relief.phases[0] + (width * j) / (sampleCount - 1) - (j === sampleCount - 1 && width >= 2 * Math.PI - 1e-9 ? 1e-9 : 0));
      const heights: number[][] = sampleStations.map((s: number): number[] => samplePhases.map((phase: number): number => {
        const x: number = field(s, phase);
        return Number.isFinite(x) ? x : 0;
      }));
      const net: IAutoMovieLoftRelief | null = fitNet(base, rows, columns, window.mirror === "self", { stations: sampleStations, phases: samplePhases, heights });
      if (net === null) {
        nets.push({ net: window.net, window: { stations: clipped, phases: relief.phases }, storedGrid: [rows, columns], storedHeights: NaN, coarse: [rows, columns], coarseHeights: NaN, coarseFromStoredMax: NaN, carried: stats([]) });
        continue;
      }
      // The twin carries the mirror side of an off-axis window with the same heights, columns reversed (`AutoMovieHumanConicRelief.twin`).
      const twin: IAutoMovieLoftRelief[] = window.mirror !== "twin" ? [] : (stored().reliefs ?? []).filter((r: IAutoMovieLoftRelief): boolean => r.name === window.net + ".twin").map((r: IAutoMovieLoftRelief): IAutoMovieLoftRelief => AutoMovieHumanConicRelief.twin(net, { name: net.name + ".twin", phases: r.phases, axis: r.axis, ...(r.turn === undefined ? {} : { turn: r.turn }) }));
      const carriedHere: number[] = heights.flatMap((row: number[], i: number): number[] => row.map((x: number, j: number): number => AutoMovieLoftRelief.height(net, sampleStations[i]!, samplePhases[j]!)[0] - x));
      // The coarsest grid within the bound of the net at the stored grid, as stage B2 searched (rows, columns, both; the shares in turn).
      const size = (r: number, c: number): number => storedCount(r, c, window.mirror);
      let best: { net: IAutoMovieLoftRelief; max: number } = { net, max: 0 };
      for (const pick of [[true, false], [false, true], [true, true]] as [boolean, boolean][])
        for (const share of SHARES) {
          const r: number = pick[0] ? Math.max(7, Math.round(rows * share)) : rows;
          const even: number = pick[1] ? Math.max(7, Math.round(columns * share)) : columns;
          const c: number = window.mirror === "self" && even % 2 === 0 ? even + 1 : even;
          if (size(r, c) >= size(best.net.rows, best.net.columns)) continue;
          const coarse: IAutoMovieLoftRelief = P.project(net, r, c, window.mirror === "self", DECIMALS, FIT_PER_SPAN);
          const difference: P.IDifference = P.difference(net, coarse, CHECK_PER_SPAN);
          if (difference.max <= BOUND_MM) best = { net: coarse, max: difference.max };
        }
      carriedNets.push(net, ...twin);
      nets.push({ net: window.net, window: { stations: clipped, phases: relief.phases }, storedGrid: [rows, columns], storedHeights: size(rows, columns), coarse: [best.net.rows, best.net.columns], coarseHeights: size(best.net.rows, best.net.columns), coarseFromStoredMax: round3(best.max), carried: stats(carriedHere) });
      log("net", nets.at(-1));
    }
    // What the nets at their stored grids leave of the residual, on the wall's chart at every dense station and `PHASES` phases.
    const left: number[] = [];
    const leftInterior: number[] = [];
    const leftBands: Map<number, number[]> = new Map();
    for (const s of dense)
      for (let j: number = 0; j < PHASES; ++j) {
        const x: number = field(s, (2 * Math.PI * j) / PHASES);
        if (!Number.isFinite(x)) continue;
        left.push(x);
        if (s >= START + 30 && s <= TO - 30) leftInterior.push(x);
        const into: number[] = leftBands.get(bandOf(s)) ?? [];
        into.push(x);
        leftBands.set(bandOf(s), into);
      }
    // Each net's free controls by band: a control of row `i` of `R` stands at its Greville station, parameter `i - 1` of `[0, R - 3]`.
    const controls = (grid: "storedGrid" | "coarse"): Map<number, number> => {
      const counted: Map<number, number> = new Map();
      for (const net of nets) {
        const [R, Cc]: [number, number] = net[grid];
        const mirror: IWindow["mirror"] = WINDOWS.find((w: IWindow): boolean => w.net === net.net)?.mirror ?? "none";
        for (let i: number = 3; i <= R - 4; ++i) {
          const s: number = net.window.stations[0] + ((i - 1) / (R - 3)) * (net.window.stations[1] - net.window.stations[0]);
          counted.set(bandOf(s), (counted.get(bandOf(s)) ?? 0) + (mirror === "self" ? (Cc + 1) / 2 : Cc));
        }
      }
      return counted;
    };
    const [storedControls, coarseControls]: Map<number, number>[] = [controls("storedGrid"), controls("coarse")];
    const byBand: NonNullable<IRow["bands"]> =[...bands.keys()].sort((x: number, y: number): number => x - y).map((b: number) => ({ from: b, to: Math.min(TO, b + BAND_MM), heightMm: [round2(heightOf(t.axis, b)), round2(heightOf(t.axis, Math.min(TO, b + BAND_MM)))], residual: stats(bands.get(b)!.values), leftover: stats(leftBands.get(b) ?? []), controls: { stored: storedControls!.get(b) ?? 0, coarsest: coarseControls!.get(b) ?? 0 } }));
    const wallNumbers: number = S.units(layout).length * at.length;
    const atStored: number = nets.reduce((sum, n): number => sum + (Number.isFinite(n.storedHeights) ? n.storedHeights : 0), 0);
    const atCoarse: number = nets.reduce((sum, n): number => sum + (Number.isFinite(n.coarseHeights) ? n.coarseHeights : 0), 0);
    const row: IRow = {
      name,
      title: spec.title,
      layout,
      fields: S.units(layout).length,
      knots: joined.knots,
      windowKnots: at,
      join: { from: START, to: TO, momentMiss: joined.momentMiss, heldMm },
      windowAdmission,
      spend,
      bands: byBand,
      wallNumbers,
      values,
      margin,
      startAdmission,
      fit: { fault: fitted.fault, iterations: fitted.iterations, ms: Math.round(fitted.milliseconds), training: fitted.training, heldout: fitted.heldout, chordMaximumMm: fitted.chordMaximumMm, folds: fitted.folds },
      resultAdmission,
      native,
      admitted: fitted.fault === null && resultAdmission.refused === 0 && native.length === 0,
      residual,
      nets,
      leftover: { all: stats(left), interior: stats(leftInterior) },
      residualHeights: { atStoredGrids: atStored, atCoarsest: atCoarse },
      total: { atStoredGrids: wallNumbers + atStored, atCoarsest: wallNumbers + atCoarse },
    };
    await fs.writeFile(path.join(out, name + ".json"), JSON.stringify(row, null, 2));
    log("done", { wallNumbers, residualHeights: row.residualHeights, total: row.total, leftover: row.leftover, admitted: row.admitted });
  }

  /** `table`: every layout's row from the run's files. */
  async function commandTable(out: string): Promise<void> {
    const lines: string[] = ["| Layout | Wall numbers (fields x knots) | Residual max / p99 / RMS, mm | Residual heights, stored grids / coarsest | Total numbers, stored grids / coarsest | Leftover after nets max / p99 / RMS, mm | Admitted | Fit steps, s |", "| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |"];
    for (const spec of SPECS) {
      const file: string = path.join(out, spec.name + ".json");
      const row: IRow | null = await fs.readFile(file, "utf8").then((text: string): IRow => JSON.parse(text) as IRow).catch((): null => null);
      if (row === null) {
        lines.push(`| ${spec.name} | not run | | | | | | |`);
        continue;
      }
      if (row.refusedAfterFit !== undefined) {
        lines.push(`| ${row.name}: ${row.title} | ${row.wallNumbers} (${row.fields} x ${(row.windowKnots ?? row.knots).length}) | refused after fit | | | | no: window as fitted ${row.windowAdmission?.refused ?? "?"} of ${row.windowAdmission?.read ?? "?"} readings refused; joined ${row.resultAdmission.refused} refused, first ${row.resultAdmission.first ?? ""}; loft: ${row.refusedAfterFit.slice(0, 160)} | ${row.fit.iterations}, ${Math.round(row.fit.ms / 1000)} |`);
        continue;
      }
      const r = row.residual.all;
      const l = row.leftover.all;
      lines.push(`| ${row.name}: ${row.title} | ${row.wallNumbers} (${row.fields} x ${(row.windowKnots ?? row.knots).length}) | ${r.max} / ${r.p99} / ${r.rms} | ${row.residualHeights.atStoredGrids} / ${row.residualHeights.atCoarsest} | ${row.total.atStoredGrids} / ${row.total.atCoarsest} | ${l.max} / ${l.p99} / ${l.rms} | ${row.admitted ? "yes" : "no: " + (row.fit.fault ?? row.resultAdmission.first ?? row.native[0] ?? "").slice(0, 120)} | ${row.fit.iterations}, ${Math.round(row.fit.ms / 1000)} |`);
    }
    // What the stored trunk spends on the same stretch, from any row that recorded it.
    for (const spec of SPECS) {
      const text: string | null = await fs.readFile(path.join(out, spec.name + ".json"), "utf8").catch((): null => null);
      const spend: IRow["spend"] = text === null ? undefined : (JSON.parse(text) as IRow).spend;
      if (spend === undefined) continue;
      lines.push("", `Stored trunk on stations ${START}-${TO}: wall ${spend.wallNumbers} numbers (${spend.wallKnotsInside} knots inside x 10 fields), nets ${spend.netControls} free controls (${Object.entries(spend.byNet).map(([n, c]): string => n + " " + c).join(", ")}), total ${spend.wallNumbers + spend.netControls}; a fitted window adds ${spend.windowInsideKnots} inside knots x its fields.`);
      break;
    }
    // By band: residual RMS, leftover after the residual nets RMS, and the nets' free controls at the stored grids and the coarsest.
    const rows: IRow[] = [];
    for (const spec of SPECS) {
      const text: string | null = await fs.readFile(path.join(out, spec.name + ".json"), "utf8").catch((): null => null);
      if (text !== null && (JSON.parse(text) as IRow).bands !== undefined) rows.push(JSON.parse(text) as IRow);
    }
    if (rows.length > 0) {
      lines.push("", "| Band, stations (height mm) | " + rows.map((r: IRow): string => `${r.name} residual max / RMS | ${r.name} leftover RMS | ${r.name} controls`).join(" | ") + " |", "| --- | " + rows.map((): string => "---: | ---: | ---:").join(" | ") + " |");
      rows[0]!.bands!.forEach((band, k: number): void => {
        lines.push(`| ${band.from}-${band.to} (${band.heightMm[0]}-${band.heightMm[1]}) | ` + rows.map((r: IRow): string => {
          const b = r.bands![k]!;
          return `${b.residual.max} / ${b.residual.rms} | ${b.leftover.rms} | ${b.controls.stored} / ${b.controls.coarsest}`;
        }).join(" | ") + " |");
      });
    }
    await fs.writeFile(path.join(out, "table.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\n");
  }

  /** A lofted chain's display mesh over the stretch, metres: a ring every millimetre at `DISPLAY_PHASES` phases. */
  function mesh(id: string, chain: Chain): N.Mesh {
    const rings: number[][][] = stations(GRID_MM, FROM).map((s: number): number[][] => {
      const read: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, s);
      return Array.from({ length: DISPLAY_PHASES }, (_: unknown, j: number): number[] => read((2 * Math.PI * j) / DISPLAY_PHASES));
    });
    const positions: number[] = [];
    const indices: number[] = [];
    for (const ring of rings) for (const p of ring) positions.push(p[0]! / 1000, p[1]! / 1000, p[2]! / 1000);
    const M: number = DISPLAY_PHASES;
    for (let i: number = 0; i + 1 < rings.length; ++i)
      for (let j: number = 0; j < M; ++j) {
        const a: number = i * M + j;
        const b: number = i * M + ((j + 1) % M);
        indices.push(a, a + M, b, b, a + M, b + M);
      }
    return { id, positions, indices, colour: [0.64, 0.65, 0.67] };
  }

  /**
   * `frames --layouts=<a,b>`: each named fitted wall alone beside the stored trunk with its nets, over the stretch. The cameras are the
   * figure tool's for its hip zone (`FamilyConicFigure`: 0.72 to 0.98 m high, within 0.22 m of the median plane), fitted by the same
   * `NodeCanvasCamera.fit` on the stored trunk's own points in that zone instead of the reference's, which this part does not read, and
   * one more zone over the waist, 0.95 to 1.17 m, which the figure's zones leave between the hip and the chest.
   */
  async function commandFrames(out: string, names: string[]): Promise<void> {
    const t: ITarget = target();
    const shown: { stage: string; mesh: N.Mesh }[] = [{ stage: "stored", mesh: mesh("trunk.stored", t.chain) }];
    for (const name of names) {
      const row: IRow = JSON.parse(await fs.readFile(path.join(out, name + ".json"), "utf8")) as IRow;
      const family: Family = { name: "trunk.lower." + name, centres: stored().centres, halves: stored().halves, up: stored().up, layout: row.layout, knots: row.knots, values: row.values };
      const chain: Chain | null = H.create(family, stations(GRID_MM, FROM)).chain;
      if (chain === null) throw new Error(name + " did not loft");
      shown.push({ stage: name, mesh: mesh("trunk." + name, chain) });
    }
    const points: N.Point[] = [];
    const positions: readonly number[] = shown[0]!.mesh.positions;
    for (let i: number = 0; i < positions.length; i += 3) points.push([positions[i]!, positions[i + 1]!, positions[i + 2]!]);
    const zones: [string, (p: N.Point) => boolean][] = [
      ["hip", (p: N.Point): boolean => p[1] > 0.72 && p[1] < 0.98 && Math.abs(p[2]) < 0.22],
      ["waist", (p: N.Point): boolean => p[1] > 0.95 && p[1] < 1.17 && Math.abs(p[2]) < 0.2],
    ];
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const [zone, inside] of zones)
      for (const view of (argument("views") ?? "front,back,left,low-oblique").split(",")) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, points.filter(inside), FRAME_PX, FRAME_PX);
        for (const { stage, mesh: m } of shown) {
          const file: string = `lower.${zone}.${view}.${stage}.png`;
          const png: Buffer = NodeCanvasRaster.render(camera, [m], [], "depth", `f1 trunk ${FROM}-${TO} | ${stage === "stored" ? "stored wall + nets" : stage + " wall alone"} | ${zone} ${view}`).png;
          await fs.writeFile(path.join(out, file), png);
          frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        }
      }
    await fs.writeFile(path.join(out, "frames.json"), JSON.stringify({ zones: zones.map(([z]) => z), frames }, null, 2));
    process.stdout.write(JSON.stringify({ out, frames: frames.length }) + "\n");
  }

  /** Width of the station bands a layout's residual and its nets' controls are read by, mm: the target's own bands (`commandTarget`). */
  const BAND_MM: number = 40;

  /** The band a station falls in, by its first station. */
  const bandOf = (s: number): number => START + Math.min(Math.floor((TO - START - 1e-9) / BAND_MM), Math.floor((s - START) / BAND_MM)) * BAND_MM;

  /**
   * `bands`: each fitted layout's residual against the target by `BAND_MM` band (max, p99, RMS), and its residual nets' controls by band:
   * a control of a net's row `i` of `R` stands at its Greville station, parameter `i - 1` of `[0, R - 3]` (`FamilyConicProject`), and each
   * free row's stored controls (half the columns of a self-mirrored net) are counted in the band that station falls in.
   */
  async function commandBands(out: string): Promise<void> {
    const t: ITarget = target();
    const lines: string[] = [];
    const table: Record<string, unknown> = {};
    for (const spec of SPECS) {
      const text: string | null = await fs.readFile(path.join(out, spec.name + ".json"), "utf8").catch((): null => null);
      if (text === null) continue;
      const row: IRow = JSON.parse(text) as IRow;
      const family: Family = { name: "trunk.lower." + spec.name, centres: stored().centres, halves: stored().halves, up: stored().up, layout: row.layout, knots: row.knots, values: row.values };
      const chain: Chain | null = H.create(family, stations(GRID_MM)).chain;
      if (chain === null) throw new Error(spec.name + " did not loft");
      const residual: Map<number, number[]> = new Map();
      for (const s of stations(DENSE_MM)) {
        const read: (phase: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, s);
        const frame: AutoMovieLoftFrame.IFrame = t.axis.at(s);
        const ring: P2[] = Array.from({ length: RING }, (_: unknown, j: number): P2 => {
          const p: number[] = read((2 * Math.PI * j) / RING);
          const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
          return [dot(d, frame.u), dot(d, frame.v)];
        });
        const radius: (phi: number) => number = polar(ring);
        const into: number[] = residual.get(bandOf(s)) ?? [];
        for (const p of t.at(s).points) {
          const e: number = Math.hypot(p[0], p[1]) - radius(Math.atan2(p[1], p[0]));
          if (Number.isFinite(e)) into.push(e);
        }
        residual.set(bandOf(s), into);
      }
      const controls = (grid: "storedGrid" | "coarse"): Map<number, number> => {
        const counted: Map<number, number> = new Map();
        for (const net of row.nets) {
          const [R, Cc]: [number, number] = net[grid];
          const mirror: IWindow["mirror"] = WINDOWS.find((w: IWindow): boolean => w.net === net.net)?.mirror ?? "none";
          const perRow: number = mirror === "self" ? (Cc + 1) / 2 : Cc;
          for (let i: number = 3; i <= R - 4; ++i) {
            const s: number = net.window.stations[0] + ((i - 1) / (R - 3)) * (net.window.stations[1] - net.window.stations[0]);
            counted.set(bandOf(s), (counted.get(bandOf(s)) ?? 0) + perRow);
          }
        }
        return counted;
      };
      const [atStored, atCoarse]: Map<number, number>[] = [controls("storedGrid"), controls("coarse")];
      const bands = [...residual.keys()].sort((a: number, b: number): number => a - b).map((b: number) => ({ from: b, to: Math.min(TO, b + BAND_MM), heightMm: [round2(heightOf(t.axis, b)), round2(heightOf(t.axis, Math.min(TO, b + BAND_MM)))], residual: stats(residual.get(b)!), freeControls: { stored: atStored!.get(b) ?? 0, coarsest: atCoarse!.get(b) ?? 0 } }));
      table[spec.name] = bands;
      lines.push(spec.name + ": " + bands.map((b): string => `${b.from}-${b.to} (${b.heightMm[0]}-${b.heightMm[1]} mm) ${b.residual.max}/${b.residual.p99}/${b.residual.rms} mm, ${b.freeControls.stored}/${b.freeControls.coarsest} controls`).join(" | "));
    }
    await fs.writeFile(path.join(out, "bands.json"), JSON.stringify(table, null, 2));
    process.stdout.write(lines.join("\n") + "\n");
  }

  /**
   * `bottom --stations=<s,...>`: what the nets carry at the trunk's bottom. At each station: the target section's folds about the course
   * (zero: one loop, star-shaped), its radial gap inside the stored wall's section (the stored fields read by the section model) by 10
   * degree bins, and `FamilyConicFit.decompose` of the L0 fit against those sections: each section fitted alone under the same margin (the
   * layout's capacity), those fits carried by the knots (the knots' capacity), and the constraints within 0.02 of their bound at the L0
   * optimum over the bottom stations (binding). Each section is also fitted alone under a margin of 0.01, so a misfit the margin holds is
   * told from one the layout cannot avoid.
   */
  async function commandBottom(out: string, at: number[]): Promise<void> {
    const t: ITarget = target();
    const layout: S.ILayout = S.bilateral(1);
    const storedRead: (s: number) => number[] = H.reader(stored());
    const rows: F.IRow[] = at.map((s: number): F.IRow => ({ s, points: t.at(s).points, heldout: false }));
    const l0: IRow = JSON.parse(await fs.readFile(path.join(out, "L0.json"), "utf8")) as IRow;
    const decomposition: F.IDecomposition = F.decompose(rows, { knots: l0.knots, values: l0.values }, layout, F.ADMISSIBLE_MARGIN, rows.map((): null => null));
    const loose: { s: number; max: number; mean: number; least: number; fault: string | null }[] = rows.map((row: F.IRow) => {
      const result: F.IResult = F.fit([row, { ...row, s: row.s + 1 }], [row.s, row.s + 1], layout, 2, undefined, 0.01);
      return { s: row.s, max: round3(result.training.maximumMm), mean: round3(result.training.meanMm), least: result.fault === null ? round3(Math.min(...F.leastMeetings(result.values.map((f: number[]): number => f[0]!), layout))) : NaN, fault: result.fault };
    });
    const sections = rows.map((row: F.IRow, i: number) => {
      const wall: AutoMovieViewChain.ISection = S.chain(storedRead(row.s), layout);
      const bins: { deg: number; gapMax: number; gapMean: number }[] = Array.from({ length: 36 }, (_: unknown, k: number) => ({ deg: k * 10, gapMax: 0, gapMean: 0 }));
      const counts: number[] = new Array<number>(36).fill(0);
      for (const p of row.points) {
        const phi: number = Math.atan2(p[1], p[0]);
        const gap: number = AutoMovieViewChain.radius(wall, phi) - Math.hypot(p[0], p[1]);
        const k: number = Math.floor(degrees(phi) / 10) % 36;
        bins[k]!.gapMax = Math.max(bins[k]!.gapMax, gap);
        bins[k]!.gapMean += gap;
        ++counts[k]!;
      }
      bins.forEach((b, k: number): void => {
        b.gapMax = round2(b.gapMax);
        b.gapMean = round2(b.gapMean / Math.max(1, counts[k]!));
      });
      const d = decomposition.rows[i]!;
      return {
        s: row.s,
        heightMm: round2(heightOf(t.axis, row.s)),
        folds: folds(row.points),
        dropped: t.at(row.s).dropped,
        extentMm: { front: round2(Math.max(...row.points.map((p: P2): number => p[0]))), back: round2(Math.min(...row.points.map((p: P2): number => p[0]))), side: round2(Math.max(...row.points.map((p: P2): number => Math.abs(p[1])))) },
        gapInsideStoredWallByTenDegrees: bins,
        l0Joint: { max: round3(d.joint.maximumMm), mean: round3(d.joint.meanMm), phaseDeg: degrees(d.joint.phase) },
        aloneMargin01: d.alone === null ? null : { max: round3(d.alone.maximumMm), mean: round3(d.alone.meanMm), least: round3(d.alone.least) },
        aloneMargin001: loose[i],
        knotsCapacity: d.longitudinal.map((x, v: number) => ({ times: [1, 2, 4][v], max: round3(x.maximumMm), mean: round3(x.meanMm), admissible: x.admissible })),
      };
    });
    const bottomEnd: number = Math.max(...at) + 2;
    const binding = decomposition.binding.filter((b): boolean => b.s <= bottomEnd);
    const report = { stations: at, sections, binding: { readings: binding.length, meeting: [...new Set(binding.filter((b): boolean => b.kind === "meeting").map((b): number => b.index))].map((j: number) => ({ arc: j, least: round3(Math.min(...binding.filter((b): boolean => b.kind === "meeting" && b.index === j).map((b): number => b.value))), from: Math.min(...binding.filter((b): boolean => b.kind === "meeting" && b.index === j).map((b): number => b.s)), to: Math.max(...binding.filter((b): boolean => b.kind === "meeting" && b.index === j).map((b): number => b.s)) })), share: [...new Set(binding.filter((b): boolean => b.kind === "share").map((b): number => b.index))] } };
    await fs.writeFile(path.join(out, "bottom.json"), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify(report) + "\n");
  }

  export async function main(): Promise<void> {
    const command: string | undefined = process.argv[2];
    const out: string | undefined = argument("out");
    if (out === undefined) throw new Error("--out=<directory> is required");
    START = Number(argument("from") ?? FROM);
    if (!(START >= FROM && START < TO)) throw new Error("--from must lie in [" + FROM + ", " + TO + ")");
    await fs.mkdir(out, { recursive: true });
    if (command === "target") return commandTarget(out);
    if (command === "fit") return commandFit(out, argument("layout") ?? "L0");
    if (command === "table") return commandTable(out);
    if (command === "bands") return commandBands(out);
    if (command === "bottom") return commandBottom(out, (argument("stations") ?? "28,48,68,108,148").split(",").map(Number));
    if (command === "frames") return commandFrames(out, (argument("layouts") ?? "L0").split(","));
    throw new Error("unknown command " + command);
  }
}

void FamilyConicLowerTrunk.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
