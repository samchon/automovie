import { writeFileSync } from "node:fs";
import { AutoMovieNaturalSpline as S, AutoMovieViewChain as Q } from "@automovie/engine";
import { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * Joint least-squares fit of a whole conic section family on one shared,
 * sparse station knot vector.
 *
 * Every scalar field of `FamilyConicSection` is a natural cubic through its
 * values at the shared knots. A natural cubic is linear in its knot values,
 * so the field vector at station `s` is `C(s) Y` with `C` the cardinal basis.
 * The unknowns are the knot values `Y`, and the residuals are the radial
 * differences between the conic chain and the cut vertices of every observed
 * section. Levenberg-Marquardt (Marquardt 1963, diagonal scaling) minimises
 * them for all sections at once, so no observed section is interpolated and
 * neighbouring sections cannot disagree in correspondence.
 */
export namespace FamilyConicFit {
  /** One observed section in its chart about the family axis. */
  export interface IRow {
    /** Station along the family axis, mm. */
    s: number;

    /** Observed polygon in the section chart, mm. */
    points: C.P[];

    /** Withheld from the fit and read only as validation. */
    heldout: boolean;

    /**
     * Read the radial miss at each vertex as the distance it stands for square to the observed wall: the miss times the cosine between the
     * ray and the wall's normal there. A long thin section (a plate seen across its thickness) is met by the rays near its two ends at a
     * grazing angle, where a tenth of a millimetre across the wall is millimetres along the ray; read radially, those few vertices outweigh
     * the whole of both faces and the fit gives the faces up to them.
     */
    normal?: boolean;

    /** Whether an observed point is invented and not skin (a guided excursion's closure, `FamilyConicExcursion.IPart.guided`). */
    free?: (p: C.P) => boolean;
  }

  /** The fitted family and its sampled errors. */
  export interface IResult {
    /** The anchors every section of the family is read through. */
    layout: C.ILayout;

    /** Shared station knots, mm. */
    knots: number[];

    /** Knot values by field then knot: the complete independent definition. */
    values: number[][];

    /** Sampled radial error at cut vertices of fitting sections, mm. */
    training: IError;

    /** Sampled radial error at cut vertices of withheld sections, mm. */
    heldout: IError;

    /** Maximum sampled radial error per observed section, mm, with the phase where it stands. */
    rows: { s: number; heldout: boolean; maximumMm: number; phase: number; fault: string | null }[];

    /** Maximum sampled radial distance to the faceted polygon's chords over every section, mm: it includes the facets' own sagitta, which the vertex errors do not. */
    chordMaximumMm: number;

    /** Accepted Levenberg-Marquardt steps. */
    iterations: number;

    /** Observed rays that met their polygon more than once (non-star-shaped evidence). */
    folds: number;

    /** Why no family could be fitted, or null. */
    fault: string | null;

    /** Fitting time, ms. */
    milliseconds: number;
  }

  /** Maximum, mean and root-mean-square of sampled absolute radial errors, mm. */
  export interface IError {
    /** Largest sampled absolute radial error, mm. */
    maximumMm: number;

    /** Mean sampled absolute radial error, mm. */
    meanMm: number;

    /** Root mean square of the sampled radial errors, mm. */
    rmsMm: number;
  }

  /** Ridge weight of a share's departure from one half and of an inflection turn's departure from zero, in squared millimetres per squared share and per observation: it only decides directions the observations leave open. */
  const RIDGE: number = 1e-4;

  /** A share is kept inside `[EDGE, 1 - EDGE]` by a barrier residual of `BARRIER_MM` per unit of excess. */
  const EDGE: number = 0.06;

  /** Barrier residual per unit of excess share, mm. */
  const BARRIER_MM: number = 50;

  /** Spacing of the stations at which every candidate must be an admissible chain, mm (`fit`). */
  const DENSE_MM: number = 0.25;

  /** Rounds of fitting the feature lines' headings before the sections (`fit`), and the step their headings are searched in, radians. */
  const LINE_ROUNDS: number = 48;

  /**
   * The least share of its chord at which every arc's two tangent lines must meet ahead of its start and behind its end (`AutoMovieViewChain`'s
   * `a` and `b`), at every dense station, as fitted and as stored. Admissible at zero alone, a fit settles against that wall: f1's armpit slit
   * cutter, fitted with the barrier, held `a` at 0 to 0.05 of the chord over its first sections and `b` at 0.02 over its groove, and the
   * stored family, read by the engine's spline between its stations, was refused ("the tangent lines meet behind the end", `b` -0.006). A part
   * may ask for less (`IPart.margin`) where a tight groove needs it.
   */
  export const ADMISSIBLE_MARGIN: number = 0.1;

  /**
   * The margin a constructed family is held to (`construct`), unless its part asks for another. Its values are read from the section, not
   * pushed against the admissibility wall by a minimisation, so the margin only guards the engine's spline between stations: f1's armpit
   * vault, constructed, met at 0.072 to 0.099 of its chords beside its top, refused at 0.1 and admitted on the native path.
   */
  export const CONSTRUCT_MARGIN: number = 0.02;

  /** `--barrier`: the first barrier weight as a share of the starting misfit per margin, and how many tenfold falls follow it. */
  const BARRIER_SHARE: number = 0.01;
  const BARRIER_LEVELS: number = 4;

  /** `--homotopy`: steps of the path from the start's shape to the skin. */
  const HOMOTOPY_STEPS: number = 4;
  const HEADING_STEP: number = 0.01;

  /** Phases per section used by the chord report. */
  const REPORT: number = 180;

  /** One section's observations: its polygon vertices in polar form with arc-length weights of mean one. */
  interface ISample {
    phases: number[];
    radii: number[];
    weights: number[];

    /** Per vertex, the factor that turns a radial miss into the miss square to the wall (`IRow.normal`); 1 when the row reads radially. */
    across: number[];
  }

  /**
   * Read a section's polygon vertices as observations.
   *
   * The source is a faceted mesh: a cut vertex lies on a mesh edge, close to
   * the intended surface, while the chord between two cut vertices lies
   * inside it by the facet's sagitta (`L^2 / 8R`, 0.6 mm for a 20 mm facet on
   * an 85 mm radius). The fit therefore reads the vertices and never the
   * chords. Each vertex weighs half its two edges, so a cluster of short
   * edges cannot outweigh a long smooth stretch.
   */
  function vertices(row: IRow): ISample {
    const n: number = row.points.length;
    const sample: ISample = { phases: [], radii: [], weights: [], across: [] };
    let total: number = 0;
    for (let k: number = 0; k < n; ++k) {
      const p: C.P = row.points[k]!;
      const a: C.P = row.points[(k + n - 1) % n]!;
      const b: C.P = row.points[(k + 1) % n]!;
      const weight: number = (Math.hypot(p[0] - a[0], p[1] - a[1]) + Math.hypot(b[0] - p[0], b[1] - p[1])) / 2;
      // An invented point (`IRow.free`, a guided excursion's closure) is no observation: it carried 57 % of the nose's summed misfit.
      if (!(weight > 0) || row.free?.(p) === true) continue;
      const radius: number = Math.hypot(p[0], p[1]);
      // The wall's tangent at the vertex is the chord of its two neighbours; the cosine between the ray and the wall's normal is the sine
      // between the ray and that tangent. Held at a twentieth, so a vertex the ray only grazes still counts a little.
      const tangent: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const sine: number = tangent > 0 && radius > 0 ? Math.abs(p[0] * (b[1] - a[1]) - p[1] * (b[0] - a[0])) / (radius * tangent) : 1;
      sample.phases.push(Math.atan2(p[1], p[0]));
      sample.radii.push(radius);
      sample.weights.push(weight);
      sample.across.push(row.normal === true ? Math.max(0.05, sine) : 1);
      total += weight;
    }
    const mean: number = total / sample.weights.length;
    sample.weights = sample.weights.map((w: number): number => w / mean);
    return sample;
  }

  /** One section's misfit to a given family, split between skin and invented points (`misfit`). */
  export interface IMisfit {
    /** The row's station, mm. */
    s: number;

    /** Whether the row was withheld from the fit. */
    heldout: boolean;

    /** Radial misses at the skin's points: their sum, count and largest, mm, and the largest's phase, radians. */
    skin: { sum: number; n: number; max: number; phase: number };

    /** Radial misses at the invented points (`IRow.free`): their sum, count and largest, mm. */
    free: { sum: number; n: number; max: number };

    /** Why the family's chain is refused at this station, or null. */
    fault: string | null;
  }

  /** Station basis of a knot vector: each knot's cardinal natural cubic, read at a station. */
  export function basisOf(knots: readonly number[]): (s: number) => number[] {
    const cardinals: S.ISpline[] = knots.map((_: number, m: number): S.ISpline => S.create([...knots], knots.map((__: number, k: number): number => (k === m ? 1 : 0))));
    return (s: number): number[] => cardinals.map((spline: S.ISpline): number => S.evaluate(spline, s));
  }

  /** A family's section numbers at a station: its knot values read through the knots' basis. */
  export function at(knots: readonly number[], values: readonly (readonly number[])[], s: number): number[] {
    const b: number[] = basisOf(knots)(s);
    return values.map((field: readonly number[]): number => field.reduce((sum: number, y: number, m: number): number => sum + y * b[m]!, 0));
  }

  /**
   * The radial misfit of a given family at every row's observed points, with no fitting: the skin's and the invented points' apart
   * (`IRow.free`), and the worst skin point's phase.
   */
  export function misfit(rows: readonly IRow[], knots: readonly number[], layout: C.ILayout, values: readonly (readonly number[])[]): IMisfit[] {
    const basis = basisOf(knots);
    return rows.map((row: IRow): IMisfit => {
      const b: number[] = basis(row.s);
      const t: number[] = values.map((field: readonly number[]): number => field.reduce((sum: number, y: number, m: number): number => sum + y * b[m]!, 0));
      const section: Q.ISection = C.chain(t, layout);
      const out: IMisfit = { s: row.s, heldout: row.heldout, skin: { sum: 0, n: 0, max: 0, phase: NaN }, free: { sum: 0, n: 0, max: 0 }, fault: section.fault };
      if (section.fault !== null) return out;
      for (const p of row.points) {
        const phi: number = Math.atan2(p[1], p[0]);
        const e: number = Math.abs(Q.radius(section, phi) - Math.hypot(p[0], p[1]));
        if (!Number.isFinite(e)) continue;
        const into = row.free?.(p) === true ? out.free : out.skin;
        into.sum += e;
        ++into.n;
        if (e > into.max) {
          into.max = e;
          if (into === out.skin) out.skin.phase = phi;
        }
      }
      return out;
    });
  }

  /** Every arc's two tangent-meeting distances over unit tangents, as shares of its chord, in chain order (`ADMISSIBLE_MARGIN`). */
  export function meetings(t: readonly number[], layout: C.ILayout): { a: number; b: number }[] {
    const input = C.resolve([...t], layout).input;
    const points: number[][] = input.points as number[][];
    const tangents: number[][] = input.tangents as number[][];
    return points.map((_: number[], j: number): { a: number; b: number } => {
      const [p0, p2, t0, t2] = [points[j]!, points[(j + 1) % points.length]!, tangents[j]!, tangents[(j + 1) % points.length]!];
      const [n0, n2]: number[] = [Math.hypot(t0[0]!, t0[1]!), Math.hypot(t2[0]!, t2[1]!)];
      const [u, w]: number[][] = [[t0[0]! / n0, t0[1]! / n0], [t2[0]! / n2, t2[1]! / n2]];
      const den: number = u[0]! * w[1]! - u[1]! * w[0]!;
      const d: number[] = [p2[0]! - p0[0]!, p2[1]! - p0[1]!];
      const chord: number = Math.hypot(d[0]!, d[1]!) || 1;
      return { a: (d[0]! * w[1]! - d[1]! * w[0]!) / den / chord, b: (u[0]! * d[1]! - u[1]! * d[0]!) / den / chord };
    });
  }

  /**
   * Fit a family.
   *
   * @param rows Observed sections by increasing station.
   * @param knots Shared station knots, increasing, covering the rows.
   * @param layout The anchors of every section.
   * @param power Residual power of the final reweighted passes; 2 is plain least squares, larger values pull the maximum down.
   * @param initial Knot values to start from, by field then knot, for these knots and this depth; absent starts from each section's own reading.
   * @param margin The least share of its chord at which every arc's tangent lines must meet (`ADMISSIBLE_MARGIN`).
   * @param polish Whether to minimise at all; false only reports `initial` as it stands (`construct`).
   */
  export function fit(rows: readonly IRow[], knots: readonly number[], layout: C.ILayout, power: number = 2, initial?: readonly (readonly number[])[], margin: number = ADMISSIBLE_MARGIN, polish: boolean = true): IResult {
    const started: number = performance.now();
    const units: C.Unit[] = C.units(layout);
    const F: number = units.length;
    const free: number[] = units.map((_: C.Unit, f: number): number => f).filter((f: number): boolean => units[f] !== "mm");
    const M: number = knots.length;
    const folds: { count: number } = { count: 0 };
    const train: IRow[] = rows.filter((row: IRow): boolean => !row.heldout);
    const samples: ISample[] = train.map(vertices);
    const cardinals: S.ISpline[] = knots.map((_: number, m: number): S.ISpline => S.create(knots, knots.map((__: number, k: number): number => (k === m ? 1 : 0))));
    const basis = (s: number): number[] => cardinals.map((spline: S.ISpline): number => S.evaluate(spline, s));
    const B: number[][] = train.map((row: IRow): number[] => basis(row.s));
    const failed = (fault: string): IResult => ({ layout, knots: [...knots], values: [], training: NONE, heldout: NONE, rows: [], chordMaximumMm: Infinity, iterations: 0, folds: folds.count, fault, milliseconds: performance.now() - started });

    // `--seeds`: each fitting section's conic conversion (`FamilyConicSection.converted`) over each 100 mm of course: how many ran out of
    // arcs, and the inflections on the +Z side's front quarter (phase 0 to 90 degrees) and back quarter (90 to 180), mean and most, with
    // how many of them turn less than the line ramp's floor (half `FEATURE_LEAST` on either side) and so seed no line.
    // `--sections=<file>`: the fitting sections' stations and polygons, written as JSON, so a section the conversion refuses can be studied
    // apart from the tool. They are the reference's: the file stays in a private scratch folder and is deleted once read.
    const sectionsFile: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--sections="))?.slice("--sections=".length);
    if (sectionsFile !== undefined) writeFileSync(sectionsFile, JSON.stringify({ layout, rows: train.map((row: IRow): { s: number; points: C.P[] } => ({ s: row.s, points: row.points })) }));
    if (process.argv.includes("--seeds")) {
      const stretches: Map<number, { n: number; out: string[]; front: number[]; back: number[]; faint: number }> = new Map();
      for (const row of train) {
        const key: number = Math.floor(row.s / 100) * 100;
        const cell = stretches.get(key) ?? { n: 0, out: [], front: [], back: [], faint: 0 };
        ++cell.n;
        try {
          const ends: C.IEnd[] = C.converted(row.points).ends.filter((end: C.IEnd): boolean => end.inflection);
          const phase = (end: C.IEnd): number => Math.atan2(end.point[1], end.point[0]);
          cell.front.push(ends.filter((end: C.IEnd): boolean => phase(end) >= 0 && phase(end) < Math.PI / 2).length);
          cell.back.push(ends.filter((end: C.IEnd): boolean => phase(end) >= Math.PI / 2).length);
          cell.faint += ends.filter((end: C.IEnd): boolean => phase(end) >= 0 && (end.strength ?? 0) < C.FEATURE_LEAST / 2).length;
        } catch (error) {
          cell.out.push(`${row.s.toFixed(1)}: ${(error as Error).message.replace(/\): Numerical adaptation.*$/, ")")}`);
        }
        stretches.set(key, cell);
      }
      const stat = (x: number[]): string => (x.length === 0 ? "-" : `${(x.reduce((s: number, v: number): number => s + v, 0) / x.length).toFixed(1)}/${Math.max(...x)}`);
      process.stderr.write(
        "conversions by stretch: " +
          [...stretches.entries()]
            .sort((a, b): number => a[0] - b[0])
            .map(([key, cell]): string => `${key}-${key + 100}: ${cell.n} sections, ${cell.out.length} out of arcs${cell.out.length ? ` (first ${cell.out[0]})` : ""}; inflections front ${stat(cell.front)}, back ${stat(cell.back)}, under the ramp's floor ${cell.faint}`)
            .join(" | ") +
          "\n",
      );
    }

    // Start from each section's own geometric reading, projected onto the shared knots by linear least squares.
    // The sections' own seeds, in station order, their feature lines tracked along the stations (`FamilyConicSection.seedAll`).
    const seeds: number[][] = C.seedAll(train.map((row: IRow): readonly C.P[] => row.points), layout);
    // A feature's heading is an angle read on each section alone; carried along the stations it is unwrapped onto one branch, so the
    // projection onto the knots does not average two readings a turn apart.
    for (let f: number = 0; f < F; ++f) {
      if (units[f] !== "angle") continue;
      for (let i: number = 1; i < seeds.length; ++i) {
        const previous: number = seeds[i - 1]![f]!;
        while (seeds[i]![f]! - previous > Math.PI) seeds[i]![f]! -= 2 * Math.PI;
        while (seeds[i]![f]! - previous < -Math.PI) seeds[i]![f]! += 2 * Math.PI;
      }
    }
    const gram: number[][] = zeros(M, M);
    for (const b of B) for (let m: number = 0; m < M; ++m) for (let n: number = 0; n < M; ++n) gram[m]![n]! += b[m]! * b[n]!;
    let Y: number[][] = [];
    for (let f: number = 0; f < F; ++f) {
      const right: number[] = new Array<number>(M).fill(0);
      for (let i: number = 0; i < train.length; ++i) for (let m: number = 0; m < M; ++m) right[m]! += B[i]![m]! * seeds[i]![f]!;
      const solved: number[] | null = solve(gram.map((r: number[]): number[] => [...r]), right);
      if (solved === null) return failed("the knot vector is not supported by the observed stations");
      Y.push(solved);
    }
    if (initial !== undefined) Y = initial.map((field: readonly number[]): number[] => [...field]);

    // Residuals of one section: radial misses at its vertices, then one barrier entry per share; null when its chain is inadmissible.
    const theta = (values: number[][], b: number[]): number[] => values.map((field: number[]): number => field.reduce((sum: number, y: number, m: number): number => sum + y * b[m]!, 0));
    const residual = (t: number[], i: number): number[] | null => {
      const section: Q.ISection = C.chain(t, layout);
      if (section.fault !== null) return null;
      const sample: ISample = samples[i]!;
      const r: number[] = new Array<number>(sample.phases.length);
      for (let k: number = 0; k < sample.phases.length; ++k) {
        const value: number = (Q.radius(section, sample.phases[k]!) - sample.radii[k]!) * sample.across[k]!;
        if (!Number.isFinite(value)) return null;
        r[k] = value;
      }
      for (const f of free) r.push(units[f] === "share" ? BARRIER_MM * (Math.max(0, EDGE - t[f]!) + Math.max(0, t[f]! - (1 - EDGE))) : 0);
      return r;
    };
    for (const sample of samples) for (let k: number = 0; k < free.length; ++k) sample.weights.push(1);
    const weights: number[][] = samples.map((sample: ISample): number[] => [...sample.weights]);
    const rest = (f: number): number => (units[f] === "share" ? 0.5 : 0);
    // Every station the family spans must be an admissible chain, not only the fitted ones: the construction realizes the family at its own
    // layers and the engine reads between them, and a candidate admissible only at the observed stations was refused there (an arc whose
    // tangent lines meet behind its end, a phase that does not advance). Checked every `DENSE_MM` from the first knot to the last.
    const dense: number[][] = [];
    for (let s: number = knots[0]!; s <= knots[M - 1]! + 1e-9; s += DENSE_MM) dense.push(basis(Math.min(s, knots[M - 1]!)));
    // The family is stored as rounded text (`FamilyConicBody`: millimetres to 0.01, shares and angles to 1e-4) and realized from it, so a
    // candidate must be admissible as stored as well: on the hand's end a feature's heading within 5e-5 of its neighbour extreme's axis
    // rounded to exactly parallel, the median between them fell on its chord and the engine refused the stored wall (`a` of 0 at 448 mm).
    const stored = (values: number[][]): number[][] => values.map((field: number[], f: number): number[] => field.map((y: number): number => (units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4)));
    const meeting = (t: number[]): number => {
      const least: number = Math.min(...leastMeetings(t, layout));
      return Number.isFinite(least) ? least : -Infinity;
    };
    // Every share strictly inside (0, 1) as the engine reads it, unclamped: the share barrier (`EDGE`) is a residual, not a wall, and f1's
    // slit cutter, fitted on the corrected trunk, stored a shoulder whose spline between knots fell to -0.010 ("shoulder outside (0, 1)").
    const shares: number[] = units.map((unit: C.Unit, f: number): number => (unit === "share" ? f : -1)).filter((f: number): boolean => f >= 0);
    const inside = (t: number[]): boolean => shares.every((f: number): boolean => t[f]! > 0 && t[f]! < 1);
    const admissible = (values: number[][]): boolean => {
      const rounded: number[][] = stored(values);
      return dense.every((b: number[]): boolean => C.chain(theta(values, b), layout).fault === null && C.chain(theta(rounded, b), layout).fault === null && meeting(theta(values, b)) >= margin && meeting(theta(rounded, b)) >= margin && inside(theta(values, b)) && inside(theta(rounded, b)));
    };
    // `--barrier`: an interior-point term over the same stations (Nocedal and Wright, ch. 19). A barrier must guard the very region the
    // acceptance test defines, so a chain's margins are exactly what `admissible` asks to be positive: every step of its points' phase
    // round the course, radians, with the turn's remainder; every least tangent meeting of its arcs less the fit's `margin` (the quantity
    // `leastMeetings` measures, so the barrier and the check read one definition); and every share and one less every share.
    // `-mu sum log(margin)` is added at every station, so a candidate moves freely inside the admissible region and never crosses its wall;
    // `mu` falls over rounds toward the plain fit. The stored rounding stays the acceptance test alone: a barrier cannot be smooth across a
    // rounding, and a step that keeps every margin positive with the barrier's slack passes it in practice. Guarding the raw meeting
    // distances instead, the barrier held the lined trunk off a wall that never refused it while every step crossed the meeting share of
    // 0.1 at its crotch end (0.115 at the start) and was refused there.
    const margins = (t: number[]): number[] | null => {
      const input = C.resolve(t, layout).input;
      const points: number[][] = input.points as number[][];
      const K: number = points.length;
      const out: number[] = [];
      const phases: number[] = [];
      for (let j: number = 0; j < K; ++j) {
        let phi: number = Math.atan2(points[j]![1]!, points[j]![0]!);
        while (j > 0 && phi <= phases[j - 1]!) phi += 2 * Math.PI;
        phases.push(phi);
        if (j > 0) out.push(phi - phases[j - 1]!);
      }
      out.push(phases[0]! + 2 * Math.PI - phases[K - 1]!);
      for (const least of leastMeetings(t, layout)) out.push(least - margin);
      for (const f of shares) out.push(t[f]!, 1 - t[f]!);
      return out.every(Number.isFinite) ? out : null;
    };
    let mu: number = 0;
    const barrier = (values: number[][]): number | null => {
      let sum: number = 0;
      for (const b of dense) {
        const m: number[] | null = margins(theta(values, b));
        if (m === null || m.some((x: number): boolean => !(x > 0))) return null;
        for (const x of m) sum -= mu * Math.log(x);
      }
      return sum;
    };
    const cost = (values: number[][]): { total: number; residuals: number[][] } | null => {
      if (!admissible(values)) return null;
      let total: number = 0;
      if (mu > 0) {
        const kept: number | null = barrier(values);
        if (kept === null) return null;
        total += kept;
      }
      const residuals: number[][] = [];
      for (let i: number = 0; i < train.length; ++i) {
        const t: number[] = theta(values, B[i]!);
        const r: number[] | null = residual(t, i);
        if (r === null) return null;
        for (let k: number = 0; k < r.length; ++k) total += weights[i]![k]! * r[k]! * r[k]!;
        for (const f of free) total += RIDGE * r.length * (t[f]! - rest(f)) ** 2;
        residuals.push(r);
      }
      return { total, residuals };
    };
    // Feature lines first (`AutoMovieHumanConicSection` kind `f`), as conic lofting draws its control lines before its sections: each
    // feature's position along the stations is the projection of its sections' own readings, and its heading is fitted to the heading
    // nearest its reading, at every `DENSE_MM` station, with which both its arcs are conics, so the held lines make a seed admissible at every
    // station. The sections' other numbers are then fitted with the lines held (`held`).
    const featured: number[] = layout.anchors.map((_: C.IAnchor, k: number): number => k).filter((k: number): boolean => layout.anchors[k]!.kind === "f");
    const held: Set<number> = new Set<number>();
    if (featured.length > 0 && initial === undefined) {
      const { at }: { at: number[]; shoulders: number } = C.offsets(layout);
      for (const k of featured) for (let j: number = 0; j < 3; ++j) held.add(at[k]! + j);
      // A station still refused weighs more in the next round, so the heading lines bend toward where their arcs are conics.
      const stationWeight: number[] = dense.map((): number => 1);
      for (let round: number = 0; round < LINE_ROUNDS && !admissible(Y); ++round) {
        dense.forEach((b: number[], d: number): void => {
          if (C.chain(theta(Y, b), layout).fault !== null) stationWeight[d]! *= 4;
        });
        const denseGram: number[][] = zeros(M, M);
        dense.forEach((b: number[], d: number): void => {
          for (let m: number = 0; m < M; ++m) for (let n: number = 0; n < M; ++n) denseGram[m]![n]! += stationWeight[d]! * b[m]! * b[n]!;
        });
        const targets: number[][] = featured.map((): number[] => []);
        const places: number[][][] = featured.map((): number[][] => [[], []]);
        for (const b of dense) {
          const values: number[] = theta(Y, b);
          const input = C.resolve(values, layout).input;
          const points: number[][] = input.points as number[][];
          const tangents: number[][] = input.tangents as number[][];
          const n: number = points.length;
          let previous: number = 0;
          featured.forEach((k: number, j: number): void => {
            if (k === 0 || layout.anchors[k - 1]!.kind !== "f") previous = 0;
            const [before, after]: [number, number] = [(k + n - 1) % n, (k + 1) % n];
            // The feature's frame (`AutoMovieHumanConicSection.frame`): its numbers are read on that chord.
            const [from, to]: [number, number] = C.frame(k, layout);
            const chord: number = Math.atan2(points[to]![1]! - points[from]![1]!, points[to]![0]! - points[from]![0]!);
            const reading: number = chord + values[at[k]! + 2]!;
            let chosen: number | null = null;
            // Only headings within a quarter turn of the reading, as the seed's search (`FamilyConicSection.seed`): past that the tangent runs
            // against the chain's direction of travel.
            for (let step: number = 0; step * HEADING_STEP < Math.PI / 2; ++step) {
              const tried: number[] = step === 0 ? [reading] : [reading + step * HEADING_STEP, reading - step * HEADING_STEP];
              const found: number | undefined = tried.find((h: number): boolean => {
                const d: number[] = [Math.cos(h), Math.sin(h)];
                return C.arc(points[before]!, tangents[before]!, points[k]!, d, margin) && C.arc(points[k]!, d, points[after]!, tangents[after]!, margin);
              });
              if (found === undefined) continue;
              chosen = found;
              break;
            }
            // Where no heading makes both arcs conics, the feature stands too near its neighbours' chord for its turn: it is drawn a third
            // of the way toward that chord's middle, along the chord, and its line follows it there in the next round.
            let place: number[] = points[k]!;
            if (chosen === null) {
              const middle: number[] = [(points[before]![0]! + points[after]![0]!) / 2, (points[before]![1]! + points[after]![1]!) / 2];
              place = [place[0]! + (middle[0]! - place[0]!) / 3, place[1]! + (middle[1]! - place[1]!) / 3];
              chosen = Math.atan2(points[after]![1]! - points[before]![1]!, points[after]![0]! - points[before]![0]!);
              points[k] = place;
            }
            tangents[k] = [Math.cos(chosen), Math.sin(chosen)];
            const read: { values: [number, number, number]; t: number } = C.unplace(points[from] as C.P, points[to] as C.P, place as C.P, chosen, previous);
            previous = C.along(previous, read.values[0]);
            targets[j]!.push(read.values[2]);
            places[j]![0]!.push(read.values[0]);
            places[j]![1]!.push(read.values[1]);
          });
        }
        const project = (field: number, target: number[]): void => {
          const right: number[] = new Array<number>(M).fill(0);
          dense.forEach((b: number[], d: number): void => {
            for (let m: number = 0; m < M; ++m) right[m]! += stationWeight[d]! * b[m]! * target[d]!;
          });
          const solved: number[] | null = solve(denseGram.map((r: number[]): number[] => [...r]), right);
          if (solved !== null) Y[field] = solved;
        };
        featured.forEach((k: number, j: number): void => {
          project(at[k]!, places[j]![0]!);
          project(at[k]! + 1, places[j]![1]!);
          project(at[k]! + 2, targets[j]!);
        });
      }
    }
    // `--seeds` with `--seed-stations=<s>,...`: at each listed station, the held lines' chain and the nearest fitting section's own seed,
    // each anchor by its chain index, layout anchor and kind at its chart point, and the chain's refusal (`AutoMovieViewChain.of`).
    const listed: number[] = (process.argv.find((a: string): boolean => a.startsWith("--seed-stations="))?.slice("--seed-stations=".length) ?? "").split(",").filter((x: string): boolean => x.length > 0).map(Number);
    if (process.argv.includes("--seeds") && listed.length > 0) {
      const K: number = layout.anchors.length;
      const describe = (t: number[]): string => {
        const points = C.resolve(t, layout).input.points;
        return points.map((p, j: number): string => {
          const k: number = j < K ? j : K - 2 - (j - K);
          const anchor = layout.anchors[k]!;
          return `${j}=a${k}${anchor.kind}${anchor.kind === "f" ? ":" + (anchor.feature ?? "") : anchor.mid === true ? ":mid" : ""}(${p[0]!.toFixed(1)},${p[1]!.toFixed(1)})`;
        }).join(" ");
      };
      for (const s of listed) {
        const d: number = Math.max(0, Math.min(dense.length - 1, Math.round((s - knots[0]!) / DENSE_MM)));
        const t: number[] = theta(Y, dense[d]!);
        process.stderr.write(`held lines at ${s}: ${C.chain(t, layout).fault ?? "admitted"}\n  ${describe(t)}\n`);
        const i: number = train.reduce((b: number, row: IRow, j: number): number => (Math.abs(row.s - s) < Math.abs(train[b]!.s - s) ? j : b), 0);
        const own: number[] = seeds[i]!;
        process.stderr.write(`own seed at ${train[i]!.s}: ${C.chain(own, layout).fault ?? "admitted"}\n  ${describe(own)}\n`);
      }
    }
    if (process.argv.includes("--seeds")) {
      const refused: string[] = dense.map((b: number[], d: number): string => { const fault: string | null = C.chain(theta(Y, b), layout).fault; return fault === null ? "" : (knots[0]! + d * DENSE_MM).toFixed(2) + ": " + fault.slice(0, 120); }).filter((x: string): boolean => x.length > 0);
      process.stderr.write("lines held: " + refused.length + " of " + dense.length + " stations refused" + (refused.length === 0 ? "" : "; first " + refused[0] + "; last " + refused.at(-1)) + "\n");
      // And by stretch of the course, 100 mm at a time, with each stretch's first fault, so a refusal is placed by region.
      const stretches: Map<number, { count: number; total: number; first: string }> = new Map();
      dense.forEach((b: number[], d: number): void => {
        const s: number = knots[0]! + d * DENSE_MM;
        const key: number = Math.floor(s / 100) * 100;
        const entry = stretches.get(key) ?? { count: 0, total: 0, first: "" };
        entry.total++;
        const fault: string | null = C.chain(theta(Y, b), layout).fault;
        if (fault !== null) {
          entry.count++;
          if (entry.first === "") entry.first = s.toFixed(1) + ": " + fault.slice(0, 90);
        }
        stretches.set(key, entry);
      });
      process.stderr.write("lines held by stretch: " + [...stretches.entries()].map(([key, e]): string => `${key}-${key + 100}: ${e.count}/${e.total}${e.first === "" ? "" : " (" + e.first + ")"}`).join(" | ") + "\n");
    }
    let current: { total: number; residuals: number[][] } | null = cost(Y);
    // A projection of sections' own seeds onto few knots can leave stations whose chain is no conic chain, where features appear and
    // fade along the part. One section's seed held at every knot is the same admissible chain at every station; the joint fit starts from
    // it, sections nearest the middle first, and the admissibility of every station is kept on the way.
    if (current === null && initial === undefined)
      for (const i of train.map((_: IRow, i: number): number => i).sort((a: number, b: number): number => Math.abs(a - train.length / 2) - Math.abs(b - train.length / 2))) {
        const flat: number[][] = seeds[i]!.map((value: number): number[] => new Array<number>(M).fill(value));
        const tried: { total: number; residuals: number[][] } | null = cost(flat);
        if (tried === null) continue;
        Y = flat;
        current = tried;
        break;
      }
    if (current === null) {
      // `--seeds`: which sections' own seeds and projected seeds are admissible chains, by station, so a refused seed is placed.
      if (process.argv.includes("--seeds"))
        process.stderr.write(
          "first refused seed: " + (train.map((row: IRow, i: number): string => (C.chain(seeds[i]!, layout).fault === null ? "" : row.s.toFixed(1) + " " + C.chain(seeds[i]!, layout).fault + " values " + seeds[i]!.map((x: number): string => x.toFixed(2)).join(","))).find((x: string): boolean => x.length > 0) ?? "none") + "\n" +
          "seeds: " + train.map((row: IRow, i: number): string => row.s.toFixed(1) + (C.chain(seeds[i]!, layout).fault === null ? "+" : "-") + (C.chain(theta(Y, B[i]!), layout).fault === null ? "+" : "-")).join(" ") + "\n",
        );
      return failed("the projected seed is not an admissible conic chain on every fitting section");
    }

    // `--seeds`: the start's smallest admissibility margins over each 100 mm of course, named by the margin and arc they belong to.
    if (process.argv.includes("--seeds")) {
      const named: Map<number, { value: number; what: string }> = new Map();
      dense.forEach((b: number[], d: number): void => {
        const s: number = knots[0]! + d * DENSE_MM;
        const t: number[] = theta(Y, b);
        const m: number[] | null = margins(t);
        const K: number = C.resolve(t, layout).input.points.length;
        const key: number = Math.floor(s / 100) * 100;
        const entry = named.get(key) ?? { value: Infinity, what: "" };
        if (m === null) {
          entry.value = -Infinity;
          entry.what = `${s.toFixed(1)}: margins not finite`;
        } else
          m.forEach((v: number, j: number): void => {
            if (v >= entry.value) return;
            entry.value = v;
            const L: number = leastMeetings(t, layout).length;
            const name: string = j < K ? `phase step after point ${j} (rad)` : j < K + L ? `least meeting ${j - K} less the margin` : `share field ${shares[Math.floor((j - K - L) / 2)]} ${(j - K - L) % 2 === 0 ? "above 0" : "below 1"}`;
            entry.what = `${s.toFixed(1)}: ${name} = ${v.toExponential(3)}; meeting ${meeting(t).toFixed(3)} against the margin ${margin}`;
          });
        named.set(key, entry);
      });
      process.stderr.write("start's smallest margins by stretch: " + [...named.entries()].map(([k, e]): string => `${k}-${k + 100}: ${e.what}`).join(" | ") + "\n");
    }
    // Levenberg-Marquardt with a finite-difference section Jacobian chained through the linear station basis.
    const steps: number[] = Array.from({ length: F }, (_: unknown, f: number): number => (units[f] === "mm" ? 1e-4 : 1e-6));
    let lambda: number = 1e-3;
    let iterations: number = 0;
    const refusedSteps: { inadmissible: number; rounding: number; barrier: number; residual: number; worse: number; singular: number; where: Map<number, number> } = { inadmissible: 0, rounding: 0, barrier: 0, residual: 0, worse: 0, singular: 0, where: new Map() };
    // `--homotopy`: the fit travels from the shape it starts from to the skin along a path of targets (Allgower and Georg), each section's
    // radii blended from the start's own (t = 0) to the observed ones (t = 1) in `HOMOTOPY_STEPS` steps, each step starting from the last
    // solution, so a start the admissible region holds far from the skin is carried to it without a jump across the region's wall.
    const skinRadii: number[][] = samples.map((sample: ISample): number[] => [...sample.radii]);
    const startRadii: number[][] = samples.map((sample: ISample, i: number): number[] => {
      const section: Q.ISection = C.chain(theta(Y, B[i]!), layout);
      return sample.phases.map((phi: number, k: number): number => (section.fault === null ? Q.radius(section, phi) : skinRadii[i]![k]!));
    });
    const homotopy: number[] = !polish ? [] : process.argv.includes("--homotopy") ? Array.from({ length: HOMOTOPY_STEPS }, (_: unknown, k: number): number => (k + 1) / HOMOTOPY_STEPS) : [1];
    // `--release`: once the sections are fitted with the feature lines held, one more stage at the skin fits every number together, the
    // lines too, as block coordinate descent ends in a joint step; the lines start where they were drawn and are free to move only as far
    // as the admissible region (and with `--barrier`, its barrier) lets them.
    const stages: { along: number; release: boolean }[] = [...homotopy.map((along: number) => ({ along, release: false })), ...(polish && held.size > 0 && process.argv.includes("--release") ? [{ along: 1, release: true }] : [])];
    for (const { along, release } of stages) {
    if (release) held.clear();
    samples.forEach((sample: ISample, i: number): void => {
      sample.radii = skinRadii[i]!.map((r: number, k: number): number => startRadii[i]![k]! + along * (r - startRadii[i]![k]!));
    });
    if (stages.length > 1) {
      const again: { total: number; residuals: number[][] } | null = cost(Y);
      if (again === null) break;
      current = again;
    }    // With `--barrier`, every pass runs at falling barrier weights: the first is a share of the starting misfit spread over the margins,
    // and each next a tenth of the last, so the solution travels inside the admissible region toward the plain least-squares fit.
    const barrierLevels: number[] = [0];
    if (process.argv.includes("--barrier") && current !== null) {
      // The first weight is read from the start's own margins (Nocedal and Wright, ch. 19, on initialising mu): the first barrier term,
      // `mu sum |log m|`, is `BARRIER_SHARE` of the data term. Spread evenly over the number of margins instead, a start near the region's
      // wall at many stations (large `|log m|`) took a barrier many times its misfit and was pushed toward the region's centre: f1's nose
      // went from 1.1 to 5.9 to 11.4 mm at each knot inserted.
      let logs: number = 0;
      for (const b of dense) for (const m of margins(theta(Y, b)) ?? []) logs += Math.abs(Math.log(m));
      const start: number = (BARRIER_SHARE * current.total) / Math.max(logs, 1);
      barrierLevels.splice(0, 1, ...Array.from({ length: BARRIER_LEVELS }, (_: unknown, k: number): number => start / 10 ** k), 0);
    }
    const passes: number = power > 2 ? 3 : 1;
    for (const level of barrierLevels) {
    const before: number = iterations;
    for (let pass: number = 0; pass < passes; ++pass) {
      if (mu !== level) {
        mu = level;
        const again: { total: number; residuals: number[][] } | null = cost(Y);
        if (again === null) break;
        current = again;
        lambda = 1e-3;
      }
      if (pass > 0) {
        // Reweight toward the p-norm (Lawson-style): larger residuals gain weight, pulling the maximum down.
        let peak: number = 0;
        for (const r of current.residuals) for (const v of r) peak = Math.max(peak, Math.abs(v));
        for (let i: number = 0; i < train.length; ++i) for (let k: number = 0; k < weights[i]!.length; ++k) weights[i]![k] = samples[i]!.weights[k]! * Math.max(1e-3, Math.abs(current.residuals[i]![k]!) / peak) ** (power - 2);
        current = cost(Y)!;
        lambda = 1e-3;
      }
      for (let round: number = 0; round < 60; ++round) {
        const N: number = F * M;
        const JTJ: number[][] = zeros(N, N);
        const JTr: number[] = new Array<number>(N).fill(0);
        for (let i: number = 0; i < train.length; ++i) {
          const t: number[] = theta(Y, B[i]!);
          const r: number[] = current.residuals[i]!;
          const P: number = r.length;
          const D: number[][] = [];
          for (let f: number = 0; f < F; ++f) {
            const moved: number[] = [...t];
            moved[f]! += steps[f]!;
            const shifted: number[] | null = residual(moved, i);
            D.push(shifted === null ? new Array<number>(P).fill(0) : shifted.map((v: number, k: number): number => (v - r[k]!) / steps[f]!));
          }
          const w: number[] = weights[i]!;
          const b: number[] = B[i]!;
          for (let f: number = 0; f < F; ++f) {
            const ridge: number = units[f] === "mm" ? 0 : RIDGE * P;
            let gr: number = ridge * (t[f]! - rest(f));
            for (let k: number = 0; k < P; ++k) gr += w[k]! * D[f]![k]! * r[k]!;
            for (let m: number = 0; m < M; ++m) JTr[f * M + m]! += gr * b[m]!;
            for (let g: number = f; g < F; ++g) {
              let dd: number = g === f ? ridge : 0;
              for (let k: number = 0; k < P; ++k) dd += w[k]! * D[f]![k]! * D[g]![k]!;
              if (dd === 0) continue;
              for (let m: number = 0; m < M; ++m) {
                if (b[m] === 0) continue;
                const row: number[] = JTJ[f * M + m]!;
                for (let n: number = 0; n < M; ++n) row[g * M + n]! += dd * b[m]! * b[n]!;
              }
            }
          }
        }
        // The barrier's gradient and its Gauss-Newton Hessian, (mu / m^2) dm dm^T, at every station.
        if (mu > 0)
          for (const b of dense) {
            const t: number[] = theta(Y, b);
            const m: number[] | null = margins(t);
            if (m === null) continue;
            const D: number[][] = [];
            for (let f: number = 0; f < F; ++f) {
              const moved: number[] = [...t];
              moved[f]! += steps[f]!;
              const shifted: number[] | null = margins(moved);
              D.push(shifted === null ? new Array<number>(m.length).fill(0) : shifted.map((v: number, j: number): number => (v - m[j]!) / steps[f]!));
            }
            for (let f: number = 0; f < F; ++f) {
              let gr: number = 0;
              for (let j: number = 0; j < m.length; ++j) gr -= (mu / m[j]!) * D[f]![j]!;
              for (let q: number = 0; q < M; ++q) JTr[f * M + q]! += gr * b[q]!;
              for (let g: number = f; g < F; ++g) {
                let dd: number = 0;
                for (let j: number = 0; j < m.length; ++j) dd += (mu / (m[j]! * m[j]!)) * D[f]![j]! * D[g]![j]!;
                if (dd === 0) continue;
                for (let q: number = 0; q < M; ++q) {
                  if (b[q] === 0) continue;
                  const row: number[] = JTJ[f * M + q]!;
                  for (let n: number = 0; n < M; ++n) row[g * M + n]! += dd * b[q]! * b[n]!;
                }
              }
            }
          }        for (let a: number = 0; a < N; ++a) for (let c: number = 0; c < a; ++c) JTJ[a]![c] = JTJ[c]![a]!;
        let accepted: boolean = false;
        let converged: boolean = false;
        for (let attempt: number = 0; attempt < 12 && !accepted; ++attempt) {
          const A: number[][] = JTJ.map((row: number[], a: number): number[] => {
            const copy: number[] = [...row];
            copy[a] = row[a]! * (1 + lambda) + 1e-12 + (held.has(Math.floor(a / M)) ? 1e12 : 0);
            return copy;
          });
          const delta: number[] | null = solve(A, JTr.map((v: number): number => -v));
          if (delta === null) ++refusedSteps.singular;
          if (delta !== null) {
            const next: number[][] = Y.map((field: number[], f: number): number[] => field.map((y: number, m: number): number => y + delta[f * M + m]!));
            const trial: { total: number; residuals: number[][] } | null = cost(next);
            // `--seeds`: why each trial step is refused, counted by the code path that refuses it (`admissible` at the dense stations, the
            // barrier, a fitting section's residual) or because it does not lower the cost.
            if (trial === null) {
              if (!admissible(next)) {
                ++refusedSteps.inadmissible;
                // Refused only as stored: every raw station admissible, a rounded one not.
                if (dense.every((b: number[]): boolean => C.chain(theta(next, b), layout).fault === null && meeting(theta(next, b)) >= margin && inside(theta(next, b)))) ++refusedSteps.rounding;
                const at: number = dense.findIndex((b: number[]): boolean => C.chain(theta(next, b), layout).fault !== null);
                if (at >= 0) refusedSteps.where.set(Math.floor((knots[0]! + at * DENSE_MM) / 100) * 100, (refusedSteps.where.get(Math.floor((knots[0]! + at * DENSE_MM) / 100) * 100) ?? 0) + 1);
              } else if (mu > 0 && barrier(next) === null) ++refusedSteps.barrier;
              else ++refusedSteps.residual;
            } else if (!(trial.total < current.total)) ++refusedSteps.worse;
            if (trial !== null && trial.total < current.total) {
              converged = (current.total - trial.total) / current.total < 1e-6;
              Y = next;
              current = trial;
              lambda = Math.max(lambda / 3, 1e-9);
              accepted = true;
              ++iterations;
              break;
            }
          }
          lambda *= 4;
        }
        if (!accepted || converged) break;
      }
    }
    if (process.argv.includes("--seeds")) process.stderr.write(`barrier level ${level.toExponential(3)}: ${iterations - before} steps accepted, cost ${current.total.toExponential(4)}\n`);
    }

    }

    if (process.argv.includes("--seeds"))
      process.stderr.write(`steps refused: ${refusedSteps.inadmissible} inadmissible at a dense station (${refusedSteps.rounding} of them only as stored; first faulty station by stretch: ${[...refusedSteps.where.entries()].map(([s, c]): string => s + ":" + c).join(" ")}), ${refusedSteps.barrier} by the barrier, ${refusedSteps.residual} by a fitting section's residual, ${refusedSteps.worse} not lowering the cost, ${refusedSteps.singular} singular; ${iterations} accepted; ${held.size} of ${F} fields held\n`);
    // Report at the cut vertices of fitting and withheld sections, and against the chords on an independent phase grid.
    const report: number[] = Array.from({ length: REPORT }, (_: unknown, k: number): number => (2 * Math.PI * (k + 0.5)) / REPORT);
    const evidence: IResult["rows"] = [];
    let chord: number = 0;
    const sums: Record<"train" | "held", { max: number; sum: number; square: number; n: number }> = { train: { max: 0, sum: 0, square: 0, n: 0 }, held: { max: 0, sum: 0, square: 0, n: 0 } };
    for (const row of rows) {
      const section: Q.ISection = C.chain(theta(Y, basis(row.s)), layout);
      let maximum: number = section.fault === null ? 0 : Infinity;
      let worst: number = NaN;
      const into = sums[row.heldout ? "held" : "train"];
      if (section.fault === null) {
        const sample: ISample = vertices(row);
        for (let k: number = 0; k < sample.phases.length; ++k) {
          const e: number = Math.abs(Q.radius(section, sample.phases[k]!) - sample.radii[k]!) * sample.across[k]!;
          if (e > maximum) worst = sample.phases[k]!;
          maximum = Math.max(maximum, e);
          into.sum += e;
          into.square += e * e;
          ++into.n;
        }
        for (const phi of report) chord = Math.max(chord, Math.abs(Q.radius(section, phi) - C.radius(row.points, phi, folds)));
      }
      into.max = Math.max(into.max, maximum);
      evidence.push({ s: row.s, heldout: row.heldout, maximumMm: maximum, phase: worst, fault: section.fault });
    }
    const summary = (v: { max: number; sum: number; square: number; n: number }): IError => ({ maximumMm: v.max, meanMm: v.sum / Math.max(1, v.n), rmsMm: Math.sqrt(v.square / Math.max(1, v.n)) });
    return { layout, knots: [...knots], values: Y, training: summary(sums.train), heldout: summary(sums.held), rows: evidence, chordMaximumMm: chord, iterations, folds: folds.count, fault: null, milliseconds: performance.now() - started };
  }

  /** Carry a family to another knot vector by reading every field at the new knots. */
  export function resample(values: readonly (readonly number[])[], from: readonly number[], to: readonly number[]): number[][] {
    return values.map((field: readonly number[]): number[] => {
      const spline: S.ISpline = S.create(from, field);
      return to.map((s: number): number => S.evaluate(spline, s));
    });
  }

  /** Carry a limb family of the given depth one median level deeper, knot by knot, through `FamilyConicSection.refine`. */
  export function refine(values: readonly (readonly number[])[], depth: number): number[][] {
    const M: number = values[0]!.length;
    const columns: number[][] = Array.from({ length: M }, (_: unknown, m: number): number[] => C.refine(values.map((field: readonly number[]): number => field[m]!), depth));
    return columns[0]!.map((_: number, f: number): number[] => columns.map((column: number[]): number => column[f]!));
  }

  /** Each arc's lesser tangent-meeting distance over unit tangents, as a share of its chord, by arc: what `ADMISSIBLE_MARGIN` holds. */
  export function leastMeetings(t: readonly number[], layout: C.ILayout): number[] {
    const input = C.resolve([...t], layout).input;
    const points: number[][] = input.points as number[][];
    const tangents: number[][] = input.tangents as number[][];
    return points.map((_: number[], j: number): number => {
      const [p0, p2, t0, t2] = [points[j]!, points[(j + 1) % points.length]!, tangents[j]!, tangents[(j + 1) % points.length]!];
      const [n0, n2]: number[] = [Math.hypot(t0[0]!, t0[1]!), Math.hypot(t2[0]!, t2[1]!)];
      const [u, w]: number[][] = [[t0[0]! / n0, t0[1]! / n0], [t2[0]! / n2, t2[1]! / n2]];
      const den: number = u[0]! * w[1]! - u[1]! * w[0]!;
      const d: number[] = [p2[0]! - p0[0]!, p2[1]! - p0[1]!];
      const chord: number = Math.hypot(d[0]!, d[1]!);
      const least: number = Math.min((d[0]! * w[1]! - d[1]! * w[0]!) / den / chord, (u[0]! * d[1]! - u[1]! * d[0]!) / den / chord);
      return Number.isFinite(least) ? least : -Infinity;
    });
  }

  /** A family constructed by rule (`construct`), or where it is refused. */
  export interface IConstruction {
    /** The constructed family reported against every observed section, or a result whose fault names the refusal. */
    result: IResult;

    /** Stations whose own constructed section is no admissible chain under the margin. */
    sections: number[];

    /** Why each refused section and the first refused dense stations are refused: the chain's fault, or the arc whose tangent meeting falls under the margin and its share. */
    reasons: string[];

    /** Dense stations, every `DENSE_MM`, where the smoothed family is no admissible chain under the margin. */
    stations: number[];
  }

  /**
   * Construct a family by rule, with no minimisation (a draughtsman's construction): each fitting section's fields read from its own
   * polygon in closed form (`FamilyConicSection.seed`: each anchor at its extreme or the skin's inflection, with its tangent, and each
   * arc's shoulder from the skin point on the arc's median line, `rho = |MS| / |MA|`), then every field carried along the stations by a
   * linear least-squares natural cubic on the given knots, headings unwrapped first. The smoothed family is then held to the same
   * admissibility as a fit, every `DENSE_MM` and as stored; a refused station is reported, not repaired.
   *
   * @param rows Observed sections by increasing station.
   * @param knots Station knots, increasing, covering the rows.
   * @param layout The anchors of every section.
   * @param margin The least share of its chord at which every arc's tangent lines must meet.
   */
  export function construct(rows: readonly IRow[], knots: readonly number[], layout: C.ILayout, margin: number = ADMISSIBLE_MARGIN): IConstruction {
    const started: number = performance.now();
    const units: C.Unit[] = C.units(layout);
    const train: IRow[] = rows.filter((row: IRow): boolean => !row.heldout);
    const own: number[][] = train.map((row: IRow): number[] => C.seed(row.points, layout));
    const lesser = (t: number[]): number[] => meetings(t, layout).map((m: { a: number; b: number }): number => (Number.isFinite(m.a) && Number.isFinite(m.b) ? Math.min(m.a, m.b) : -Infinity));
    const holds = (t: number[]): boolean => C.chain(t, layout).fault === null && Math.min(...lesser(t)) >= margin;
    const sections: number[] = train.filter((_: IRow, i: number): boolean => !holds(own[i]!)).map((row: IRow): number => row.s);
    const why = (t: number[]): string => {
      const fault: string | null = C.chain(t, layout).fault;
      if (fault !== null) return fault;
      const m: number[] = lesser(t);
      const j: number = m.indexOf(Math.min(...m));
      return "arc " + j + " meets at " + m[j]!.toFixed(3);
    };
    const reasons: string[] = train.map((row: IRow, i: number): string | null => (holds(own[i]!) ? null : "section " + row.s + ": " + why(own[i]!))).filter((x: string | null): x is string => x !== null);
    for (let f: number = 0; f < units.length; ++f) {
      if (units[f] !== "angle") continue;
      for (let i: number = 1; i < own.length; ++i) {
        while (own[i]![f]! - own[i - 1]![f]! > Math.PI) own[i]![f]! -= 2 * Math.PI;
        while (own[i]![f]! - own[i - 1]![f]! < -Math.PI) own[i]![f]! += 2 * Math.PI;
      }
    }
    const M: number = knots.length;
    const cardinals: S.ISpline[] = knots.map((_: number, m: number): S.ISpline => S.create([...knots], knots.map((__: number, k: number): number => (k === m ? 1 : 0))));
    const basis = (s: number): number[] => cardinals.map((c: S.ISpline): number => S.evaluate(c, s));
    const B: number[][] = train.map((row: IRow): number[] => basis(row.s));
    const gram: number[][] = zeros(M, M);
    for (const b of B) for (let m: number = 0; m < M; ++m) for (let n: number = 0; n < M; ++n) gram[m]![n]! += b[m]! * b[n]!;
    const values: number[][] = [];
    for (let f: number = 0; f < units.length; ++f) {
      const right: number[] = new Array<number>(M).fill(0);
      for (let i: number = 0; i < train.length; ++i) for (let m: number = 0; m < M; ++m) right[m]! += B[i]![m]! * own[i]![f]!;
      const solved: number[] | null = solve(gram.map((r: number[]): number[] => [...r]), right);
      if (solved === null) return { result: { layout, knots: [...knots], values: [], training: NONE, heldout: NONE, rows: [], chordMaximumMm: Infinity, iterations: 0, folds: 0, fault: "the knot vector is not supported by the observed stations", milliseconds: performance.now() - started }, sections, reasons, stations: [] };
      values.push(solved);
    }
    const stored = (y: number, f: number): number => (units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4);
    const stations: number[] = [];
    for (let s: number = knots[0]!; s <= knots[M - 1]! + 1e-9; s += DENSE_MM) {
      const b: number[] = basis(Math.min(s, knots[M - 1]!));
      const t: number[] = values.map((field: number[]): number => field.reduce((sum: number, y: number, m: number): number => sum + y * b[m]!, 0));
      if (!holds(t) || !holds(t.map(stored))) {
        if (stations.length < 6) reasons.push("station " + s + ": " + why(holds(t) ? t.map(stored) : t));
        stations.push(s);
      }
    }
    if (stations.length > 0) return { result: { layout, knots: [...knots], values, training: NONE, heldout: NONE, rows: [], chordMaximumMm: Infinity, iterations: 0, folds: 0, fault: "the constructed family is no admissible chain at " + stations.length + " stations", milliseconds: performance.now() - started }, sections, reasons, stations };
    return { result: fit(rows, knots, layout, 2, values, margin, false), sections, reasons, stations };
  }

  /** Where a stored family's misfit comes from, section by section (`decompose`). */
  export interface IDecomposition {
    /** By observed section, in the order given. */
    rows: {
      /** Station, mm. */
      s: number;

      /** The stored family's largest and mean radial miss at the section's vertices, mm, and the phase of the largest, radians. */
      joint: { maximumMm: number; meanMm: number; phase: number };

      /** The section fitted alone under the same admissibility: the layout's own capacity. Null where no admissible fit was found. */
      alone: { maximumMm: number; meanMm: number; least: number } | null;

      /** The alone fits' values projected onto 1, 2 and 4 times the stored knots and read back at this station: the knots' capacity. */
      longitudinal: { maximumMm: number; meanMm: number; admissible: boolean }[];

      /** Mean radial miss of the stored family at the section's invented points and at its skin points, mm, and the invented points' share of the vertex weight. */
      weighting: { inventedMm: number; skinMm: number; share: number } | null;
    }[];

    /** At every dense station of the stored family, each arc whose tangent-meeting share stands within `slack` of the margin, and each share field within `slack` of its edge. */
    binding: { s: number; kind: "meeting" | "share"; index: number; value: number }[];
  }

  /**
   * Decompose a stored family's misfit into its sources (Nocedal and Wright's active-set view): what the layout can do on each section
   * alone, what the knots can carry of those per-section fits, which admissibility constraints are active at the stored optimum, and how
   * the misfit splits between invented points and skin.
   *
   * @param rows Observed sections by increasing station.
   * @param stored The stored family's knots and values.
   * @param layout The family's layout.
   * @param margin The admissibility margin it was fitted under.
   * @param invented By row, which of its points are invented (not skin), or null where all are skin.
   */
  export function decompose(rows: readonly IRow[], stored: { knots: readonly number[]; values: readonly (readonly number[])[] }, layout: C.ILayout, margin: number, invented: readonly (readonly boolean[] | null)[]): IDecomposition {
    const units: C.Unit[] = C.units(layout);
    const read = (knots: readonly number[], values: readonly (readonly number[])[], s: number): number[] => values.map((field: readonly number[]): number => S.evaluate(S.create([...knots], [...field]), Math.max(knots[0]!, Math.min(knots.at(-1)!, s))));
    const misses = (t: number[], row: IRow): number[] | null => {
      const section: Q.ISection = C.chain(t, layout);
      if (section.fault !== null) return null;
      return row.points.map((p: C.P): number => Math.abs(Q.radius(section, Math.atan2(p[1], p[0])) - Math.hypot(p[0], p[1])));
    };
    const summary = (e: number[] | null): { maximumMm: number; meanMm: number } => (e === null ? { maximumMm: Infinity, meanMm: Infinity } : { maximumMm: Math.max(...e), meanMm: e.reduce((a: number, b: number): number => a + b, 0) / e.length });

    // Each section alone: two copies one millimetre apart on their own two knots, so the fit holds one section at every station.
    const alone: (number[] | null)[] = rows.map((row: IRow): number[] | null => {
      const copy: IRow = { ...row, heldout: false };
      const result: IResult = fit([copy, { ...copy, s: row.s + 1 }], [row.s, row.s + 1], layout, 2, undefined, margin);
      return result.fault === null ? result.values.map((field: number[]): number => field[0]!) : null;
    });
    // Those per-section fields projected onto a knot vector by linear least squares over the sections that have one, headings unwrapped.
    const kept: number[] = rows.map((_: IRow, i: number): number => i).filter((i: number): boolean => alone[i] !== null);
    for (let f: number = 0; f < units.length; ++f) {
      if (units[f] !== "angle") continue;
      for (let k: number = 1; k < kept.length; ++k) {
        const previous: number = alone[kept[k - 1]!]![f]!;
        while (alone[kept[k]!]![f]! - previous > Math.PI) alone[kept[k]!]![f]! -= 2 * Math.PI;
        while (alone[kept[k]!]![f]! - previous < -Math.PI) alone[kept[k]!]![f]! += 2 * Math.PI;
      }
    }
    const project = (knots: number[]): number[][] | null => {
      const M: number = knots.length;
      const cardinals: S.ISpline[] = knots.map((_: number, m: number): S.ISpline => S.create(knots, knots.map((__: number, k: number): number => (k === m ? 1 : 0))));
      const B: number[][] = kept.map((i: number): number[] => cardinals.map((c: S.ISpline): number => S.evaluate(c, rows[i]!.s)));
      const gram: number[][] = zeros(M, M);
      for (const b of B) for (let m: number = 0; m < M; ++m) for (let n: number = 0; n < M; ++n) gram[m]![n]! += b[m]! * b[n]!;
      const values: number[][] = [];
      for (let f: number = 0; f < units.length; ++f) {
        const right: number[] = new Array<number>(M).fill(0);
        kept.forEach((i: number, k: number): void => {
          for (let m: number = 0; m < M; ++m) right[m]! += B[k]![m]! * alone[i]![f]!;
        });
        const solved: number[] | null = solve(gram.map((r: number[]): number[] => [...r]), right);
        if (solved === null) return null;
        values.push(solved);
      }
      return values;
    };
    const finer = (knots: readonly number[]): number[] => knots.flatMap((k: number, i: number): number[] => (i === 0 ? [k] : [(knots[i - 1]! + k) / 2, k]));
    const vectors: number[][] = [[...stored.knots], finer(stored.knots), finer(finer(stored.knots))];
    const projected: (number[][] | null)[] = vectors.map(project);

    const out: IDecomposition["rows"] = rows.map((row: IRow, i: number): IDecomposition["rows"][number] => {
      const joint: number[] | null = misses(read(stored.knots, stored.values, row.s), row);
      const worst: number = joint === null ? -1 : joint.indexOf(Math.max(...joint));
      const own: number[] | null = alone[i] === null ? null : misses(alone[i]!, row);
      const flags: readonly boolean[] | null = invented[i] ?? null;
      let weighting: IDecomposition["rows"][number]["weighting"] = null;
      if (joint !== null && flags !== null && flags.length === row.points.length) {
        const n: number = row.points.length;
        const weight: number[] = row.points.map((p: C.P, k: number): number => {
          const [a, b]: C.P[] = [row.points[(k + n - 1) % n]!, row.points[(k + 1) % n]!];
          return (Math.hypot(p[0] - a[0], p[1] - a[1]) + Math.hypot(b[0] - p[0], b[1] - p[1])) / 2;
        });
        const mean = (pick: boolean): number => {
          const ks: number[] = joint.map((_: number, k: number): number => k).filter((k: number): boolean => flags[k] === pick);
          return ks.length === 0 ? 0 : ks.reduce((sum: number, k: number): number => sum + joint[k]!, 0) / ks.length;
        };
        const total: number = weight.reduce((a: number, b: number): number => a + b, 0);
        weighting = { inventedMm: mean(true), skinMm: mean(false), share: weight.reduce((sum: number, w: number, k: number): number => sum + (flags[k] ? w : 0), 0) / total };
      }
      return {
        s: row.s,
        joint: { ...summary(joint), phase: worst < 0 ? NaN : Math.atan2(row.points[worst]![1], row.points[worst]![0]) },
        alone: own === null ? null : { ...summary(own), least: Math.min(...leastMeetings(alone[i]!, layout)) },
        longitudinal: projected.map((values: number[][] | null, v: number): { maximumMm: number; meanMm: number; admissible: boolean } => {
          if (values === null) return { maximumMm: Infinity, meanMm: Infinity, admissible: false };
          const t: number[] = read(vectors[v]!, values, row.s);
          const e: number[] | null = misses(t, row);
          return { ...summary(e), admissible: e !== null && Math.min(...leastMeetings(t, layout)) >= margin };
        }),
        weighting,
      };
    });

    // The constraints active at the stored optimum, every `DENSE_MM` over its knots.
    const slack: number = 0.02;
    const binding: IDecomposition["binding"] = [];
    for (let s: number = stored.knots[0]!; s <= stored.knots.at(-1)! + 1e-9; s += DENSE_MM) {
      const t: number[] = read(stored.knots, stored.values, s);
      leastMeetings(t, layout).forEach((m: number, j: number): void => {
        if (m < margin + slack) binding.push({ s, kind: "meeting", index: j, value: m });
      });
      t.forEach((v: number, f: number): void => {
        if (units[f] === "share" && (v < EDGE + slack || v > 1 - EDGE - slack)) binding.push({ s, kind: "share", index: f, value: v });
      });
    }
    return { rows: out, binding };
  }

  /** An error record for a result that holds no family. */
  const NONE: IError = { maximumMm: Infinity, meanMm: Infinity, rmsMm: Infinity };

  /** A rows-by-columns zero matrix. */
  function zeros(rows: number, columns: number): number[][] {
    return Array.from({ length: rows }, (): number[] => new Array<number>(columns).fill(0));
  }

  /** Solve a symmetric positive-definite system by Cholesky factorisation in place; null when it is not positive definite. */
  export function solve(A: number[][], b: number[]): number[] | null {
    const n: number = b.length;
    for (let j: number = 0; j < n; ++j) {
      const row: number[] = A[j]!;
      let d: number = row[j]!;
      for (let k: number = 0; k < j; ++k) d -= row[k]! * row[k]!;
      if (!(d > 0)) return null;
      const root: number = Math.sqrt(d);
      row[j] = root;
      for (let i: number = j + 1; i < n; ++i) {
        const other: number[] = A[i]!;
        let v: number = other[j]!;
        for (let k: number = 0; k < j; ++k) v -= other[k]! * row[k]!;
        other[j] = v / root;
      }
    }
    const x: number[] = [...b];
    for (let i: number = 0; i < n; ++i) {
      let v: number = x[i]!;
      for (let k: number = 0; k < i; ++k) v -= A[i]![k]! * x[k]!;
      x[i] = v / A[i]![i]!;
    }
    for (let i: number = n - 1; i >= 0; --i) {
      let v: number = x[i]!;
      for (let k: number = i + 1; k < n; ++k) v -= A[k]![i]! * x[k]!;
      x[i] = v / A[i]![i]!;
    }
    return x;
  }
}
