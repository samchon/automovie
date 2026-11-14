import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftRelief, AutoMovieViewChain, type IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1 } from "@automovie/human";

/**
 * The survey of what f1's stored numbers carry (issue #3197, step 2): which heights repeat others exactly, which the figure never reads,
 * how coarse each relief net and each wall's knot set could be, and what each net holds. It changes nothing, reads no reference data and
 * builds no figure: every number is read from the stored families through the engine's relief evaluator and the section model.
 *
 * Usage, from `test/` after `pnpm conic:build`: `node .shots/esbuild/FamilyConicSurvey.cjs`. It writes `survey.txt` and `survey.json`
 * under `test/.shots/family-conic-count/<time>/`.
 *
 * What the engine's relief evaluation fixes (`AutoMovieLoftRelief.height`), which every net reading here rests on:
 *
 * - A net of `n` controls across a window is a uniform cubic B-spline over the parameter range `[0, n - 3]`; control `i` shapes the
 *   spans `i - 3 .. i`, so its Greville abscissa, the mean of its three inner knots, is the parameter `i - 1`. Control 1 stands on the
 *   window's first edge, control `n - 2` on its last, and controls 0 and `n - 1` one spacing outside.
 * - Reflecting the window about its middle, parameter `x` to `n - 3 - x`, sends control `i` to `n - 1 - i`. A window of one whole turn
 *   is no periodic net: it is the same clamped window whose two edges meet at its first phase, zero there by its outer rings, so its
 *   mirror map is the same column reversal.
 * - The body's reflection in the median plane sends a phase `t` of a median family's chart to `-t`. It maps a window onto itself when
 *   the window's middle phase is 0 or pi, and its heights' directions onto their reflections when `axis` lies in the median plane and
 *   `turn`, if any, along `+-Z`. Such a net must then equal its own column reversal for the skin to be symmetric.
 * - Rows or columns of zeros beyond the three outer rings leave the height identically zero over whole spans, so a window may shrink by
 *   whole spans with the control spacing kept.
 */
namespace FamilyConicSurvey {
  type Family = AutoMovieHumanConicLoft.IFamily;

  /**
   * Where the figure reads each family whose stored range it does not use whole, as `AutoMovieHumanF1.construction` builds it (the lines
   * are those of commit c43387567f). Its constants are module-private, so their values are repeated here with the line that holds them;
   * a family absent here is read from its first tip or knot to its last.
   */
  const BUILT: Record<string, { from?: number; to?: number; basis: string }> = {
    arm: { to: 445, basis: "AutoMovieHumanF1.ts:467 ARM_TO_MM = 445; :1304 drops the arm's top tip; :1307 passes it to leaf as `until`; :1116 ends the layers there" },
    hand: { to: 595, basis: "AutoMovieHumanF1.ts:1237 replaces the hand's tips by [null, null]; :1115-1116 lays its layers from its first knot to its last" },
    leg: { to: 975, basis: "AutoMovieHumanF1.ts:1237 keeps the leg's first tip (null) and drops its top tip; :1115-1116 lays its layers from its first knot to its last" },
    "finger.thumb": { from: -10, basis: "AutoMovieHumanF1.ts:510 ROOT_MM = 10; :1241 closes the thumb's capsule at station -ROOT_MM" },
  };

  /** The nets issue #3412 named as correcting a wall's misfit on convex skin, by name or by the `hollow` in a limb net's name. */
  const MISFIT: RegExp = /^(trunk\.head\.back|trunk\.collar|trunk\.fold(\.twin)?|trunk\.crotch(\.twin)?|(arm|hand|leg)\.hollow\.\d+)$/;

  /** Samples per control spacing a net's surface is read at, each way: a cubic span read at four points and its ends shows its extremes to a few percent. */
  const PER_SPAN: number = 4;

  /** The shares of its rows and columns a net is resampled at, as the brief lists them. */
  const SHARES: [string, number][] = [["3/4", 3 / 4], ["2/3", 2 / 3], ["1/2", 1 / 2], ["1/3", 1 / 3]];

  /** The largest differences, mm, a coarser net or a thinner knot set is reported under. */
  const UNDER_NET: number[] = [0.1, 0.25, 0.5];

  /** The same for a wall, with the millimetre the brief adds. */
  const UNDER_WALL: number[] = [0.1, 0.25, 0.5, 1.0];

  /** How a wall is read when a knot is taken out: stations at most this far apart, mm, and this many polar phases round each section. */
  const WALL: { stepMm: number; least: number; phases: number } = { stepMm: 2, least: 60, phases: 120 };

  /** The station range the figure reads a family over, caps included. */
  function built(family: Family): [number, number] {
    const own: { from?: number; to?: number } | undefined = BUILT[family.name];
    const [bottom, top]: [AutoMovieHumanConicLoft.ITip | null, AutoMovieHumanConicLoft.ITip | null] = family.tips ?? [null, null];
    return [own?.from ?? (bottom === null ? family.knots[0]! : bottom.tip), own?.to ?? (top === null ? family.knots.at(-1)! : top.tip)];
  }

  /** The station range a family's fields own, between its caps and inside what the figure reads. */
  function owned(family: Family): [number, number] {
    const [lo, hi]: [number, number] = built(family);
    const [bottom, top]: [AutoMovieHumanConicLoft.ITip | null, AutoMovieHumanConicLoft.ITip | null] = family.tips ?? [null, null];
    return [Math.max(family.knots[0]!, lo, BUILT[family.name]?.from === undefined && bottom !== null ? bottom.from : -Infinity), Math.min(family.knots.at(-1)!, hi, BUILT[family.name]?.to === undefined && top !== null ? top.from : Infinity)];
  }

  /** A net's height at row `a`, column `b`. */
  function at(relief: IAutoMovieLoftRelief, a: number, b: number): number {
    return relief.heights[a * relief.columns + b]!;
  }

  /** The station of row `a`'s control and the phase of column `b`'s, at their Greville abscissae. */
  function site(relief: IAutoMovieLoftRelief, a: number, b: number): [number, number] {
    return [relief.stations[0] + ((a - 1) * (relief.stations[1] - relief.stations[0])) / (relief.rows - 3), relief.phases[0] + ((b - 1) * AutoMovieLoftRelief.width(relief)) / (relief.columns - 3)];
  }

  /** The largest, the 99th percentile and the mean of a list of magnitudes. */
  function spread(values: number[]): { max: number; p99: number; mean: number } {
    if (values.length === 0) return { max: 0, p99: 0, mean: 0 };
    const sorted: number[] = [...values].sort((x: number, y: number): number => x - y);
    return { max: sorted.at(-1)!, p99: sorted[Math.min(sorted.length - 1, Math.floor(0.99 * sorted.length))]!, mean: sorted.reduce((sum: number, x: number): number => sum + x, 0) / sorted.length };
  }

  /**
   * Whether the body's reflection maps the net's window and directions onto themselves (the namespace's third rule). The windows are
   * stored to four decimals, so a middle within 1e-4 rad of 0 or pi counts: a window written about 3.1416 stands 7e-6 rad off pi, a
   * micrometre on a 150 mm radius.
   */
  function reflective(relief: IAutoMovieLoftRelief): boolean {
    const middle: number = relief.phases[0] + AutoMovieLoftRelief.width(relief) / 2;
    return Math.abs(Math.sin(middle)) < 1e-4 &&Math.abs(relief.axis[2]) < 1e-9 && (relief.turn === undefined || (Math.abs(relief.turn[0]) < 1e-9 && Math.abs(relief.turn[1]) < 1e-9));
  }

  /** The largest difference between a net and another of its size, straight or with the other's columns reversed. */
  function apart(one: IAutoMovieLoftRelief, other: IAutoMovieLoftRelief, reversed: boolean): number {
    let most: number = 0;
    for (let a: number = 0; a < one.rows; ++a) for (let b: number = 0; b < one.columns; ++b) most = Math.max(most, Math.abs(at(one, a, b) - at(other, a, reversed ? one.columns - 1 - b : b)));
    return most;
  }

  /** The four weights of a uniform cubic span and its first control, as the engine's `basis` gives them. */
  function basis(x: number, count: number): [number, number[]] {
    const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
    const f: number = x - i;
    return [i, [(1 - f) ** 3 / 6, (3 * f ** 3 - 6 * f ** 2 + 4) / 6, (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6, f ** 3 / 6]];
  }

  /** The matrix of `count` controls' weights at `samples` evenly spaced parameters over the whole window, row by sample. */
  function design(samples: number, count: number): number[][] {
    return Array.from({ length: samples }, (_: unknown, k: number): number[] => {
      const out: number[] = new Array<number>(count).fill(0);
      const [i, w]: [number, number[]] = basis((k / (samples - 1)) * (count - 3), count);
      for (let c: number = 0; c < 4; ++c) out[i + c]! += w[c]!;
      return out;
    });
  }

  /** Solve `G X = B` for a symmetric positive definite `G` by Cholesky, `B` given and returned by rows. */
  function solve(G: number[][], B: number[][]): number[][] {
    const n: number = G.length;
    const L: number[][] = G.map((r: number[]): number[] => [...r]);
    for (let j: number = 0; j < n; ++j) {
      for (let k: number = 0; k < j; ++k) for (let i: number = j; i < n; ++i) L[i]![j]! -= L[i]![k]! * L[j]![k]!;
      const d: number = Math.sqrt(L[j]![j]!);
      for (let i: number = j; i < n; ++i) L[i]![j]! /= d;
    }
    const X: number[][] = B.map((r: number[]): number[] => [...r]);
    const columns: number = B[0]?.length ?? 0;
    for (let c: number = 0; c < columns; ++c) {
      for (let i: number = 0; i < n; ++i) {
        for (let k: number = 0; k < i; ++k) X[i]![c]! -= L[i]![k]! * X[k]![c]!;
        X[i]![c]! /= L[i]![i]!;
      }
      for (let i: number = n - 1; i >= 0; --i) {
        for (let k: number = i + 1; k < n; ++k) X[i]![c]! -= L[k]![i]! * X[k]![c]!;
        X[i]![c]! /= L[i]![i]!;
      }
    }
    return X;
  }

  /** A net's surface on its sample grid, `PER_SPAN` samples a stored spacing, through the engine's evaluator. */
  function surface(relief: IAutoMovieLoftRelief, ns: number, nt: number): number[][] {
    const span: number = AutoMovieLoftRelief.width(relief);
    return Array.from({ length: ns }, (_: unknown, i: number): number[] =>
      Array.from({ length: nt }, (__: unknown, j: number): number => AutoMovieLoftRelief.height(relief, relief.stations[0] + ((relief.stations[1] - relief.stations[0]) * i) / (ns - 1), relief.phases[0] + (span * j) / (nt - 1))[0]),
    );
  }

  /**
   * A coarser net over the same window, two ways. `greville`: each control takes the stored surface's height at its own Greville
   * abscissa, which is Schoenberg's variation-diminishing spline; it never overshoots and rounds every feature off, so it is the
   * pessimistic reading. `fitted`: the least-squares net on the sample grid, solved one direction at a time (a tensor-product fit on a
   * grid separates), which is what a refit of the net at that size could reach. Both keep the three outer rings at zero.
   */
  function coarser(relief: IAutoMovieLoftRelief, rows: number, columns: number, F: number[][]): { greville: IAutoMovieLoftRelief; fitted: IAutoMovieLoftRelief } {
    const span: number = AutoMovieLoftRelief.width(relief);
    const free = (count: number): number[] => Array.from({ length: Math.max(0, count - 6) }, (_: unknown, k: number): number => k + 3);
    const [fr, fc]: [number[], number[]] = [free(rows), free(columns)];
    const sampled: number[] = new Array<number>(rows * columns).fill(0);
    for (const a of fr) for (const b of fc) sampled[a * columns + b] = AutoMovieLoftRelief.height(relief, relief.stations[0] + ((a - 1) * (relief.stations[1] - relief.stations[0])) / (rows - 3), relief.phases[0] + ((b - 1) * span) / (columns - 3))[0];
    const A: number[][] = design(F.length, rows).map((r: number[]): number[] => fr.map((a: number): number => r[a]!));
    const B: number[][] = design(F[0]!.length, columns).map((r: number[]): number[] => fc.map((b: number): number => r[b]!));
    const gram = (M: number[][]): number[][] => M[0]!.map((_: number, p: number): number[] => M[0]!.map((__: number, q: number): number => M.reduce((sum: number, r: number[]): number => sum + r[p]! * r[q]!, 0)));
    // C = (A^T A)^-1 A^T F B (B^T B)^-1.
    const AtF: number[][] = fr.map((_: number, p: number): number[] => F[0]!.map((__: number, j: number): number => A.reduce((sum: number, r: number[], i: number): number => sum + r[p]! * F[i]![j]!, 0)));
    const X: number[][] = solve(gram(A), AtF);
    const XB: number[][] = X.map((r: number[]): number[] => fc.map((_: number, q: number): number => r.reduce((sum: number, x: number, j: number): number => sum + x * B[j]![q]!, 0)));
    // Y (B^T B) = X B, solved by rows: (B^T B) Y^T = (X B)^T.
    const Yt: number[][] = solve(gram(B), fc.map((_: number, q: number): number[] => XB.map((r: number[]): number => r[q]!)));
    const fitted: number[] = new Array<number>(rows * columns).fill(0);
    fr.forEach((a: number, p: number): void => fc.forEach((b: number, q: number): void => void (fitted[a * columns + b] = Yt[q]![p]!)));
    return { greville: { ...relief, rows, columns, heights: sampled }, fitted: { ...relief, rows, columns, heights: fitted } };
  }

  /** A family's field vector at a station from the given knots and values, each field a natural cubic. */
  function reader(knots: number[], values: number[][]): (s: number) => number[] {
    return AutoMovieHumanConicLoft.reader({ knots, values });
  }

  /** The wall's polar radii at the given stations, `WALL.phases` round each; NaN where the section model yields no chain. */
  function radii(family: Family, knots: number[], values: number[][], stations: number[]): Float64Array {
    const read: (s: number) => number[] = reader(knots, values);
    const out: Float64Array = new Float64Array(stations.length * WALL.phases);
    stations.forEach((s: number, i: number): void => {
      const section: AutoMovieViewChain.ISection = AutoMovieHumanConicSection.chain(read(s), family.layout);
      for (let j: number = 0; j < WALL.phases; ++j) out[i * WALL.phases + j] = AutoMovieViewChain.radius(section, (2 * Math.PI * j) / WALL.phases);
    });
    return out;
  }

  /** The largest radial move between two walls on one grid, mm; infinite where the second loses a section the first has. */
  function moved(base: Float64Array, other: Float64Array): number {
    let most: number = 0;
    for (let k: number = 0; k < base.length; ++k) {
      if (Number.isNaN(base[k]!)) continue;
      if (Number.isNaN(other[k]!)) return Infinity;
      most = Math.max(most, Math.abs(base[k]! - other[k]!));
    }
    return most;
  }

  /** How many decimals a stored number is written with. */
  function decimals(x: number): number {
    const text: string = String(x);
    return text.includes("e") ? 12 : text.includes(".") ? text.length - text.indexOf(".") - 1 : 0;
  }

  /** The largest residual of the least-squares line of `ys` over `xs`. */
  function offLine(xs: number[], ys: number[]): number {
    const n: number = xs.length;
    const [mx, my]: [number, number] = [xs.reduce((s: number, x: number): number => s + x, 0) / n, ys.reduce((s: number, y: number): number => s + y, 0) / n];
    const sxx: number = xs.reduce((s: number, x: number): number => s + (x - mx) ** 2, 0);
    const slope: number = sxx === 0 ? 0 : xs.reduce((s: number, x: number, k: number): number => s + (x - mx) * (ys[k]! - my), 0) / sxx;
    return Math.max(...ys.map((y: number, k: number): number => Math.abs(y - my - slope * (xs[k]! - mx))));
  }

  const fix = (x: number, digits: number = 2): string => (Number.isFinite(x) ? x.toFixed(digits) : "lost");
  const pad = (value: string | number, width: number): string => String(value).padStart(width);
  const lead = (value: string, width: number): string => value.padEnd(width);

  /** Read every family and write the survey. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const members: { family: Family; role: string; mirrored: boolean }[] = [
      ...AutoMovieHumanF1.FAMILIES.map((m: AutoMovieHumanF1.IMember) => ({ family: m.family, role: "family", mirrored: m.mirrored })),
      ...AutoMovieHumanF1.CUTTERS.map((c: { family: Family; mirrored: boolean }) => ({ family: c.family, role: "cutter", mirrored: c.mirrored })),
    ];
    const nets: { family: Family; mirrored: boolean; relief: IAutoMovieLoftRelief }[] = members.flatMap((m) => (m.family.reliefs ?? []).map((relief: IAutoMovieLoftRelief) => ({ family: m.family, mirrored: m.mirrored, relief })));
    const lines: string[] = ["f1 as stored: the survey (issue #3197, step 2). Nothing was changed; no figure was built.", ""];
    const json: Record<string, unknown> = {};
    const candidates: { candidate: string; saved: number; change: string; premise: string; risk: string; order: number }[] = [];

    // 1. Exact redundancy.
    lines.push("1. EXACT REDUNDANCY IN NETS", "");
    lines.push("  A net's own mirror map is its column reversal, column b to columns - 1 - b (see the tool's header for its derivation from the");
    lines.push("  engine's evaluation). 'reflective' marks a net of a median family whose window and directions the body's reflection maps onto");
    lines.push("  themselves: only there does the body's symmetry ask the net to equal its reversal.", "");
    lines.push("  " + lead("net", 24) + lead("reflective", 11) + pad("max |h - reversed|", 19) + "  " + lead("redundancy", 34) + pad("saved", 7));
    const exact: { net: string; kind: string; saved: number; apart: number }[] = [];
    const near: { net: string; relief: IAutoMovieLoftRelief; apart: number }[] = [];
    for (const [index, { mirrored, relief }] of nets.entries()) {
      const self: number = apart(relief, relief, true);
      const median: boolean = !mirrored && reflective(relief);
      let kind: string = "none";
      let saved: number = 0;
      let diff: number = self;
      if (self === 0) {
        kind = median ? "its own mirror image" : "its own mirror image (not asked by symmetry)";
        saved = relief.rows * Math.floor(relief.columns / 2);
      } else if (median) near.push({ net: relief.name, relief, apart: self });
      // A twin or a copy: an earlier net of the same size it equals, straight or reversed.
      for (const other of nets.slice(0, index)) {
        if (other.relief.rows !== relief.rows || other.relief.columns !== relief.columns) continue;
        for (const reversed of [true, false]) {
          if (kind !== "none" || apart(relief, other.relief, reversed) !== 0) continue;
          kind = (reversed ? "column-reversed " : "copy of ") + other.relief.name;
          saved = relief.rows * relief.columns;
          diff = 0;
        }
      }
      if (saved > 0) exact.push({ net: relief.name, kind, saved, apart: diff });
      lines.push("  " + lead(relief.name, 24) + lead(median ? "yes" : mirrored ? "side family" : "no", 11) + pad(self === 0 ? "0" : self.toFixed(4), 19) + "  " + lead(kind, 34) + pad(saved, 7));
    }
    lines.push("", "  Nets of one size across families, whether or not they are equal (largest difference straight, then reversed, mm):");
    for (let p: number = 0; p < nets.length; ++p)
      for (let q: number = p + 1; q < nets.length; ++q) {
        const [one, other]: [IAutoMovieLoftRelief, IAutoMovieLoftRelief] = [nets[p]!.relief, nets[q]!.relief];
        if (one.rows !== other.rows || one.columns !== other.columns) continue;
        lines.push("    " + lead(one.name + " / " + other.name, 46) + pad(apart(one, other, false).toFixed(4), 10) + pad(apart(one, other, true).toFixed(4), 10));
      }
    const savedMirror: number = exact.filter((e) => e.kind.startsWith("its own")).reduce((sum: number, e): number => sum + e.saved, 0);
    const savedTwin: number = exact.filter((e) => !e.kind.startsWith("its own")).reduce((sum: number, e): number => sum + e.saved, 0);
    lines.push("", "  Saved by storing one half of each self-mirrored net: " + savedMirror + " heights; by writing each twin or copy as its original's map: " + savedTwin + ".", "");
    json.exact = exact;
    candidates.push({ candidate: "Store one half of each exactly self-mirrored net (" + exact.filter((e) => e.kind.startsWith("its own")).map((e) => e.net.replace("trunk.", "")).join(", ") + ")", saved: savedMirror, change: "none", premise: "the module writes the half and the family expands it by column reversal before the engine reads it; heights then equal the stored ones bit for bit", risk: "an expansion step in the family's reading; the emitter must write halves", order: 0 });
    candidates.push({ candidate: "Write each twin or copy as a map of its original (" + exact.filter((e) => !e.kind.startsWith("its own")).map((e) => e.net.replace("trunk.", "")).join(", ") + ")", saved: savedTwin, change: "none", premise: "the twin's heights are the original's with columns reversed (max difference 0); its window and directions stay as stored", risk: "the record says each side of chest.side was fitted on its own skin; they are equal now, so a later refit of one side breaks the map", order: 0 });

    // 2. Near symmetry.
    lines.push("2. NEAR SYMMETRY (reflective nets that do not equal their reversal)", "");
    lines.push("  Asymmetry is h(a, b) - h(a, columns - 1 - b) over each pair of controls, mm. Symmetrising by the mean of both sides moves each");
    lines.push("  control by half its asymmetry, and the surface by no more than the largest control move (a B-spline lies in its controls' hull).", "");
    const nearRows: unknown[] = [];
    for (const { net, relief } of near) {
      const pairs: { a: number; b: number; d: number }[] = [];
      for (let a: number = 0; a < relief.rows; ++a) for (let b: number = 0; b < Math.floor(relief.columns / 2); ++b) pairs.push({ a, b, d: Math.abs(at(relief, a, b) - at(relief, a, relief.columns - 1 - b)) });
      const stats = spread(pairs.map((p): number => p.d));
      const worst = [...pairs].sort((x, y): number => y.d - x.d).slice(0, 5);
      const amplitude: number = Math.max(...relief.heights.map(Math.abs));
      lines.push("  " + net + ": max " + stats.max.toFixed(3) + ", p99 " + stats.p99.toFixed(3) + ", mean " + stats.mean.toFixed(4) + " mm over " + pairs.length + " pairs (the net's largest height " + amplitude.toFixed(2) + " mm); pairs over 0.01 mm: " + pairs.filter((p): boolean => p.d > 0.01).length);
      lines.push("    largest at (station mm, phase rad): " + worst.map((w): string => "(" + site(relief, w.a, w.b)[0].toFixed(1) + ", " + site(relief, w.a, w.b)[1].toFixed(3) + ") " + w.d.toFixed(3)).join("; "));
      lines.push("    symmetrised by the mean: controls move " + (stats.max / 2).toFixed(3) + " mm at most, " + (stats.mean / 2).toFixed(4) + " on average; saves " + relief.rows * Math.floor(relief.columns / 2) + " heights");
      nearRows.push({ net, ...stats, worst: worst.map((w) => ({ station: site(relief, w.a, w.b)[0], phase: site(relief, w.a, w.b)[1], mm: w.d })), saved: relief.rows * Math.floor(relief.columns / 2) });
      candidates.push({ candidate: "Symmetrise " + net + " by the mean of its two sides and store one half", saved: relief.rows * Math.floor(relief.columns / 2), change: "bounded by " + (stats.max / 2).toFixed(2) + " mm", premise: "the wall under it is a reflected half, so the asymmetry is the fit's, not the wall's", risk: "moves skin by up to half the asymmetry where it is largest; frames decide", order: 1 });
    }
    if (near.length === 0) lines.push("  none");
    lines.push("");
    json.near = nearRows;

    // 3. Dead numbers.
    lines.push("3. DEAD NUMBERS (stored and not read by the figure)", "");
    lines.push("  A net's row a shapes the stations between its controls a - 3 and a + 1 (AutoMovieLoftRelief.ts:6-10, :49-58), and a leaf lays no");
    lines.push("  station outside its family's built range (AutoMovieHumanF1.ts:1115-1118; part() adds only the caps' rings, AutoMovieHumanConicLoft.ts:381).");
    lines.push("  A row whose stations all lie outside that range is not read by any layer. Not proven by this: that no band or join evaluates a");
    lines.push("  host chain past its end ring, and that the mesh is byte-identical without the row; both need the whole-figure gate.", "");
    for (const [name, own] of Object.entries(BUILT)) lines.push("  built range of " + name + ": " + JSON.stringify(built(members.find((m) => m.family.name === name)!.family)) + "  (" + own.basis + ")");
    lines.push("", "  " + lead("net", 24) + lead("window, mm", 16) + lead("built, mm", 18) + pad("dead rows", 10) + pad("heights", 8) + pad("not zero", 9) + "  whole net dead");
    let deadHeights: number = 0;
    let deadNonzero: number = 0;
    const dead: unknown[] = [];
    const whole: Map<string, string[]> = new Map();
    for (const { family, relief } of nets) {
      const [lo, hi]: [number, number] = built(family);
      const h: number = (relief.stations[1] - relief.stations[0]) / (relief.rows - 3);
      const rows: number[] = Array.from({ length: relief.rows }, (_: unknown, a: number): number => a).filter((a: number): boolean => relief.stations[0] + (a + 1) * h <= lo || relief.stations[0] + (a - 3) * h >= hi);
      if (rows.length === 0) continue;
      const nonzero: number = rows.reduce((sum: number, a: number): number => sum + Array.from({ length: relief.columns }, (_: unknown, b: number): number => at(relief, a, b)).filter((x: number): boolean => x !== 0).length, 0);
      const all: boolean = rows.length === relief.rows;
      if (all) whole.set(family.name, [...(whole.get(family.name) ?? []), relief.name]);
      deadHeights += rows.length * relief.columns;
      deadNonzero += nonzero;
      dead.push({ net: relief.name, rows: rows.length, heights: rows.length * relief.columns, nonzero, whole: all });
      lines.push("  " + lead(relief.name, 24) + lead(relief.stations[0] + " .. " + relief.stations[1], 16) + lead(lo + " .. " + hi, 18) + pad(rows.length + " of " + relief.rows, 10) + pad(rows.length * relief.columns, 8) + pad(nonzero, 9) + "  " + (all ? "yes" : "no"));
    }
    lines.push("  total: " + deadHeights + " heights in dead rows, " + deadNonzero + " of them not zero.", "");
    lines.push("  A dead net is still read for the mesh's density: part() takes the family's phases no farther apart than its finest net's column");
    lines.push("  (AutoMovieHumanConicLoft.ts:377, :387, and :397 under `turn`). Finest column, rad, with and without the wholly dead nets:");
    for (const [name, gone] of whole) {
      const family: Family = members.find((m) => m.family.name === name)!.family;
      const finest = (reliefs: IAutoMovieLoftRelief[]): number => Math.min(...reliefs.map((r: IAutoMovieLoftRelief): number => (r.phases[1] - r.phases[0]) / (r.columns - 3)));
      const [withAll, without]: [number, number] = [finest(family.reliefs!), finest(family.reliefs!.filter((r: IAutoMovieLoftRelief): boolean => !gone.includes(r.name)))];
      lines.push("    " + name + ": " + withAll.toFixed(5) + " with, " + without.toFixed(5) + " without " + gone.join(", ") + (withAll === without ? "  (unchanged: the phases stay as they are)" : "  (CHANGES: the family's phase count would change with the net's removal)"));
    }
    // The arm's knots past the hand's takeover.
    const arm: Family = members.find((m) => m.family.name === "arm")!.family;
    const armTo: number = BUILT.arm!.to!;
    const keep: number = arm.knots.findIndex((k: number): boolean => k >= armTo) + 1;
    const stationsOf = (lo: number, hi: number): number[] => {
      const count: number = Math.max(WALL.least, Math.ceil((hi - lo) / WALL.stepMm));
      return Array.from({ length: count + 1 }, (_: unknown, i: number): number => lo + ((hi - lo) * i) / count);
    };
    const armStations: number[] = stationsOf(arm.knots[0]!, armTo);
    const armMove: number = moved(radii(arm, arm.knots, arm.values, armStations), radii(arm, arm.knots.slice(0, keep), arm.values.map((f: number[]): number[] => f.slice(0, keep)), armStations));
    const armDropped: number = (arm.knots.length - keep) * (arm.values.length + 1);
    lines.push("", "  The arm's knots past " + arm.knots[keep - 1] + " mm (" + (arm.knots.length - keep) + " knots, " + armDropped + " numbers with their stations) lie past its last layer at " + armTo + " mm, but they are not dead:");
    lines.push("  a natural cubic runs through every knot, so they bend the fields before " + armTo + " mm. Dropped, the wall from " + arm.knots[0] + " to " + armTo + " mm moves " + fix(armMove, 4) + " mm at most");
    lines.push("  (radially, " + armStations.length + " stations by " + WALL.phases + " phases; the new end is a natural end at " + arm.knots[keep - 1] + " mm).");
    const tipsUnread: string[] = ["arm", "hand", "leg"].filter((name: string): boolean => (members.find((m) => m.family.name === name)!.family.tips?.[1] ?? null) !== null);
    lines.push("", "  Tips stored and replaced before the figure reads them (AutoMovieHumanF1.ts:1237 for the hand and the leg, :1304 for the arm): the top tip of " + tipsUnread.join(", ") + ", 2 numbers each.");
    lines.push("  Other readers of those tips (the offline fit tools, a pose's station map) were not surveyed.");
    const vault: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1Vault.ts"), "utf8");
    const vaultNumbers: number = Number(vault.match(/(\d+) independent numbers/)?.[1] ?? "NaN");
    lines.push("  AutoMovieHumanF1Vault.ts declares a family that neither FAMILIES nor CUTTERS lists and no module of packages/human/src imports (git grep): " + vaultNumbers + " numbers by its header,");
    lines.push("  with its course points and `up` in the placing table. It is a constructed form kept outside the body.");
    lines.push("  Fields a layout ignores: none. resolve() reads every anchor's numbers and one shoulder per arc (AutoMovieHumanConicSection.ts:488-561);");
    lines.push("  IAnchor.window, pick and feature hold no stored number.", "");
    json.dead = { nets: dead, deadHeights, deadNonzero, armKnots: { dropped: arm.knots.length - keep, numbers: armDropped, moveMm: armMove }, tipsUnread };
    const wholeNames: string[] = [...whole.values()].flat();
    const wholeHeights: number = nets.filter((n) => wholeNames.includes(n.relief.name)).reduce((sum: number, n): number => sum + n.relief.heights.length, 0);
    candidates.push({ candidate: "Remove the nets no layer reads (" + wholeNames.join(", ") + ")", saved: wholeHeights, change: "none claimed; needs the gate", premise: "no reader evaluates the family past its built range, and the family's finest column (its phase count) does not change", risk: "the nets' directions leave the placing table as well; byte-identity is unproven", order: 0 });
    candidates.push({ candidate: "Drop the dead rows of nets that reach outside their family's built range", saved: deadHeights - wholeHeights, change: "none claimed; needs the gate", premise: "the window is cut by whole spans so the kept controls keep their spacing; a split's or a port's band reads its host only inside the built range", risk: deadNonzero + " of the dead heights are not zero, so the window's new edge cuts a non-zero height: outside the figure, but a relief's window must contain its height (lofting.md)", order: 0 });
    candidates.push({ candidate: "Drop the arm's " + (arm.knots.length - keep) + " knots past " + arm.knots[keep - 1] + " mm, which the hand's family covers", saved: armDropped, change: "bounded by " + fix(armMove, 3) + " mm", premise: "the arm ends at " + armTo + " mm in the figure and its nets past it go with them", risk: "the armscye's loop and the wrist's band read the arm; its last knot becomes a natural end", order: 1 });
    candidates.push({ candidate: "Remove the unread top tips of the arm, the hand and the leg, and the vault's module", saved: 2 * tipsUnread.length + (Number.isFinite(vaultNumbers) ? vaultNumbers : 0), change: "none", premise: "nothing else reads them: the fit tools and the pose's station map were not surveyed", risk: "the vault is kept as a record of a constructed form; removing it is the owner's call", order: 0 });

    // 4. Zero borders.
    lines.push("4. ZERO BORDERS", "");
    lines.push("  Rows and columns that are entirely zero at each edge; three are the engine's rule. With k >= 4 zero rows at an edge the height is");
    lines.push("  identically zero over the first k - 3 spans (span i reads controls i .. i + 3, AutoMovieLoftRelief.ts:56-58), so the window can lose");
    lines.push("  k - 3 rows there with its edge moved by as many spacings. What stays identical: the control spacing, so every evaluated height, to");
    lines.push("  the rounding of the parameter (u = (s - s0) / (s1 - s0) * (rows - 3) is computed from other numbers, about 1e-13). What does not:");
    lines.push("  (a) a turning cast's direction is measured from the window's middle phase (AutoMovieLoftRelief.ts:184), so unless as many columns");
    lines.push("  go at both sides its axis and turn must be rotated by the middle's shift; (b) a leaf cuts its layers as fine as the rows of every");
    lines.push("  net whose window they cross (AutoMovieHumanF1.ts:1125), so layers in the dropped border are no longer refined: the same surface,");
    lines.push("  other rings; (c) the new edges are not round numbers and must be stored exactly.", "");
    lines.push("  " + lead("net", 24) + pad("rows lo/hi", 11) + pad("cols lo/hi", 11) + pad("box", 10) + pad("saved", 7) + "  columns even at both sides");
    let savedBorder: number = 0;
    const borders: unknown[] = [];
    for (const { relief } of nets) {
      const zeroRow = (a: number): boolean => Array.from({ length: relief.columns }, (_: unknown, b: number): number => at(relief, a, b)).every((x: number): boolean => x === 0);
      const zeroColumn = (b: number): boolean => Array.from({ length: relief.rows }, (_: unknown, a: number): number => at(relief, a, b)).every((x: number): boolean => x === 0);
      const run = (count: number, zero: (k: number) => boolean, back: boolean): number => {
        let n: number = 0;
        while (n < count && zero(back ? count - 1 - n : n)) ++n;
        return n;
      };
      const [r0, r1, c0, c1]: number[] = [run(relief.rows, zeroRow, false), run(relief.rows, zeroRow, true), run(relief.columns, zeroColumn, false), run(relief.columns, zeroColumn, true)];
      const rows: number = Math.max(7, relief.rows - Math.max(0, r0! - 3) - Math.max(0, r1! - 3));
      const columns: number = Math.max(7, relief.columns - Math.max(0, c0! - 3) - Math.max(0, c1! - 3));
      const saved: number = r0 === relief.rows ? 0 : relief.rows * relief.columns - rows * columns;
      savedBorder += saved;
      borders.push({ net: relief.name, rows: [r0, r1], columns: [c0, c1], box: [rows, columns], saved });
      lines.push("  " + lead(relief.name, 24) + pad(r0 + "/" + r1, 11) + pad(c0 + "/" + c1, 11) + pad(rows + "x" + columns, 10) + pad(saved, 7) + "  " + (c0 === c1 ? "yes" : relief.turn === undefined ? "no (fixed cast: no direction to rotate)" : "no (axis and turn must be rotated)"));
    }
    lines.push("  total saved by shrinking every window to its non-zero box plus three rings: " + savedBorder + " heights.", "");
    json.borders = borders;
    candidates.push({ candidate: "Shrink every window to its non-zero box plus three rings", saved: savedBorder, change: "none to rounding (surface); the layers in the dropped border change", premise: "edges move by whole spacings and are stored exactly; a turning cast's directions are rotated where the middle shifts", risk: "the mesh is not byte-identical (other rings in the border); overlaps the dead rows and the halves", order: 0 });

    // 5. How coarse each net can be.
    lines.push("5. HOW COARSE EACH NET CAN BE", "");
    lines.push("  Each net's own surface (the engine's evaluator, " + PER_SPAN + " samples a stored spacing each way) against a coarser net on the same window, mm along");
    lines.push("  the cast. 'fit' is the least-squares net of that size on the samples; 'greville' samples the stored surface at the coarse controls'");
    lines.push("  Greville abscissae (Schoenberg's spline, which rounds every feature off: the pessimistic reading). Slope is the largest slope of");
    lines.push("  the difference, degrees, by central differences on the sample grid, with the phase turned into millimetres by the wall's polar");
    lines.push("  radius there (a proxy: the wall alone, uncapped, so it understates the slope near a pole). A pointer for the plan, not an acceptance.", "");
    const coarse: unknown[] = [];
    const savedUnder: number[] = UNDER_NET.map((): number => 0);
    for (const { family, relief } of nets) {
      const [ns, nt]: [number, number] = [PER_SPAN * (relief.rows - 3) + 1, PER_SPAN * (relief.columns - 3) + 1];
      const F: number[][] = surface(relief, ns, nt);
      const span: number = AutoMovieLoftRelief.width(relief);
      const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(family);
      const [ds, dt]: [number, number] = [(relief.stations[1] - relief.stations[0]) / (ns - 1), span / (nt - 1)];
      const radius: number[][] = Array.from({ length: ns }, (_: unknown, i: number): number[] => {
        const s: number = Math.min(family.knots.at(-1)!, Math.max(family.knots[0]!, relief.stations[0] + i * ds));
        const section: AutoMovieViewChain.ISection = AutoMovieHumanConicSection.chain(read(s), family.layout);
        return Array.from({ length: nt }, (__: unknown, j: number): number => {
          const r: number = AutoMovieViewChain.radius(section, relief.phases[0] + j * dt);
          return Number.isFinite(r) ? Math.max(1, r) : 1;
        });
      });
      const against = (other: IAutoMovieLoftRelief): { max: number; p99: number; rms: number; slope: number } => {
        const G: number[][] = surface(other, ns, nt);
        const D: number[][] = G.map((r: number[], i: number): number[] => r.map((x: number, j: number): number => x - F[i]![j]!));
        const flat: number[] = D.flat().map(Math.abs);
        const stats = spread(flat);
        let slope: number = 0;
        for (let i: number = 1; i < ns - 1; ++i) for (let j: number = 1; j < nt - 1; ++j) slope = Math.max(slope, Math.hypot((D[i + 1]![j]! - D[i - 1]![j]!) / (2 * ds), (D[i]![j + 1]! - D[i]![j - 1]!) / (2 * dt * radius[i]![j]!)));
        return { max: stats.max, p99: stats.p99, rms: Math.sqrt(flat.reduce((sum: number, x: number): number => sum + x * x, 0) / flat.length), slope: (Math.atan(slope) * 180) / Math.PI };
      };
      lines.push("  " + relief.name + "  " + relief.rows + " x " + relief.columns + " = " + relief.heights.length + " heights; largest height " + Math.max(...relief.heights.map(Math.abs)).toFixed(2) + " mm; spacing " + ((relief.stations[1] - relief.stations[0]) / (relief.rows - 3)).toFixed(2) + " mm by " + (span / (relief.columns - 3)).toFixed(4) + " rad");
      lines.push("    " + lead("grid", 22) + pad("heights", 8) + pad("fit max", 9) + pad("p99", 8) + pad("rms", 8) + pad("slope", 8) + pad("greville max", 14));
      const grids: { label: string; rows: number; columns: number; heights: number; fit: { max: number; p99: number; rms: number; slope: number }; greville: number }[] = [];
      for (const [which, pick] of [["rows", [true, false]], ["columns", [false, true]], ["both", [true, true]]] as [string, [boolean, boolean]][])
        for (const [label, share] of SHARES) {
          const rows: number = pick[0] ? Math.max(7, Math.round(relief.rows * share)) : relief.rows;
          const columns: number = pick[1] ? Math.max(7, Math.round(relief.columns * share)) : relief.columns;
          const made = coarser(relief, rows, columns, F);
          const fit = against(made.fitted);
          const greville: number = against(made.greville).max;
          grids.push({ label: which + " " + label, rows, columns, heights: rows * columns, fit, greville });
          lines.push("    " + lead(which + " " + label + " (" + rows + "x" + columns + ")", 22) + pad(rows * columns, 8) + pad(fit.max.toFixed(3), 9) + pad(fit.p99.toFixed(3), 8) + pad(fit.rms.toFixed(3), 8) + pad(fit.slope.toFixed(2), 8) + pad(greville.toFixed(3), 14));
        }
      const coarsest = UNDER_NET.map((limit: number, k: number): string => {
        const best = grids.filter((g): boolean => g.fit.max < limit).sort((x, y): number => x.heights - y.heights)[0];
        if (best !== undefined) savedUnder[k]! += relief.heights.length - best.heights;
        return "under " + limit + " mm: " + (best === undefined ? "none of these" : best.label + " " + best.rows + "x" + best.columns + " (" + best.heights + ")");
      });
      lines.push("    coarsest by the fit, " + coarsest.join("; "), "");
      coarse.push({ net: relief.name, rows: relief.rows, columns: relief.columns, grids });
    }
    lines.push("  Summed over the nets, heights saved by each net's coarsest listed grid: " + UNDER_NET.map((limit: number, k: number): string => "under " + limit + " mm " + savedUnder[k]).join(", ") + ".", "");
    json.coarse = coarse;
    UNDER_NET.forEach((limit: number, k: number): void => void candidates.push({ candidate: "Refit every net at its coarsest listed grid under " + limit + " mm", saved: savedUnder[k]!, change: "bounded by " + limit + " mm against the stored net (the fit's own surface, not the skin)", premise: "each net is refitted on its stored wall at the new size; the listed grids are the only ones tried", risk: "a coarser net rounds off the lids, lips and folds first; the slope column shows where a crease could show; frames accept", order: 1 }));

    // 6. Wall knots.
    lines.push("6. WALL KNOTS", "");
    lines.push("  For every family and cutter: the largest radial move of the wall (no relief, no cap), mm, over its field-owned stations at most " + WALL.stepMm + " mm apart");
    lines.push("  and " + WALL.phases + " polar phases, when a knot is taken out and every field laid through the others by the same natural cubic. Then a greedy");
    lines.push("  order: at each step the knot whose removal leaves the smallest move from the stored wall. 'lost' means the section model gives no");
    lines.push("  chain somewhere. A radial move overstates the move along the normal where the wall is aslant to its ray.", "");
    const walls: unknown[] = [];
    const wallSaved: number[] = UNDER_WALL.map((): number => 0);
    for (const { family, role } of members) {
      const [lo, hi]: [number, number] = owned(family);
      const stations: number[] = stationsOf(lo, hi);
      const base: Float64Array = radii(family, family.knots, family.values, stations);
      const without = (gone: number[]): number => {
        const kept: number[] = family.knots.map((_: number, k: number): number => k).filter((k: number): boolean => !gone.includes(k));
        return moved(base, radii(family, kept.map((k: number): number => family.knots[k]!), family.values.map((f: number[]): number[] => kept.map((k: number): number => f[k]!)), stations));
      };
      const interior: number[] = family.knots.map((_: number, k: number): number => k).slice(1, -1);
      const single: number[] = interior.map((k: number): number => without([k]));
      const order: { knot: number; move: number }[] = [];
      const gone: number[] = [];
      while (gone.length < interior.length) {
        let best: { k: number; move: number } | null = null;
        for (const k of interior) {
          if (gone.includes(k)) continue;
          const move: number = gone.length === 0 ? single[interior.indexOf(k)]! : without([...gone, k]);
          if (best === null || move < best.move) best = { k, move };
        }
        if (best === null) break;
        gone.push(best.k);
        order.push({ knot: family.knots[best.k]!, move: best.move });
        if (best.move > UNDER_WALL.at(-1)!) break;
      }
      const removable: number[] = UNDER_WALL.map((limit: number): number => order.reduce((most: number, step, n: number): number => (step.move <= limit ? n + 1 : most), 0));
      removable.forEach((n: number, k: number): void => void (wallSaved[k]! += n * (family.values.length + 1)));
      lines.push("  " + family.name + " (" + role + "): " + family.knots.length + " knots x " + family.values.length + " fields, read over " + lo + " .. " + hi + " mm at " + stations.length + " stations" + (base.some(Number.isNaN) ? "  (the stored wall itself gives no radius at " + base.filter(Number.isNaN).length + " samples)" : ""));
      lines.push("    one knot out, mm:  " + interior.map((k: number, n: number): string => family.knots[k] + ": " + fix(single[n]!)).join("  "));
      lines.push("    greedy order:      " + order.map((step): string => step.knot + " -> " + fix(step.move)).join("  "));
      lines.push("    removable under " + UNDER_WALL.map((limit: number, k: number): string => limit + " mm: " + removable[k] + " knots (" + removable[k]! * (family.values.length + 1) + " numbers)").join("; "));
      // Per field: constant, linear along the station, or following another field, within one unit of its last stored decimal.
      const units: AutoMovieHumanConicSection.Unit[] = AutoMovieHumanConicSection.units(family.layout);
      const notes: string[] = [];
      family.values.forEach((field: number[], f: number): void => {
        const tolerance: number = 10 ** -Math.max(...field.map(decimals));
        const found: string[] = [];
        if (Math.max(...field) - Math.min(...field) <= tolerance) found.push("constant at " + field[0]);
        else if (field.length >= 4 && offLine(family.knots, field) <= tolerance) found.push("linear along the station");
        // A constant field follows nothing: any line through another field's values would fit it.
        for (let g: number = 0; g < f && found.length === 0; ++g) {
          const other: number[] = family.values[g]!;
          if (units[g] !== units[f] ||Math.max(...other) - Math.min(...other) <= tolerance) continue;
          if (Math.max(...field.map((x: number, k: number): number => Math.abs(x - other[k]!))) <= tolerance) found.push("equals field " + g);
          else if (Math.max(...field.map((x: number, k: number): number => Math.abs(x + other[k]!))) <= tolerance) found.push("is the negative of field " + g);
          else if (field.length >= 5 && offLine(other, field) <= tolerance) found.push("is a line of field " + g);
        }
        if (found.length > 0) notes.push("field " + f + " (" + units[f] + "): " + found.join(", "));
      });
      lines.push("    fields within one unit of their last stored decimal: " + (notes.length === 0 ? "none constant, linear or following another of its unit" : notes.join("; ")), "");
      walls.push({ family: family.name, knots: family.knots.length, fields: family.values.length, range: [lo, hi], single: interior.map((k: number, n: number) => ({ knot: family.knots[k], move: single[n] })), order, removable, notes });
    }
    lines.push("  Summed over the families and cutters, numbers saved (fields and the knot's station): " + UNDER_WALL.map((limit: number, k: number): string => "under " + limit + " mm " + wallSaved[k]).join(", ") + ".", "");
    json.walls = walls;
    UNDER_WALL.forEach((limit: number, k: number): void => void candidates.push({ candidate: "Thin every wall's knots by its greedy order under " + limit + " mm", saved: wallSaved[k]!, change: "bounded by " + limit + " mm radially against the stored wall, before its dependents are refitted", premise: "the fields are laid through the kept knots as stored (a refit on the kept knots would do better); every net, cutter and band on the wall is refitted on it", risk: "a moved wall moves every dependent: nets, port loops, seams, fan webs; the engine must still admit every section between stations", order: 2 }));

    // 7. What each net carries.
    lines.push("7. WHAT EACH NET CARRIES", "");
    lines.push("  Footprint: the controls at a quarter of the largest height or more. Its extent along the station and round the part (the phase");
    lines.push("  extent times the wall's polar radius at the peak) and its share of the window give the form by rule: a whole face when the footprint");
    lines.push("  is 35 % of the window or more; else a groove (into the wall) or a rim (out of it) when it is three times as long one way as the");
    lines.push("  other; else a hollow or a mound. 'Into the wall' is the sign of the cast at the window's middle against the chart's radial direction");
    lines.push("  there, read with the phase as a polar angle. The rule reads the numbers only; the record's table names the regions. 'misfit' marks");
    lines.push("  the nets issue #3412 named as correcting a wall's misfit on convex skin.", "");
    lines.push("  " + lead("net", 24) + pad("peak mm", 8) + "  " + lead("at (station, phase)", 21) + pad("share", 6) + pad("along mm", 9) + pad("round mm", 9) + "  " + lead("sense", 14) + lead("form", 12) + "misfit");
    const carries: unknown[] = [];
    let misfitHeights: number = 0;
    for (const { family, relief } of nets) {
      let peak: [number, number] = [0, 0];
      for (let a: number = 0; a < relief.rows; ++a) for (let b: number = 0; b < relief.columns; ++b) if (Math.abs(at(relief, a, b)) > Math.abs(at(relief, peak[0], peak[1]))) peak = [a, b];
      const top: number = at(relief, peak[0], peak[1]);
      const foot: [number, number][] = [];
      for (let a: number = 0; a < relief.rows; ++a) for (let b: number = 0; b < relief.columns; ++b) if (Math.abs(at(relief, a, b)) >= Math.abs(top) / 4 && top !== 0) foot.push([a, b]);
      const [sPeak, tPeak]: [number, number] = site(relief, peak[0], peak[1]);
      const section: AutoMovieViewChain.ISection = AutoMovieHumanConicSection.chain(AutoMovieHumanConicLoft.reader(family)(Math.min(family.knots.at(-1)!, Math.max(family.knots[0]!, sPeak))), family.layout);
      const r: number = AutoMovieViewChain.radius(section, tPeak);
      const alongMm: number = foot.length === 0 ? 0 : ((Math.max(...foot.map((p): number => p[0])) - Math.min(...foot.map((p): number => p[0])) + 1) * (relief.stations[1] - relief.stations[0])) / (relief.rows - 3);
      const roundMm: number = foot.length === 0 ? 0 : ((Math.max(...foot.map((p): number => p[1])) - Math.min(...foot.map((p): number => p[1])) + 1) * AutoMovieLoftRelief.width(relief) * (Number.isFinite(r) ? r : NaN)) / (relief.columns - 3);
      const share: number = foot.length / Math.max(1, (relief.rows - 6) * (relief.columns - 6));
      // The cast at the window's middle against the chart's outward radial direction there.
      const middle: number = relief.phases[0] + AutoMovieLoftRelief.width(relief) / 2;
      const frame = AutoMovieHumanConicLoft.axis(family).at(Math.min(family.knots.at(-1)!, Math.max(family.knots[0]!, sPeak)));
      const e: number[] = AutoMovieLoftRelief.direction(relief, middle)[0];
      const outward: number = [0, 1, 2].reduce((sum: number, k: number): number => sum + e[k]! * (Math.cos(middle) * frame.u[k]! + Math.sin(middle) * frame.v[k]!), 0);
      const inward: boolean = (outward < 0) === (top > 0);
      const sense: string = Math.abs(outward) < 0.3 ? "across (" + outward.toFixed(2) + ")" : inward ? "into the wall" : "out of it";
      const long: boolean = Math.max(alongMm, roundMm) >= 3 * Math.min(alongMm, roundMm);
      const form: string = share >= 0.35 ? "whole face" : long ? (inward ? "groove" : "rim") : inward ? "hollow" : "mound";
      const misfit: boolean = MISFIT.test(relief.name);
      if (misfit) misfitHeights += relief.heights.length;
      carries.push({ net: relief.name, peak: top, station: sPeak, phase: tPeak, share, alongMm, roundMm, sense, form, misfit });
      lines.push("  " + lead(relief.name, 24) + pad(top.toFixed(2), 8) + "  " + lead("(" + sPeak.toFixed(1) + ", " + tPeak.toFixed(3) + ")", 21) + pad((100 * share).toFixed(0) + "%", 6) + pad(alongMm.toFixed(0), 9) + pad(Number.isFinite(roundMm) ? roundMm.toFixed(0) : "?", 9) + "  " + lead(sense, 14) + lead(form, 12) + (misfit ? "yes, " + relief.heights.length + " heights" : ""));
    }
    lines.push("  the nets marked misfit hold " + misfitHeights + " heights.", "");
    json.carries = carries;
    candidates.push({ candidate: "Carry what the misfit nets correct in their walls (inflection lines or a better layout) and drop the nets", saved: misfitHeights, change: "structural", premise: "each wall is refitted to the skin instead of its hull where the net stands, as issue #3412 proposed, and the form reads clean without the net", risk: "a changed wall layout is a planned item of its own (human skill, Repair); every dependent is refitted; the twins among them are already counted as copies", order: 3 });

    // Candidates.
    lines.push("CANDIDATES", "");
    lines.push("  Ranked by numbers saved within each class of geometry change. The savings overlap (a halved net's zero border, a dead row of a");
    lines.push("  twin, a coarser net's half) and must not be added. None was started.", "");
    const classes: string[] = ["none", "bounded, nets and dead ends", "bounded, walls", "structural"];
    for (const order of [0, 1, 2, 3]) {
      lines.push("  Geometry change: " + classes[order]);
      for (const c of candidates.filter((x): boolean => x.order === order).sort((x, y): number => y.saved - x.saved)) {
        lines.push("    " + pad(c.saved, 6) + "  " + c.candidate);
        lines.push("            change: " + c.change);
        lines.push("            exact if: " + c.premise);
        lines.push("            risk: " + c.risk);
      }
      lines.push("");
    }
    json.candidates = candidates;

    const base: string = path.join(root, "test", ".shots", "family-conic-count");
    const out: string = path.join(base, new Date().toISOString().replace(/[:.]/g, "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "survey.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "survey.json"), JSON.stringify(json, null, 1) + "\n");
    process.stdout.write(lines.slice(lines.indexOf("CANDIDATES")).join("\n") + "\nout " + out + "\n");
  }
}
void FamilyConicSurvey.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
