import {
  AutoMovieBernstein64,
  orientAutoMovieSolidChart,
  rootsAutoMovieViewPolynomial,
  refineAutoMovieQuadraticProgram,
  solveAutoMovieQuadraticProgram,
  AutoMovieViewChain as Q,
  AutoMovieNaturalSpline as S,
  AutoMovieSolidVector as V,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionComposedEnd,
  IAutoMovieNaturalCubicSpline,
  IAutoMovieQuadraticRow,
  IAutoMovieViewChain,
} from "@automovie/interface";
import { writeFileSync } from "node:fs";

import { FamilyConicLoft as K } from "./FamilyConicLoft";
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

    /** Directed pieces of an open observation. `points` holds the same measured vertices. */
    runs?: readonly (readonly C.P[])[];

    /** An independently admitted complete section, used only to initialize an open observation. */
    seed?: readonly number[];

    /** The fairing cutoff its section is converted at to seed the fit, mm (`FamilyConicSection.converted`); absent, the trunk's `FAIR_MM`. */
    fairMm?: number;

    /** Phase spans, counterclockwise from-to, where the section closes across its part's opening rather than following skin; no extreme anchor is read there. */
    opening?: [number, number][];

    /** Withheld from the fit and read only as validation. */
    heldout: boolean;

    /**
     * Read the radial miss at each vertex as the distance it stands for square to the observed wall: the miss times the cosine between the
     * ray and the wall's normal there. A long thin section (a plate seen across its thickness) is met by the rays near its two ends at a
     * grazing angle, where a tenth of a millimetre across the wall is millimetres along the ray; read radially, those few vertices outweigh
     * the whole of both faces and the fit gives the faces up to them.
     */
    normal?: boolean;

    /** Whether a polygon point has no observed skin reading. */
    free?: (p: C.P) => boolean;

    /** Actual buried samples that constrain side. Absent, the free points retain their existing meaning. */
    buried?: (p: C.P) => boolean;

    /**
     * With `free`, how far a chart point stands on the parent's side of the part's opening, mm (`FamilyConicBody`, `IPart.opening`): the
     * wall at each invented point's phase is held at -0.5 mm or more there by a one-sided barrier, and the point is no observation.
     */
    side?: (p: C.P) => number;
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
    rows: {
      s: number;
      heldout: boolean;
      maximumMm: number;
      phase: number;
      fault: string | null;
    }[];

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

  /** `--adaptive-knots`: the start's knots placed from the data (`adaptiveKnots`), and refused own seeds left out of the projection. */
  const ADAPTIVE: boolean = process.argv.includes("--adaptive-knots");

  /** `--lines-start`: the start derived from the anchors' lines in physical coordinates (`linesStart`). */
  const LINES_START: boolean = process.argv.includes("--lines-start");

  /**
   * How near a section's own admitted seed the start must stand, mm, read as the largest radial difference between the two chains along
   * 72 rays: twice the 0.5 mm the trunk's stored wall reached (`FamilyConicBody`), so the start stands near its data but need not fit it.
   */
  const SEED_NEAR_MM: number = 1;

  /** The least spacing of the start's knots, mm: the fitting sections' own (2 mm), below which a knot has no section of its own. */
  const KNOT_LEAST_MM: number = 2;
  /** Rounds of fitting the feature lines' headings before the sections (`fit`), and the step their headings are searched in, radians. */
  const LINE_ROUNDS: number = 48;

  /**
   * ESTIMATE: use an interior chord share for each tangent meeting, leaving interpolation room between admitted sample sections. A part can declare its own geometric margin.
   */
  export const ADMISSIBLE_MARGIN: number = 0.1;

  /**
   * ESTIMATE: directly constructed families use a smaller margin because the controls have no optimizer pushing them against the bound. A part can declare a different margin.
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

    /** The phases of the invented points held on the parent's side (`IRow.side`), radians, and that side's measure. */
    held: { phases: number[]; side: ((p: C.P) => number) | null };
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
    const sample: ISample = {
      phases: [],
      radii: [],
      weights: [],
      across: [],
      held: { phases: [], side: row.side ?? null },
    };
    let total: number = 0;
    for (const points of row.runs ?? [row.points])
      for (let k: number = 0; k < points.length; ++k) {
      const n: number = points.length;
      const p: C.P = points[k]!;
      const a: C.P = row.runs === undefined ? points[(k + n - 1) % n]! : (points[k - 1] ?? p);
      const b: C.P = row.runs === undefined ? points[(k + 1) % n]! : (points[k + 1] ?? p);
      const weight: number =
        (Math.hypot(p[0] - a[0], p[1] - a[1]) +
          Math.hypot(b[0] - p[0], b[1] - p[1])) /
        2;
      // An invented point (`IRow.free`, a guided excursion's closure) is no observation: it carried 57 % of the nose's summed misfit. With
      // `IRow.side` its phase is kept, where the wall is held on the parent's side instead.
      const free: boolean = row.free?.(p) === true;
      if (row.side !== undefined && (row.buried?.(p) ?? free))
        sample.held.phases.push(Math.atan2(p[1], p[0]));
      if (!(weight > 0) || free) continue;
      const radius: number = Math.hypot(p[0], p[1]);
      // The wall's tangent at the vertex is the chord of its two neighbours; the cosine between the ray and the wall's normal is the sine
      // between the ray and that tangent. Held at a twentieth, so a vertex the ray only grazes still counts a little.
      const tangent: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const sine: number =
        tangent > 0 && radius > 0
          ? Math.abs(p[0] * (b[1] - a[1]) - p[1] * (b[0] - a[0])) /
            (radius * tangent)
          : 1;
      sample.phases.push(Math.atan2(p[1], p[0]));
      sample.radii.push(radius);
      sample.weights.push(weight);
      sample.across.push(row.normal === true ? Math.max(0.05, sine) : 1);
      total += weight;
    }
    const mean: number = total / sample.weights.length;
    sample.weights = [
      ...sample.weights.map((w: number): number => w / mean),
      ...sample.held.phases.map((): number => 1),
    ];
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
    const cardinals: IAutoMovieNaturalCubicSpline[] = knots.map(
      (_: number, m: number): IAutoMovieNaturalCubicSpline =>
        S.create(
          [...knots],
          knots.map((__: number, k: number): number => (k === m ? 1 : 0)),
        ),
    );
    return (s: number): number[] =>
      cardinals.map((spline: IAutoMovieNaturalCubicSpline): number =>
        S.evaluate(spline, s),
      );
  }

  /** A family's section numbers at a station: its knot values read through the knots' basis. */
  export function at(
    knots: readonly number[],
    values: readonly (readonly number[])[],
    s: number,
  ): number[] {
    const b: number[] = basisOf(knots)(s);
    return values.map((field: readonly number[]): number =>
      field.reduce(
        (sum: number, y: number, m: number): number => sum + y * b[m]!,
        0,
      ),
    );
  }

  /**
   * The radial misfit of a given family at every row's observed points, with no fitting: the skin's and the invented points' apart
   * (`IRow.free`), and the worst skin point's phase.
   */
  export function misfit(
    rows: readonly IRow[],
    knots: readonly number[],
    layout: C.ILayout,
    values: readonly (readonly number[])[],
  ): IMisfit[] {
    const basis = basisOf(knots);
    return rows.map((row: IRow): IMisfit => {
      const b: number[] = basis(row.s);
      const t: number[] = values.map((field: readonly number[]): number =>
        field.reduce(
          (sum: number, y: number, m: number): number => sum + y * b[m]!,
          0,
        ),
      );
      const section: IAutoMovieViewChain.ISection = C.chain(t, layout);
      const out: IMisfit = {
        s: row.s,
        heldout: row.heldout,
        skin: { sum: 0, n: 0, max: 0, phase: NaN },
        free: { sum: 0, n: 0, max: 0 },
        fault: section.fault,
      };
      if (section.fault !== null) return out;
      for (const p of row.points) {
        const phi: number = Math.atan2(p[1], p[0]);
        const e: number = Math.abs(
          Q.radius(section, phi) - Math.hypot(p[0], p[1]),
        );
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
  export function meetings(
    t: readonly number[],
    layout: C.ILayout,
  ): { a: number; b: number }[] {
    const input = C.resolve([...t], layout).input;
    const points: number[][] = input.points as number[][];
    const tangents: number[][] = input.tangents as number[][];
    return points.map((_: number[], j: number): { a: number; b: number } => {
      const [p0, p2, t0, t2] = [
        points[j]!,
        points[(j + 1) % points.length]!,
        tangents[j]!,
        tangents[(j + 1) % points.length]!,
      ];
      const [n0, n2]: number[] = [
        Math.hypot(t0[0]!, t0[1]!),
        Math.hypot(t2[0]!, t2[1]!),
      ];
      const [u, w]: number[][] = [
        [t0[0]! / n0, t0[1]! / n0],
        [t2[0]! / n2, t2[1]! / n2],
      ];
      const den: number = u[0]! * w[1]! - u[1]! * w[0]!;
      const d: number[] = [p2[0]! - p0[0]!, p2[1]! - p0[1]!];
      const chord: number = Math.hypot(d[0]!, d[1]!) || 1;
      return {
        a: (d[0]! * w[1]! - d[1]! * w[0]!) / den / chord,
        b: (u[0]! * d[1]! - u[1]! * d[0]!) / den / chord,
      };
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
   * @param polish Whether to minimise at all; false only reports the supplied starting fields.
   * @param tail Optional full-knot constraint and initializer. With this route, only observed proximal rows are fitted.
   */
  export function fit(
    rows: readonly IRow[],
    given: readonly number[],
    layout: C.ILayout,
    power: number = 2,
    initial?: readonly (readonly number[])[],
    margin: number = ADMISSIBLE_MARGIN,
    polish: boolean = true,
    tail?: K.ITailFit,
    admitStart?: (values: number[][]) => string | null,
  ): IResult {
    const started: number = performance.now();
    const units: C.Unit[] = C.units(layout);
    const F: number = units.length;
    const free: number[] = units
      .map((_: C.Unit, f: number): number => f)
      .filter((f: number): boolean => units[f] !== "mm");
    const folds: { count: number } = { count: 0 };
    const train: IRow[] = rows.filter((row: IRow): boolean => !row.heldout && (
      row.runs === undefined
        ? row.points.some((p: C.P): boolean => row.free?.(p) !== true)
        : row.runs.some((run: readonly C.P[]): boolean => run.filter((p: C.P): boolean => row.free?.(p) !== true).length >= 2)
    ));
    // The sections' own seeds, in station order, their feature lines tracked along the stations (`FamilyConicSection.seedAll`). A feature's
    // heading is an angle read on each section alone; carried along the stations it is unwrapped onto one branch, so the projection onto
    // the knots does not average two readings a turn apart.
    const seeds: number[][] = tail === undefined ? ownSeeds(train, layout, margin) : [];
    for (let f: number = 0; f < F; ++f) {
      if (units[f] !== "angle") continue;
      for (let i: number = 1; i < seeds.length; ++i) {
        const previous: number = seeds[i - 1]![f]!;
        while (seeds[i]![f]! - previous > Math.PI) seeds[i]![f]! -= 2 * Math.PI;
        while (seeds[i]![f]! - previous < -Math.PI)
          seeds[i]![f]! += 2 * Math.PI;
      }
    }
    // `--adaptive-knots`: the start's knots placed from the data (`adaptiveKnots`), and a section whose own seed is refused left out of the
    // projection as an outlier.
    const seedWeights: number[] = seeds.map((t: number[]): number =>
      !ADAPTIVE || C.chain(t, layout).fault === null ? 1 : 0,
    );
    const knots: number[] =
      ADAPTIVE && initial === undefined && tail === undefined
        ? adaptiveKnots(
            train,
            seeds,
            seedWeights,
            [given[0]!, given[given.length - 1]!],
            layout,
            margin,
          )
        : [...given];
    const M: number = knots.length;
    const samples: ISample[] = train.map(vertices);
    const failed = (fault: string): IResult => ({
      layout,
      knots: [...knots],
      values: [],
      training: NONE,
      heldout: NONE,
      rows: [],
      chordMaximumMm: Infinity,
      iterations: 0,
      folds: folds.count,
      fault,
      milliseconds: performance.now() - started,
    });
    if (M < 2 || knots.some((s: number, k: number): boolean => !Number.isFinite(s) || (k > 0 && !(s > knots[k - 1]!))))
      return failed("the initial station knots are not finite and strictly increasing");
    const variables: number = tail?.free.length ?? M;
    if (tail !== undefined && (tail.knots.length !== M || tail.knots.some((s: number, i: number): boolean => s !== knots[i]) ||
        tail.initial.length !== F || initial !== undefined || train.some((row: IRow): boolean => row.s >= tail.mark)))
      return failed("the held-tail solver needs its exact knots, initializer and observed prefix");
    if (new Set(train.map((row: IRow): number => row.s)).size < variables)
      return failed(`the knot vector is not supported by the observed stations (${train.length} training rows for ${variables} variable knots)`);
    const basis = basisOf(knots);
    const B: number[][] = train.map((row: IRow): number[] => basis(row.s));
    const variableBasis = (full: number[]): number[] => tail?.basis(full) ?? full;

    // `--seeds`: each fitting section's conic conversion (`FamilyConicSection.converted`) over each 100 mm of course: how many ran out of
    // arcs, and the inflections on the +Z side's front quarter (phase 0 to 90 degrees) and back quarter (90 to 180), mean and most, with
    // how many of them turn less than the line ramp's floor (half `FEATURE_LEAST` on either side) and so seed no line.
    // `--sections=<file>`: the fitting sections' stations and polygons, written as JSON, so a section the conversion refuses can be studied
    // apart from the tool. They are the reference's: the file stays in a private scratch folder and is deleted once read.
    const sectionsFile: string | undefined = process.argv
      .find((a: string): boolean => a.startsWith("--sections="))
      ?.slice("--sections=".length);
    if (sectionsFile !== undefined)
      writeFileSync(
        sectionsFile,
        JSON.stringify({
          layout,
          rows: train.map(
            (
              row: IRow,
            ): { s: number; points: C.P[]; opening?: [number, number][] } => ({
              s: row.s,
              points: row.points,
              ...(row.opening === undefined ? {} : { opening: row.opening }),
            }),
          ),
        }),
      );
    if (process.argv.includes("--seeds")) {
      const stretches: Map<
        number,
        {
          n: number;
          out: string[];
          front: number[];
          back: number[];
          faint: number;
        }
      > = new Map();
      for (const row of train) {
        const key: number = Math.floor(row.s / 100) * 100;
        const cell = stretches.get(key) ?? {
          n: 0,
          out: [],
          front: [],
          back: [],
          faint: 0,
        };
        ++cell.n;
        try {
          const ends: C.IEnd[] = C.converted(row.points).ends.filter(
            (end: C.IEnd): boolean => end.inflection,
          );
          const phase = (end: C.IEnd): number =>
            Math.atan2(end.point[1], end.point[0]);
          cell.front.push(
            ends.filter(
              (end: C.IEnd): boolean =>
                phase(end) >= 0 && phase(end) < Math.PI / 2,
            ).length,
          );
          cell.back.push(
            ends.filter((end: C.IEnd): boolean => phase(end) >= Math.PI / 2)
              .length,
          );
          cell.faint += ends.filter(
            (end: C.IEnd): boolean =>
              phase(end) >= 0 && (end.strength ?? 0) < C.FEATURE_LEAST / 2,
          ).length;
        } catch (error) {
          cell.out.push(
            `${row.s.toFixed(1)}: ${(error as Error).message.replace(/\): Numerical adaptation.*$/, ")")}`,
          );
        }
        stretches.set(key, cell);
      }
      const stat = (x: number[]): string =>
        x.length === 0
          ? "-"
          : `${(x.reduce((s: number, v: number): number => s + v, 0) / x.length).toFixed(1)}/${Math.max(...x)}`;
      process.stderr.write(
        "conversions by stretch: " +
          [...stretches.entries()]
            .sort((a, b): number => a[0] - b[0])
            .map(
              ([key, cell]): string =>
                `${key}-${key + 100}: ${cell.n} sections, ${cell.out.length} out of arcs${cell.out.length ? ` (first ${cell.out[0]})` : ""}; inflections front ${stat(cell.front)}, back ${stat(cell.back)}, under the ramp's floor ${cell.faint}`,
            )
            .join(" | ") +
          "\n",
      );
    }

    // Start from each section's own geometric reading, projected onto the shared knots by linear least squares.
    const gram: number[][] = zeros(variables, variables);
    B.forEach((full: number[], i: number): void => {
      const b: number[] = variableBasis(full);
      const weight: number = tail === undefined ? seedWeights[i]! : 1;
      for (let m: number = 0; m < variables; ++m)
        for (let n: number = 0; n < variables; ++n)
          gram[m]![n]! += weight * b[m]! * b[n]!;
    });
    let Y: number[][] = [];
    if (tail === undefined) {
      for (let f: number = 0; f < F; ++f) {
        const right: number[] = new Array<number>(M).fill(0);
        for (let i: number = 0; i < train.length; ++i)
          for (let m: number = 0; m < M; ++m)
            right[m]! += seedWeights[i]! * B[i]![m]! * seeds[i]![f]!;
        const solved: number[] | null = solve(
          gram.map((r: number[]): number[] => [...r]),
          right,
        );
        if (solved === null)
          return failed("the knot vector is not supported by the observed stations");
        Y.push(solved);
      }
      if (initial !== undefined)
        Y = initial.map((field: readonly number[]): number[] => [...field]);
    } else {
      if (solve(gram.map((r: number[]): number[] => [...r]), new Array<number>(variables).fill(0)) === null)
        return failed("the measured training stations do not support the independent held-tail prefix");
      Y = tail.initial.map((field: number[]): number[] => [...field]);
    }
    // `--lines-start`: the start is the projection of the field vectors derived from the anchors' lines (`linesStart`), refused when any
    // dense station's derived vector is.
    if (LINES_START && initial === undefined && tail === undefined) {
      const lined: { at: (s: number) => number[]; refused: number } =
        linesStart(train, seeds, layout, margin, knots[0]!, knots[M - 1]!);
      // `--lines-dump=<file>`: the derived field vectors at the `--seed-stations` stations, with the layout, as JSON, to draw.
      const linesDump: string | undefined = process.argv
        .find((a: string): boolean => a.startsWith("--lines-dump="))
        ?.slice("--lines-dump=".length);
      const listedStations: number[] = (
        process.argv
          .find((a: string): boolean => a.startsWith("--seed-stations="))
          ?.slice("--seed-stations=".length) ?? ""
      )
        .split(",")
        .filter((x: string): boolean => x.length > 0)
        .map(Number);
      if (linesDump !== undefined)
        writeFileSync(
          linesDump,
          JSON.stringify({
            layout,
            stations: listedStations.map(
              (s: number): { s: number; values: number[] } => ({
                s,
                values: lined.at(s),
              }),
            ),
          }),
        );
      if (lined.refused > 0)
        return failed(
          `the lines' start is refused at ${lined.refused} dense stations`,
        );
      const derived: number[][] = train.map((row: IRow): number[] =>
        lined.at(row.s),
      );
      const lineGram: number[][] = zeros(M, M);
      for (const b of B)
        for (let m: number = 0; m < M; ++m)
          for (let n: number = 0; n < M; ++n) lineGram[m]![n]! += b[m]! * b[n]!;
      Y = [];
      for (let f: number = 0; f < F; ++f) {
        const right: number[] = new Array<number>(M).fill(0);
        for (let i: number = 0; i < train.length; ++i)
          for (let m: number = 0; m < M; ++m)
            right[m]! += B[i]![m]! * derived[i]![f]!;
        const solved: number[] | null = solve(
          lineGram.map((r: number[]): number[] => [...r]),
          right,
        );
        if (solved === null)
          return failed(
            "the knot vector is not supported by the observed stations",
          );
        Y.push(solved);
      }
    }

    // Residuals of one section: radial misses at its vertices, then one barrier entry per share; null when its chain is inadmissible.
    const theta = (values: number[][], b: number[]): number[] =>
      values.map((field: number[]): number =>
        field.reduce(
          (sum: number, y: number, m: number): number => sum + y * b[m]!,
          0,
        ),
      );
    const residual = (t: number[], i: number): number[] | null => {
      const section: IAutoMovieViewChain.ISection = C.chain(t, layout);
      if (section.fault !== null) return null;
      const sample: ISample = samples[i]!;
      const r: number[] = new Array<number>(sample.phases.length);
      for (let k: number = 0; k < sample.phases.length; ++k) {
        const value: number =
          (Q.radius(section, sample.phases[k]!) - sample.radii[k]!) *
          sample.across[k]!;
        if (!Number.isFinite(value)) return null;
        r[k] = value;
      }
      // The wall at each held invented point's phase stays on the parent's side of the opening (`IRow.side` at least -0.5 mm), a one-sided
      // barrier as the shares' below: the closure is an inequality, not an observation.
      const side: ((p: C.P) => number) | null = sample.held.side;
      for (const phi of sample.held.phases) {
        const radius: number = Q.radius(section, phi);
        if (!Number.isFinite(radius)) return null;
        r.push(
          side === null
            ? 0
            : BARRIER_MM *
                Math.max(
                  0,
                  -0.5 - side([radius * Math.cos(phi), radius * Math.sin(phi)]),
                ),
        );
      }
      for (const f of free)
        r.push(
          units[f] === "share"
            ? BARRIER_MM *
                (Math.max(0, EDGE - t[f]!) + Math.max(0, t[f]! - (1 - EDGE)))
            : 0,
        );
      return r;
    };
    for (const sample of samples)
      for (let k: number = 0; k < free.length; ++k) sample.weights.push(1);
    const weights: number[][] = samples.map((sample: ISample): number[] => [
      ...sample.weights,
    ]);
    const rest = (f: number): number => (units[f] === "share" ? 0.5 : 0);
    // Every station the family spans must be an admissible chain, not only the fitted ones: the construction realizes the family at its own
    // layers and the engine reads between them, and a candidate admissible only at the observed stations was refused there (an arc whose
    // tangent lines meet behind its end, a phase that does not advance). Checked every `DENSE_MM` from the first knot to the last.
    const dense: number[][] = [];
    const denseEnd: number = tail === undefined ? knots[M - 1]! : tail.mark;
    for (let s: number = knots[0]!; s <= denseEnd + 1e-9; s += DENSE_MM)
      dense.push(basis(Math.min(s, denseEnd)));
    if (tail !== undefined) dense.push(basis(denseEnd));
    // The family is stored as rounded text (`FamilyConicBody`: millimetres to 0.01, shares and angles to 1e-4) and realized from it, so a
    // candidate must be admissible as stored as well: on the hand's end a feature's heading within 5e-5 of its neighbour extreme's axis
    // rounded to exactly parallel, the median between them fell on its chord and the engine refused the stored wall (`a` of 0 at 448 mm).
    const stored = (values: number[][]): number[][] =>
      tail !== undefined ? values : values.map((field: number[], f: number): number[] =>
        field.map((y: number): number =>
          units[f] === "mm"
            ? Math.round(y * 100) / 100
            : Math.round(y * 1e4) / 1e4,
        ),
      );
    const meeting = (t: number[]): number => {
      const least: number = Math.min(...leastMeetings(t, layout));
      return Number.isFinite(least) ? least : -Infinity;
    };
    // Admission requires every interpolated share inside (0, 1). The residual barrier alone cannot guarantee that bound between knots.
    const shares: number[] = units
      .map((unit: C.Unit, f: number): number => (unit === "share" ? f : -1))
      .filter((f: number): boolean => f >= 0);
    const inside = (t: number[]): boolean =>
      shares.every((f: number): boolean => t[f]! > 0 && t[f]! < 1);
    const admissible = (values: number[][]): boolean => {
      const rounded: number[][] = stored(values);
      return dense.every(
        (b: number[]): boolean =>
          C.chain(theta(values, b), layout).fault === null &&
          C.chain(theta(rounded, b), layout).fault === null &&
          meeting(theta(values, b)) >= margin &&
          meeting(theta(rounded, b)) >= margin &&
          inside(theta(values, b)) &&
          inside(theta(rounded, b)),
      );
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
    const cost = (
      values: number[][],
    ): { total: number; residuals: number[][] } | null => {
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
        for (let k: number = 0; k < r.length; ++k)
          total += weights[i]![k]! * r[k]! * r[k]!;
        for (const f of free)
          total += RIDGE * r.length * (t[f]! - rest(f)) ** 2;
        residuals.push(r);
      }
      return { total, residuals };
    };
    // Feature lines first (`AutoMovieHumanConicSection` kind `f`), as conic lofting draws its control lines before its sections: each
    // feature's position along the stations is the projection of its sections' own readings, and its heading is fitted to the heading
    // nearest its reading, at every `DENSE_MM` station, with which both its arcs are conics, so the held lines make a seed admissible at every
    // station. The sections' other numbers are then fitted with the lines held (`held`).
    const featured: number[] = layout.anchors
      .map((_: C.IAnchor, k: number): number => k)
      .filter((k: number): boolean => layout.anchors[k]!.kind === "f");
    const held: Set<number> = new Set<number>();
    if (featured.length > 0 && initial === undefined && tail === undefined) {
      const { at }: { at: number[]; shoulders: number } = C.offsets(layout);
      for (const k of featured)
        for (let j: number = 0; j < 3; ++j) held.add(at[k]! + j);
      // A station still refused weighs more in the next round, so the heading lines bend toward where their arcs are conics.
      const stationWeight: number[] = dense.map((): number => 1);
      for (
        let round: number = 0;
        round < LINE_ROUNDS && !admissible(Y);
        ++round
      ) {
        dense.forEach((b: number[], d: number): void => {
          if (C.chain(theta(Y, b), layout).fault !== null)
            stationWeight[d]! *= 4;
        });
        const denseGram: number[][] = zeros(M, M);
        dense.forEach((b: number[], d: number): void => {
          for (let m: number = 0; m < M; ++m)
            for (let n: number = 0; n < M; ++n)
              denseGram[m]![n]! += stationWeight[d]! * b[m]! * b[n]!;
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
            const [before, after]: [number, number] = [
              (k + n - 1) % n,
              (k + 1) % n,
            ];
            // The feature's frame (`AutoMovieHumanConicSection.frame`): its numbers are read on that chord.
            const [from, to]: [number, number] = C.frame(k, layout);
            const chord: number = Math.atan2(
              points[to]![1]! - points[from]![1]!,
              points[to]![0]! - points[from]![0]!,
            );
            const reading: number = chord + values[at[k]! + 2]!;
            let chosen: number | null = null;
            // Only headings within a quarter turn of the reading, as the seed's search (`FamilyConicSection.seed`): past that the tangent runs
            // against the chain's direction of travel.
            for (
              let step: number = 0;
              step * HEADING_STEP < Math.PI / 2;
              ++step
            ) {
              const tried: number[] =
                step === 0
                  ? [reading]
                  : [
                      reading + step * HEADING_STEP,
                      reading - step * HEADING_STEP,
                    ];
              const found: number | undefined = tried.find(
                (h: number): boolean => {
                  const d: number[] = [Math.cos(h), Math.sin(h)];
                  return (
                    C.arc(
                      points[before]!,
                      tangents[before]!,
                      points[k]!,
                      d,
                      margin,
                    ) &&
                    C.arc(
                      points[k]!,
                      d,
                      points[after]!,
                      tangents[after]!,
                      margin,
                    )
                  );
                },
              );
              if (found === undefined) continue;
              chosen = found;
              break;
            }
            // Where no heading makes both arcs conics, the feature stands too near its neighbours' chord for its turn: it is drawn a third
            // of the way toward that chord's middle, along the chord, and its line follows it there in the next round.
            let place: number[] = points[k]!;
            if (chosen === null) {
              const middle: number[] = [
                (points[before]![0]! + points[after]![0]!) / 2,
                (points[before]![1]! + points[after]![1]!) / 2,
              ];
              place = [
                place[0]! + (middle[0]! - place[0]!) / 3,
                place[1]! + (middle[1]! - place[1]!) / 3,
              ];
              chosen = Math.atan2(
                points[after]![1]! - points[before]![1]!,
                points[after]![0]! - points[before]![0]!,
              );
              points[k] = place;
            }
            tangents[k] = [Math.cos(chosen), Math.sin(chosen)];
            const read: { values: [number, number, number]; t: number } =
              C.unplace(
                points[from] as C.P,
                points[to] as C.P,
                place as C.P,
                chosen,
                previous,
              );
            previous = C.along(previous, read.values[0]);
            targets[j]!.push(read.values[2]);
            places[j]![0]!.push(read.values[0]);
            places[j]![1]!.push(read.values[1]);
          });
        }
        const project = (field: number, target: number[]): void => {
          const right: number[] = new Array<number>(M).fill(0);
          dense.forEach((b: number[], d: number): void => {
            for (let m: number = 0; m < M; ++m)
              right[m]! += stationWeight[d]! * b[m]! * target[d]!;
          });
          const solved: number[] | null = solve(
            denseGram.map((r: number[]): number[] => [...r]),
            right,
          );
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
    const listed: number[] = (
      process.argv
        .find((a: string): boolean => a.startsWith("--seed-stations="))
        ?.slice("--seed-stations=".length) ?? ""
    )
      .split(",")
      .filter((x: string): boolean => x.length > 0)
      .map(Number);
    if (tail === undefined && process.argv.includes("--seeds") && listed.length > 0) {
      const K: number = layout.anchors.length;
      const describe = (t: number[]): string => {
        const points = C.resolve(t, layout).input.points;
        return points
          .map((p, j: number): string => {
            const k: number = j < K ? j : K - 2 - (j - K);
            const anchor = layout.anchors[k]!;
            return `${j}=a${k}${anchor.kind}${anchor.kind === "f" ? ":" + (anchor.feature ?? "") : anchor.mid === true ? ":mid" : ""}(${p[0]!.toFixed(1)},${p[1]!.toFixed(1)})`;
          })
          .join(" ");
      };
      for (const s of listed) {
        const d: number = Math.max(
          0,
          Math.min(dense.length - 1, Math.round((s - knots[0]!) / DENSE_MM)),
        );
        const t: number[] = theta(Y, dense[d]!);
        process.stderr.write(
          `held lines at ${s}: ${C.chain(t, layout).fault ?? "admitted"}\n  ${describe(t)}\n`,
        );
        const i: number = train.reduce(
          (b: number, row: IRow, j: number): number =>
            Math.abs(row.s - s) < Math.abs(train[b]!.s - s) ? j : b,
          0,
        );
        const own: number[] = seeds[i]!;
        process.stderr.write(
          `own seed at ${train[i]!.s}: ${C.chain(own, layout).fault ?? "admitted"}\n  ${describe(own)}\n`,
        );
      }
    }
    if (process.argv.includes("--seeds")) {
      const refused: string[] = dense
        .map((b: number[], d: number): string => {
          const fault: string | null = C.chain(theta(Y, b), layout).fault;
          return fault === null
            ? ""
            : (knots[0]! + d * DENSE_MM).toFixed(2) +
                ": " +
                fault.slice(0, 120);
        })
        .filter((x: string): boolean => x.length > 0);
      process.stderr.write(
        "lines held: " +
          refused.length +
          " of " +
          dense.length +
          " stations refused" +
          (refused.length === 0
            ? ""
            : "; first " + refused[0] + "; last " + refused.at(-1)) +
          "\n",
      );
      // And by stretch of the course, 100 mm at a time, with each stretch's first fault, so a refusal is placed by region.
      const stretches: Map<
        number,
        { count: number; total: number; first: string }
      > = new Map();
      dense.forEach((b: number[], d: number): void => {
        const s: number = knots[0]! + d * DENSE_MM;
        const key: number = Math.floor(s / 100) * 100;
        const entry = stretches.get(key) ?? { count: 0, total: 0, first: "" };
        entry.total++;
        const fault: string | null = C.chain(theta(Y, b), layout).fault;
        if (fault !== null) {
          entry.count++;
          if (entry.first === "")
            entry.first = s.toFixed(1) + ": " + fault.slice(0, 90);
        }
        stretches.set(key, entry);
      });
      process.stderr.write(
        "lines held by stretch: " +
          [...stretches.entries()]
            .map(
              ([key, e]): string =>
                `${key}-${key + 100}: ${e.count}/${e.total}${e.first === "" ? "" : " (" + e.first + ")"}`,
            )
            .join(" | ") +
          "\n",
      );
    }
    if (tail !== undefined && !admissible(Y)) {
      // Project the training contours' admitted sections onto the affine prefix. The fixed
      // join supplies a direction at stations without their own directed continuation.
      const markFields: number[] = theta(tail.initial, basis(tail.mark));
      const aims: readonly (readonly number[])[] = train.map((row: IRow): readonly number[] => row.seed ?? markFields);
      const projected: number[][] = Y.map((field: number[], f: number): number[] => {
        const rhs: number[] = new Array<number>(variables).fill(0);
        B.forEach((b: number[], i: number): void => {
          const at: number = field.reduce((sum: number, x: number, k: number): number => sum + x * b[k]!, 0);
          const raw: number = aims[i]![f]! - at;
          const difference: number = units[f] === "angle" ? Math.atan2(Math.sin(raw), Math.cos(raw)) : raw;
          variableBasis(b).forEach((v: number, k: number): void => { rhs[k]! += v * difference; });
        });
        const change: number[] | null = solve(gram.map((r: number[]): number[] => [...r]), rhs);
        return change === null ? field : tail.expand(f, tail.free.map((k: number, i: number): number => field[k]! + change[i]!));
      });
      // The restoration objective measures the same signed inequalities on the same dense
      // sections. Admissibility still requires the complete native chain and both stored forms.
      const slack: number = Math.sqrt(Number.EPSILON);
      const merit = (values: number[][]): number => {
        let sum: number = 0;
        for (const b of dense) {
          const field: number[] = theta(values, b);
          const m: number[] | null = margins(field);
          if (m === null || (m.every((v: number): boolean => v >= slack) && C.chain(field, layout).fault !== null)) return Infinity;
          for (const v of m) sum += Math.min(0, v - slack) ** 2;
        }
        return sum;
      };
      if (admissible(projected) || merit(projected) < merit(Y)) Y = projected;
      for (let pass: number = 0; pass < LINE_ROUNDS && !admissible(Y); ++pass) {
        const direction: number[][] = zeros(F, variables);
        for (const b of dense) {
          const field: number[] = theta(Y, b);
          const values: number[] | null = margins(field);
          if (values === null) continue;
          const active: number[] = values.flatMap((x: number, i: number): number[] => x < slack ? [i] : []);
          if (active.length === 0) continue;
          const reduced: number[] = variableBasis(b);
          for (let f: number = 0; f < F; ++f) {
            const scale: number = Math.max(1, Math.abs(field[f]!));
            const h: number = Math.cbrt(Number.EPSILON) * scale;
            const moved: number[] = [...field];
            moved[f]! += h;
            const plus: number[] | null = margins(moved);
            moved[f]! -= 2 * h;
            const minus: number[] | null = margins(moved);
            if (plus === null || minus === null) continue;
            const step: number = active.reduce((sum: number, i: number): number =>
              sum + (slack - values[i]!) * (plus[i]! - minus[i]!) / (2 * h), 0) * scale * scale;
            reduced.forEach((v: number, k: number): void => { direction[f]![k]! += v * step; });
          }
        }
        const prior: number = merit(Y);
        let reduced: boolean = false;
        for (let fraction: number = 1; fraction >= Number.EPSILON; fraction /= 2) {
          const trial = Y.map((field: number[], f: number): number[] =>
            tail.expand(f, tail.free.map((k: number, j: number): number => field[k]! + fraction * direction[f]![j]!)));
          if (admissible(trial) || merit(trial) < prior) {
            Y = trial;
            reduced = true;
            break;
          }
        }
        if (!reduced) break;
      }
    }
    let current: { total: number; residuals: number[][] } | null = cost(Y);
    if (current !== null && admitStart !== undefined) {
      const refusal: string | null = admitStart(Y);
      if (refusal !== null) return failed(refusal);
    }
    // A projection of sections' own seeds onto few knots can leave stations whose chain is no conic chain, where features appear and
    // fade along the part. One section's seed held at every knot is the same admissible chain at every station; the joint fit starts from
    // it, sections nearest the middle first, and the admissibility of every station is kept on the way.
    if (current === null && initial === undefined && tail === undefined)
      for (const i of train
        .map((_: IRow, i: number): number => i)
        .sort(
          (a: number, b: number): number =>
            Math.abs(a - train.length / 2) - Math.abs(b - train.length / 2),
        )) {
        const flat: number[][] = seeds[i]!.map((value: number): number[] =>
          new Array<number>(M).fill(value),
        );
        const tried: { total: number; residuals: number[][] } | null =
          cost(flat);
        if (tried === null) continue;
        Y = flat;
        current = tried;
        break;
      }
    if (current === null) {
      // `--seeds`: which sections' own seeds and projected seeds are admissible chains, by station, so a refused seed is placed.
      if (tail === undefined && process.argv.includes("--seeds")) {
        process.stderr.write(
          "first refused seed: " +
            (train
              .map((row: IRow, i: number): string =>
                C.chain(seeds[i]!, layout).fault === null
                  ? ""
                  : row.s.toFixed(1) +
                    " " +
                    C.chain(seeds[i]!, layout).fault +
                    " values " +
                    seeds[i]!.map((x: number): string => x.toFixed(2)).join(
                      ",",
                    ),
              )
              .find((x: string): boolean => x.length > 0) ?? "none") +
            "\n" +
            "seeds: " +
            train
              .map(
                (row: IRow, i: number): string =>
                  row.s.toFixed(1) +
                  (C.chain(seeds[i]!, layout).fault === null ? "+" : "-") +
                  (C.chain(theta(Y, B[i]!), layout).fault === null ? "+" : "-"),
              )
              .join(" ") +
            "\n",
        );
        // Report each hard admission predicate for the supplied or projected start and the flat fallback.
        const start = (
          label: string,
          values: number[][],
          tried: boolean,
        ): string => {
          const rounded: number[][] = stored(values);
          const failing: string[] = [];
          let least: { value: number; at: string } = {
            value: Infinity,
            at: "",
          };
          // The refused readings over every 20 mm of course: how many, and the least meeting among them with its arc and side, so a
          // refusal is placed along the whole part and not only at its first 24 readings.
          const stretches: Map<
            number,
            { count: number; value: number; at: string }
          > = new Map();
          dense.forEach((b: number[], d: number): void => {
            const s: number = knots[0]! + d * DENSE_MM;
            for (const [form, t] of [
              ["raw", theta(values, b)],
              ["stored", theta(rounded, b)],
            ] as const) {
              const fault: string | null = C.chain(t, layout).fault;
              const sides: { arc: number; a: number; b: number }[] =
                meetingSides(t, layout);
              const worst = sides.reduce((x, y) =>
                Math.min(y.a, y.b) < Math.min(x.a, x.b) ? y : x,
              );
              const value: number = Math.min(worst.a, worst.b);
              const side: string = worst.a <= worst.b ? "a" : "b";
              if (value < least.value)
                least = {
                  value,
                  at: `${s.toFixed(2)} ${form} arc ${worst.arc} ${side}`,
                };
              const outside: number[] = shares.filter(
                (f: number): boolean => !(t[f]! > 0 && t[f]! < 1),
              );
              if (fault !== null || !(value >= margin) || outside.length > 0) {
                const key: number = Math.floor(s / 20) * 20;
                const stretch = stretches.get(key) ?? {
                  count: 0,
                  value: Infinity,
                  at: "",
                };
                stretch.count += 1;
                if (value < stretch.value)
                  [stretch.value, stretch.at] = [
                    value,
                    `${s.toFixed(2)} ${form} arc ${worst.arc} ${side}`,
                  ];
                stretches.set(key, stretch);
              }
              if (fault !== null || !(value >= margin) || outside.length > 0)
                failing.push(
                  `${s.toFixed(2)} ${form}: ${fault === null ? "" : "chain refused (" + fault.slice(0, 80) + "); "}least meeting ${value.toFixed(4)} at arc ${worst.arc} ${side}${outside.length === 0 ? "" : "; shares outside (0, 1): fields " + outside.join(",")}`,
                );
            }
          });
          return (
            `${label} start${tried ? "" : " (not tried: a start was given)"}: ${failing.length} of ${2 * dense.length} station readings refused under margin ${margin}; least meeting ${least.value.toFixed(4)} at ${least.at}` +
            (stretches.size === 0
              ? ""
              : "\n  refused by 20 mm stretch: " +
                [...stretches.entries()]
                  .sort((x, y): number => x[0] - y[0])
                  .map(
                    ([key, stretch]): string =>
                      `${key}-${key + 20}: ${stretch.count}, least ${stretch.value.toFixed(4)} at ${stretch.at}`,
                  )
                  .join(" | ")) +
            (failing.length === 0
              ? ""
              : "\n  " +
                failing.slice(0, 24).join("\n  ") +
                (failing.length > 24
                  ? `\n  ... ${failing.length - 24} more`
                  : ""))
          );
        };
        const middle: number = train
          .map((_: IRow, i: number): number => i)
          .sort(
            (a: number, b: number): number =>
              Math.abs(a - train.length / 2) - Math.abs(b - train.length / 2),
          )[0]!;
        process.stderr.write(
          start("projected", Y, true) +
            "\n" +
            start(
              "flat (section " + train[middle]!.s.toFixed(1) + ")",
              seeds[middle]!.map((value: number): number[] =>
                new Array<number>(M).fill(value),
              ),
              initial === undefined,
            ) +
            "\n",
        );
      }
      const rounded: number[][] = stored(Y);
      const first: number = dense.findIndex((b: number[]): boolean =>
        [Y, rounded].some((values: number[][]): boolean => {
          const section: number[] = theta(values, b);
          return C.chain(section, layout).fault !== null || meeting(section) < margin || !inside(section);
        }),
      );
      return failed((tail === undefined ? "the projected seed" : "the canonical root continuation") +
        " is not an admissible conic chain at " +
        (first < 0 ? "a measured residual" : `${Math.min(denseEnd, knots[0]! + first * DENSE_MM)} mm`));
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
            const name: string =
              j < K
                ? `phase step after point ${j} (rad)`
                : j < K + L
                  ? `least meeting ${j - K} less the margin`
                  : `share field ${shares[Math.floor((j - K - L) / 2)]} ${(j - K - L) % 2 === 0 ? "above 0" : "below 1"}`;
            entry.what = `${s.toFixed(1)}: ${name} = ${v.toExponential(3)}; meeting ${meeting(t).toFixed(3)} against the margin ${margin}`;
          });
        named.set(key, entry);
      });
      process.stderr.write(
        "start's smallest margins by stretch: " +
          [...named.entries()]
            .map(([k, e]): string => `${k}-${k + 100}: ${e.what}`)
            .join(" | ") +
          "\n",
      );
    }
    // Levenberg-Marquardt with a finite-difference section Jacobian chained through the linear station basis.
    const steps: number[] = Array.from(
      { length: F },
      (_: unknown, f: number): number => (units[f] === "mm" ? 1e-4 : 1e-6),
    );
    let lambda: number = 1e-3;
    let iterations: number = 0;
    const refusedSteps: {
      inadmissible: number;
      rounding: number;
      barrier: number;
      residual: number;
      worse: number;
      singular: number;
      where: Map<number, number>;
    } = {
      inadmissible: 0,
      rounding: 0,
      barrier: 0,
      residual: 0,
      worse: 0,
      singular: 0,
      where: new Map(),
    };
    // `--homotopy`: the fit travels from the shape it starts from to the skin along a path of targets (Allgower and Georg), each section's
    // radii blended from the start's own (t = 0) to the observed ones (t = 1) in `HOMOTOPY_STEPS` steps, each step starting from the last
    // solution, so a start the admissible region holds far from the skin is carried to it without a jump across the region's wall.
    const skinRadii: number[][] = samples.map((sample: ISample): number[] => [
      ...sample.radii,
    ]);
    const startRadii: number[][] = samples.map(
      (sample: ISample, i: number): number[] => {
        const section: IAutoMovieViewChain.ISection = C.chain(
          theta(Y, B[i]!),
          layout,
        );
        return sample.phases.map((phi: number, k: number): number =>
          section.fault === null ? Q.radius(section, phi) : skinRadii[i]![k]!,
        );
      },
    );
    const homotopy: number[] = !polish || variables === 0
      ? []
      : process.argv.includes("--homotopy")
        ? Array.from(
            { length: HOMOTOPY_STEPS },
            (_: unknown, k: number): number => (k + 1) / HOMOTOPY_STEPS,
          )
        : [1];
    // `--release`: once the sections are fitted with the feature lines held, one more stage at the skin fits every number together, the
    // lines too, as block coordinate descent ends in a joint step; the lines start where they were drawn and are free to move only as far
    // as the admissible region (and with `--barrier`, its barrier) lets them.
    const stages: { along: number; release: boolean }[] = [
      ...homotopy.map((along: number) => ({ along, release: false })),
      ...(polish && held.size > 0 && process.argv.includes("--release")
        ? [{ along: 1, release: true }]
        : []),
    ];
    for (const { along, release } of stages) {
      if (release) held.clear();
      samples.forEach((sample: ISample, i: number): void => {
        sample.radii = skinRadii[i]!.map(
          (r: number, k: number): number =>
            startRadii[i]![k]! + along * (r - startRadii[i]![k]!),
        );
      });
      if (stages.length > 1) {
        const again: { total: number; residuals: number[][] } | null = cost(Y);
        if (again === null) break;
        current = again;
      } // With `--barrier`, every pass runs at falling barrier weights: the first is a share of the starting misfit spread over the margins,
      // and each next a tenth of the last, so the solution travels inside the admissible region toward the plain least-squares fit.
      const barrierLevels: number[] = [0];
      if (process.argv.includes("--barrier") && current !== null) {
        // Scale the initial log-barrier by the sum of the actual log margins. Near-boundary rows can otherwise dominate the current data objective on the first step.
        let logs: number = 0;
        for (const b of dense)
          for (const m of margins(theta(Y, b)) ?? [])
            logs += Math.abs(Math.log(m));
        const start: number =
          (BARRIER_SHARE * current.total) / Math.max(logs, 1);
        barrierLevels.splice(
          0,
          1,
          ...Array.from(
            { length: BARRIER_LEVELS },
            (_: unknown, k: number): number => start / 10 ** k,
          ),
          0,
        );
      }
      const passes: number = power > 2 ? 3 : 1;
      for (const level of barrierLevels) {
        const before: number = iterations;
        for (let pass: number = 0; pass < passes; ++pass) {
          if (mu !== level) {
            mu = level;
            const again: { total: number; residuals: number[][] } | null =
              cost(Y);
            if (again === null) break;
            current = again;
            lambda = 1e-3;
          }
          if (pass > 0) {
            // Reweight toward the p-norm (Lawson-style): larger residuals gain weight, pulling the maximum down.
            let peak: number = 0;
            for (const r of current.residuals)
              for (const v of r) peak = Math.max(peak, Math.abs(v));
            for (let i: number = 0; i < train.length; ++i)
              for (let k: number = 0; k < weights[i]!.length; ++k)
                weights[i]![k] =
                  samples[i]!.weights[k]! *
                  Math.max(1e-3, Math.abs(current.residuals[i]![k]!) / peak) **
                    (power - 2);
            current = cost(Y)!;
            lambda = 1e-3;
          }
          for (let round: number = 0; round < 60; ++round) {
            const N: number = F * variables;
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
                D.push(
                  shifted === null
                    ? new Array<number>(P).fill(0)
                    : shifted.map(
                        (v: number, k: number): number =>
                          (v - r[k]!) / steps[f]!,
                      ),
                );
              }
              const w: number[] = weights[i]!;
              const b: number[] = variableBasis(B[i]!);
              for (let f: number = 0; f < F; ++f) {
                const ridge: number = units[f] === "mm" ? 0 : RIDGE * P;
                let gr: number = ridge * (t[f]! - rest(f));
                for (let k: number = 0; k < P; ++k)
                  gr += w[k]! * D[f]![k]! * r[k]!;
                for (let m: number = 0; m < variables; ++m)
                  JTr[f * variables + m]! += gr * b[m]!;
                for (let g: number = f; g < F; ++g) {
                  let dd: number = g === f ? ridge : 0;
                  for (let k: number = 0; k < P; ++k)
                    dd += w[k]! * D[f]![k]! * D[g]![k]!;
                  if (dd === 0) continue;
                  for (let m: number = 0; m < variables; ++m) {
                    if (b[m] === 0) continue;
                    const row: number[] = JTJ[f * variables + m]!;
                    for (let n: number = 0; n < variables; ++n)
                      row[g * variables + n]! += dd * b[m]! * b[n]!;
                  }
                }
              }
            }
            // The barrier's gradient and its Gauss-Newton Hessian, (mu / m^2) dm dm^T, at every station.
            if (mu > 0)
              for (const full of dense) {
                const b: number[] = variableBasis(full);
                const t: number[] = theta(Y, full);
                const m: number[] | null = margins(t);
                if (m === null) continue;
                const D: number[][] = [];
                for (let f: number = 0; f < F; ++f) {
                  const moved: number[] = [...t];
                  moved[f]! += steps[f]!;
                  const shifted: number[] | null = margins(moved);
                  D.push(
                    shifted === null
                      ? new Array<number>(m.length).fill(0)
                      : shifted.map(
                          (v: number, j: number): number =>
                            (v - m[j]!) / steps[f]!,
                        ),
                  );
                }
                for (let f: number = 0; f < F; ++f) {
                  let gr: number = 0;
                  for (let j: number = 0; j < m.length; ++j)
                    gr -= (mu / m[j]!) * D[f]![j]!;
                  for (let q: number = 0; q < variables; ++q)
                    JTr[f * variables + q]! += gr * b[q]!;
                  for (let g: number = f; g < F; ++g) {
                    let dd: number = 0;
                    for (let j: number = 0; j < m.length; ++j)
                      dd += (mu / (m[j]! * m[j]!)) * D[f]![j]! * D[g]![j]!;
                    if (dd === 0) continue;
                    for (let q: number = 0; q < variables; ++q) {
                      if (b[q] === 0) continue;
                      const row: number[] = JTJ[f * variables + q]!;
                      for (let n: number = 0; n < variables; ++n)
                        row[g * variables + n]! += dd * b[q]! * b[n]!;
                    }
                  }
                }
              }
            for (let a: number = 0; a < N; ++a)
              for (let c: number = 0; c < a; ++c) JTJ[a]![c] = JTJ[c]![a]!;
            let accepted: boolean = false;
            let converged: boolean = false;
            for (
              let attempt: number = 0;
              attempt < 12 && !accepted;
              ++attempt
            ) {
              const A: number[][] = JTJ.map(
                (row: number[], a: number): number[] => {
                  const copy: number[] = [...row];
                  copy[a] =
                    row[a]! * (1 + lambda) +
                    1e-12 +
                    (held.has(Math.floor(a / variables)) ? 1e12 : 0);
                  return copy;
                },
              );
              const delta: number[] | null = solve(
                A,
                JTr.map((v: number): number => -v),
              );
              if (delta === null) ++refusedSteps.singular;
              if (delta !== null) {
                const next: number[][] = Y.map(
                  (field: number[], f: number): number[] =>
                    tail === undefined
                      ? field.map((y: number, m: number): number => y + delta[f * variables + m]!)
                      : tail.expand(f, tail.free.map((k: number, m: number): number => field[k]! + delta[f * variables + m]!)),
                );
                const trial: { total: number; residuals: number[][] } | null =
                  cost(next);
                // `--seeds`: why each trial step is refused, counted by the code path that refuses it (`admissible` at the dense stations, the
                // barrier, a fitting section's residual) or because it does not lower the cost.
                if (trial === null) {
                  if (!admissible(next)) {
                    ++refusedSteps.inadmissible;
                    // Refused only as stored: every raw station admissible, a rounded one not.
                    if (
                      dense.every(
                        (b: number[]): boolean =>
                          C.chain(theta(next, b), layout).fault === null &&
                          meeting(theta(next, b)) >= margin &&
                          inside(theta(next, b)),
                      )
                    )
                      ++refusedSteps.rounding;
                    const at: number = dense.findIndex(
                      (b: number[]): boolean =>
                        C.chain(theta(next, b), layout).fault !== null,
                    );
                    if (at >= 0)
                      refusedSteps.where.set(
                        Math.floor((knots[0]! + at * DENSE_MM) / 100) * 100,
                        (refusedSteps.where.get(
                          Math.floor((knots[0]! + at * DENSE_MM) / 100) * 100,
                        ) ?? 0) + 1,
                      );
                  } else if (mu > 0 && barrier(next) === null)
                    ++refusedSteps.barrier;
                  else ++refusedSteps.residual;
                } else if (!(trial.total < current.total)) ++refusedSteps.worse;
                if (trial !== null && trial.total < current.total) {
                  converged =
                    (current.total - trial.total) / current.total < 1e-6;
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
        if (process.argv.includes("--seeds"))
          process.stderr.write(
            `barrier level ${level.toExponential(3)}: ${iterations - before} steps accepted, cost ${current.total.toExponential(4)}\n`,
          );
      }
    }

    if (process.argv.includes("--seeds"))
      process.stderr.write(
        `steps refused: ${refusedSteps.inadmissible} inadmissible at a dense station (${refusedSteps.rounding} of them only as stored; first faulty station by stretch: ${[...refusedSteps.where.entries()].map(([s, c]): string => s + ":" + c).join(" ")}), ${refusedSteps.barrier} by the barrier, ${refusedSteps.residual} by a fitting section's residual, ${refusedSteps.worse} not lowering the cost, ${refusedSteps.singular} singular; ${iterations} accepted; ${held.size} of ${F} fields held\n`,
      );
    // Report at the cut vertices of fitting and withheld sections, and against the chords on an independent phase grid.
    const report: number[] = Array.from(
      { length: REPORT },
      (_: unknown, k: number): number => (2 * Math.PI * (k + 0.5)) / REPORT,
    );
    const evidence: IResult["rows"] = [];
    let chord: number = 0;
    const sums: Record<
      "train" | "held",
      { max: number; sum: number; square: number; n: number }
    > = {
      train: { max: 0, sum: 0, square: 0, n: 0 },
      held: { max: 0, sum: 0, square: 0, n: 0 },
    };
    for (const row of rows) {
      const section: IAutoMovieViewChain.ISection = C.chain(
        theta(Y, basis(row.s)),
        layout,
      );
      let maximum: number = section.fault === null ? 0 : Infinity;
      let worst: number = NaN;
      const into = sums[row.heldout ? "held" : "train"];
      if (section.fault === null) {
        const sample: ISample = vertices(row);
        for (let k: number = 0; k < sample.phases.length; ++k) {
          const e: number =
            Math.abs(Q.radius(section, sample.phases[k]!) - sample.radii[k]!) *
            sample.across[k]!;
          if (e > maximum) worst = sample.phases[k]!;
          maximum = Math.max(maximum, e);
          into.sum += e;
          into.square += e * e;
          ++into.n;
        }
        if (row.runs === undefined)
          for (const phi of report)
            chord = Math.max(
              chord,
              Math.abs(Q.radius(section, phi) - C.radius(row.points, phi, folds)),
            );
      }
      into.max = Math.max(into.max, maximum);
      evidence.push({
        s: row.s,
        heldout: row.heldout,
        maximumMm: maximum,
        phase: worst,
        fault: section.fault,
      });
    }
    const summary = (v: {
      max: number;
      sum: number;
      square: number;
      n: number;
    }): IError => ({
      maximumMm: v.max,
      meanMm: v.sum / Math.max(1, v.n),
      rmsMm: Math.sqrt(v.square / Math.max(1, v.n)),
    });
    return {
      layout,
      knots: [...knots],
      values: Y,
      training: summary(sums.train),
      heldout: summary(sums.held),
      rows: evidence,
      chordMaximumMm: chord,
      iterations,
      folds: folds.count,
      fault: null,
      milliseconds: performance.now() - started,
    };
  }

  /** Carry a family to another knot vector by reading every field at the new knots. */
  export function resample(
    values: readonly (readonly number[])[],
    from: readonly number[],
    to: readonly number[],
  ): number[][] {
    return values.map((field: readonly number[]): number[] => {
      const spline: IAutoMovieNaturalCubicSpline = S.create(from, field);
      return to.map((s: number): number => S.evaluate(spline, s));
    });
  }

  /** Carry a limb family of the given depth one median level deeper, knot by knot, through `FamilyConicSection.refine`. */
  export function refine(
    values: readonly (readonly number[])[],
    depth: number,
  ): number[][] {
    const M: number = values[0]!.length;
    const columns: number[][] = Array.from(
      { length: M },
      (_: unknown, m: number): number[] =>
        C.refine(
          values.map((field: readonly number[]): number => field[m]!),
          depth,
        ),
    );
    return columns[0]!.map((_: number, f: number): number[] =>
      columns.map((column: number[]): number => column[f]!),
    );
  }

  /**
   * The start's knots placed from the data (Piegl and Tiller, The NURBS Book, 1997, section 9.4.1, approximation to within a specified
   * accuracy: knots are inserted where the curve leaves its data until every point holds). From the domain's two ends, each round projects
   * every field onto the knots by weighted linear least squares (a refused own seed weighs nothing), and checks every `DENSE_MM` station
   * for an admissible chain, raw and as stored, and every admitted own seed for a projection within `SEED_NEAR_MM` of it. In each knot
   * interval that fails, a knot goes in at its worst station: the refused station farthest from the interval's knots first, else the seed
   * farthest from its projection.
   * An interval whose worst station stands within `KNOT_LEAST_MM` of a knot is reported and left, since the seeds there disagree.
   *
   * @param train The fitting sections.
   * @param seeds Their own seeds, headings unwrapped.
   * @param weights Each seed's weight in the projection.
   * @param ends The domain's first and last station.
   * @param layout The layout.
   * @param margin The fit's meeting margin.
   */
  export function adaptiveKnots(
    train: readonly IRow[],
    seeds: readonly (readonly number[])[],
    weights: readonly number[],
    ends: [number, number],
    layout: C.ILayout,
    margin: number,
  ): number[] {
    const units: C.Unit[] = C.units(layout);
    const F: number = units.length;
    const shares: number[] = units
      .map((unit: C.Unit, f: number): number => (unit === "share" ? f : -1))
      .filter((f: number): boolean => f >= 0);
    const rounded = (t: number[]): number[] =>
      t.map((y: number, f: number): number =>
        units[f] === "mm"
          ? Math.round(y * 100) / 100
          : Math.round(y * 1e4) / 1e4,
      );
    const least = (t: number[]): number => {
      const m: number = Math.min(...leastMeetings(t, layout));
      return Number.isFinite(m) ? m : -Infinity;
    };
    // A station's admission and its least meeting less the margin (negative when refused), raw and as stored.
    const score = (t: number[]): number => {
      const r: number[] = rounded(t);
      if (
        C.chain(t, layout).fault !== null ||
        C.chain(r, layout).fault !== null
      )
        return -Infinity;
      if (
        !shares.every(
          (f: number): boolean =>
            t[f]! > 0 && t[f]! < 1 && r[f]! > 0 && r[f]! < 1,
        )
      )
        return -Infinity;
      return Math.min(least(t), least(r)) - margin;
    };
    const rays: number[] = Array.from(
      { length: 72 },
      (_: unknown, k: number): number => (2 * Math.PI * k) / 72,
    );
    const apart = (a: number[], b: number[]): number => {
      const [x, y] = [C.chain(a, layout), C.chain(b, layout)];
      if (x.fault !== null || y.fault !== null) return Infinity;
      return Math.max(
        ...rays.map((phi: number): number =>
          Math.abs(Q.radius(x, phi) - Q.radius(y, phi)),
        ),
      );
    };
    // The own seeds against the same test: how many the fit itself would admit, and their least tangent meetings by stretch.
    {
      const stretches: Map<
        number,
        { n: number; pass: number; chained: number; least: number[] }
      > = new Map();
      train.forEach((row: IRow, i: number): void => {
        const key: number = Math.floor(row.s / 100) * 100;
        const cell = stretches.get(key) ?? {
          n: 0,
          pass: 0,
          chained: 0,
          least: [],
        };
        ++cell.n;
        if (C.chain([...seeds[i]!], layout).fault === null) ++cell.chained;
        const v: number = score([...seeds[i]!]);
        if (v >= 0) ++cell.pass;
        if (Number.isFinite(v)) cell.least.push(v + margin);
        stretches.set(key, cell);
      });
      const median = (x: number[]): string =>
        x.length === 0
          ? "-"
          : [...x].sort((a, b) => a - b)[Math.floor(x.length / 2)]!.toFixed(3);
      process.stderr.write(
        `own seeds against the fit's test (chain admitted / meeting margin and stored rounding passed / of; least meeting min and median): ${[
          ...stretches.entries(),
        ]
          .sort((a, b) => a[0] - b[0])
          .map(
            ([k, c]) =>
              `${k}-${k + 100}: ${c.chained}/${c.pass}/${c.n}, ${c.least.length ? Math.min(...c.least).toFixed(3) : "-"} ${median(c.least)}`,
          )
          .join(" | ")}\n`,
      );
    }
    let knots: number[] = [...ends];
    const blocked: Set<number> = new Set();
    for (let round: number = 0; round < 200; ++round) {
      const M: number = knots.length;
      const cardinals: IAutoMovieNaturalCubicSpline[] = knots.map(
        (_: number, m: number): IAutoMovieNaturalCubicSpline =>
          S.create(
            knots,
            knots.map((__: number, k: number): number => (k === m ? 1 : 0)),
          ),
      );
      const basis = (s: number): number[] =>
        cardinals.map((spline: IAutoMovieNaturalCubicSpline): number =>
          S.evaluate(spline, s),
        );
      const B: number[][] = train.map((row: IRow): number[] => basis(row.s));
      const gram: number[][] = zeros(M, M);
      B.forEach((b: number[], i: number): void => {
        for (let m: number = 0; m < M; ++m)
          for (let n: number = 0; n < M; ++n)
            gram[m]![n]! += weights[i]! * b[m]! * b[n]!;
      });
      const Y: number[][] = [];
      for (let f: number = 0; f < F; ++f) {
        const right: number[] = new Array<number>(M).fill(0);
        for (let i: number = 0; i < train.length; ++i)
          for (let m: number = 0; m < M; ++m)
            right[m]! += weights[i]! * B[i]![m]! * seeds[i]![f]!;
        const solved: number[] | null = solve(
          gram.map((r: number[]): number[] => [...r]),
          right,
        );
        if (solved === null) {
          process.stderr.write(
            `adaptive knots: the projection is singular at ${M} knots; kept the last that solved\n`,
          );
          return knots.slice(0, -1);
        }
        Y.push(solved);
      }
      const theta = (b: number[]): number[] =>
        Y.map((field: number[]): number =>
          field.reduce(
            (sum: number, y: number, m: number): number => sum + y * b[m]!,
            0,
          ),
        );
      // The worst station of each knot interval: refused first, by its least meeting; else the farthest admitted seed past `SEED_NEAR_MM`.
      const worst: Map<number, { s: number; refused: boolean; value: number }> =
        new Map();
      const interval = (s: number): number => {
        let m: number = 0;
        while (m + 1 < M - 1 && knots[m + 1]! <= s) ++m;
        return m;
      };
      const offer = (s: number, refused: boolean, value: number): void => {
        const m: number = interval(s);
        const held = worst.get(m);
        if (
          held === undefined ||
          (refused && !held.refused) ||
          (refused === held.refused && value > held.value)
        )
          worst.set(m, { s, refused, value });
      };
      const refusals: Map<number, number> = new Map();
      for (let s: number = ends[0]; s <= ends[1] + 1e-9; s += DENSE_MM) {
        const v: number = score(theta(basis(Math.min(s, ends[1]))));
        if (v < 0) {
          // A refused station's rank is its distance from the nearest knot: a fault has no degree, and inserting at the refused station
          // farthest from the interval's knots divides the refused stretch as bisection would.
          offer(
            s,
            true,
            Math.min(...knots.map((k: number): number => Math.abs(k - s))),
          );
          const key: number = Math.floor(s / 100) * 100;
          refusals.set(key, (refusals.get(key) ?? 0) + 1);
        }
      }
      let farthest: number = 0;
      train.forEach((row: IRow, i: number): void => {
        if (weights[i] === 0) return;
        const d: number = apart(theta(B[i]!), [...seeds[i]!]);
        farthest = Math.max(farthest, Number.isFinite(d) ? d : 0);
        if (d > SEED_NEAR_MM) offer(row.s, false, d);
      });
      // Each interval's worst station, moved onto the nearest fitting section; a knot within `KNOT_LEAST_MM` of another is not inserted.
      const added: number[] = [];
      for (const { s } of worst.values()) {
        const at: number = train.reduce(
          (b: IRow, row: IRow): IRow =>
            Math.abs(row.s - s) < Math.abs(b.s - s) ? row : b,
        ).s;
        if (
          [...knots, ...added].some(
            (k: number): boolean => Math.abs(k - at) < KNOT_LEAST_MM,
          )
        )
          blocked.add(Math.round(s * 4) / 4);
        else added.push(at);
      }
      const byStretch = (values: number[]): string => {
        const counts: Map<number, number> = new Map();
        for (const v of values)
          counts.set(
            Math.floor(v / 100) * 100,
            (counts.get(Math.floor(v / 100) * 100) ?? 0) + 1,
          );
        return [...counts.entries()]
          .sort((a, b): number => a[0] - b[0])
          .map(([k, n]): string => `${k}-${k + 100}: ${n}`)
          .join(", ");
      };
      process.stderr.write(
        `adaptive knots round ${round}: ${M} knots (${byStretch(knots)}); refused dense stations ${[...refusals.values()].reduce((a, b) => a + b, 0)} (${[
          ...refusals.entries(),
        ]
          .sort((a, b) => a[0] - b[0])
          .map(([k, n]) => `${k}-${k + 100}: ${n}`)
          .join(
            ", ",
          )}); farthest admitted seed ${farthest.toFixed(2)} mm; inserting ${added.length}; blocked ${blocked.size}${
          blocked.size
            ? ` (${[...blocked]
                .sort((a, b) => a - b)
                .slice(0, 30)
                .join(", ")})`
            : ""
        }\n`,
      );
      if (added.length === 0) {
        process.stderr.write(`adaptive knots: ${knots.join(", ")}\n`);
        process.stderr.write(
          `adaptive knots, refused own seeds: ${train
            .map((row: IRow, i: number): string =>
              weights[i] === 0
                ? `${row.s} projected ${score(theta(B[i]!)) >= 0 ? "admitted" : "refused"}`
                : "",
            )
            .filter((x: string): boolean => x.length > 0)
            .join(", ")}\n`,
        );
        return knots;
      }
      knots = [...knots, ...added].sort(
        (a: number, b: number): number => a - b,
      );
    }
    return knots;
  }
  /**
   * The start derived from lines (lofting.md, Defining a family: "A family can be defined by a few view curves", and a groove is "one more
   * longitudinal control curve, an inflection line drawn like the outlines"): each anchor of every section whose own seed the fit admits
   * is read in physical coordinates, its phase about the course, its radius and its tangent's heading from the radial direction, and each
   * arc's shoulder as it stands; each of those numbers is smoothed along the stations as a line by Whittaker's smoother (Eilers, A perfect
   * smoother, Analytical Chemistry 75, 2003), second differences penalised with the weight that halves a wavelength of `FAIR_MM` (the
   * sections' own form scale, along the course too), a refused seed weighing nothing; at any station the field vector is derived from the
   * lines (`FamilyConicSection.fields`). Reports the round trip (each admitted seed derived back from its own anchors) and the derived
   * vector's refusals at every `DENSE_MM` station by stretch.
   */
  export function linesStart(
    train: readonly IRow[],
    seeds: readonly (readonly number[])[],
    layout: C.ILayout,
    margin: number,
    from: number,
    to: number,
  ): { at: (s: number) => number[]; refused: number } {
    const K: number = layout.anchors.length;
    const units: C.Unit[] = C.units(layout);
    const shares: number[] = units
      .map((unit: C.Unit, f: number): number => (unit === "share" ? f : -1))
      .filter((f: number): boolean => f >= 0);
    const anchorFields: number = units.length - (layout.mirror ? K - 1 : K);
    const rounded = (t: number[]): number[] =>
      t.map((y: number, f: number): number =>
        units[f] === "mm"
          ? Math.round(y * 100) / 100
          : Math.round(y * 1e4) / 1e4,
      );
    const admitted = (t: number[]): boolean => {
      const r: number[] = rounded(t);
      if (
        C.chain(t, layout).fault !== null ||
        C.chain(r, layout).fault !== null
      )
        return false;
      if (
        !shares.every(
          (f: number): boolean =>
            t[f]! > 0 && t[f]! < 1 && r[f]! > 0 && r[f]! < 1,
        )
      )
        return false;
      return (
        Math.min(...leastMeetings(t, layout), ...leastMeetings(r, layout)) >=
        margin
      );
    };
    const weights: number[] = seeds.map((t: readonly number[]): number =>
      admitted([...t]) ? 1 : 0,
    );
    // Each line's samples: per anchor its phase, radius and heading from the radial direction, then every arc's shoulder.
    const samples: number[][] = seeds.map((t: readonly number[]): number[] => {
      const input = C.resolve([...t], layout).input;
      const points: number[][] = input.points as number[][],
        tangents: number[][] = input.tangents as number[][];
      const out: number[] = [];
      for (let k: number = 0; k < K; ++k) {
        const phi: number = Math.atan2(points[k]![1]!, points[k]![0]!);
        const heading: number = Math.atan2(tangents[k]![1]!, tangents[k]![0]!);
        out.push(
          phi,
          Math.hypot(points[k]![0]!, points[k]![1]!),
          Math.atan2(Math.sin(heading - phi), Math.cos(heading - phi)),
        );
      }
      return [...out, ...t.slice(anchorFields)];
    });
    const L: number = samples[0]!.length;
    // Angles unwrapped along the stations, so a line is smoothed on one branch.
    for (let j: number = 0; j < 3 * K; ++j) {
      if (j % 3 === 1) continue;
      for (let i: number = 1; i < samples.length; ++i) {
        while (samples[i]![j]! - samples[i - 1]![j]! > Math.PI)
          samples[i]![j]! -= 2 * Math.PI;
        while (samples[i]![j]! - samples[i - 1]![j]! < -Math.PI)
          samples[i]![j]! += 2 * Math.PI;
      }
    }
    const derive = (line: readonly number[]): number[] => {
      const found: C.P[] = [],
        heading: C.P[] = [];
      for (let k: number = 0; k < K; ++k) {
        const [phi, r, psi] = [
          line[3 * k]!,
          line[3 * k + 1]!,
          line[3 * k + 2]!,
        ];
        found.push([r * Math.cos(phi), r * Math.sin(phi)]);
        heading.push([Math.cos(phi + psi), Math.sin(phi + psi)]);
      }
      return C.fields(found, heading, line.slice(3 * K), layout);
    };
    // The round trip: an admitted seed derived back from its own anchors.
    let trip: number = 0;
    seeds.forEach((t: readonly number[], i: number): void => {
      if (weights[i] === 0) return;
      const back: number[] = derive(samples[i]!);
      back.forEach((v: number, f: number): void => {
        const d: number =
          units[f] === "angle"
            ? Math.abs(Math.atan2(Math.sin(v - t[f]!), Math.cos(v - t[f]!)))
            : Math.abs(v - t[f]!);
        trip = Math.max(trip, d);
      });
    });
    // Whittaker's smoother over the fitting stations (2 mm apart): lambda = 1 / (2 sin(pi h / FAIR))^4 halves the wavelength FAIR.
    const n: number = train.length;
    const spacing: number = (train[n - 1]!.s - train[0]!.s) / (n - 1);
    const lambda: number =
      1 / (2 * Math.sin((Math.PI * spacing) / C.FAIR_MM)) ** 4;
    const system: number[][] = Array.from(
      { length: n },
      (_: unknown, i: number): number[] => {
        const row: number[] = new Array<number>(n).fill(0);
        row[i] = weights[i]!;
        return row;
      },
    );
    for (let i: number = 1; i + 1 < n; ++i) {
      const d: [number, number, number] = [1, -2, 1];
      for (let a: number = 0; a < 3; ++a)
        for (let b: number = 0; b < 3; ++b)
          system[i - 1 + a]![i - 1 + b]! += lambda * d[a]! * d[b]!;
    }
    const smoothed: number[][] = Array.from(
      { length: L },
      (_: unknown, j: number): number[] =>
        solve(
          system.map((r: number[]): number[] => [...r]),
          samples.map((x: number[], i: number): number => weights[i]! * x[j]!),
        ) ?? samples.map((x: number[]): number => x[j]!),
    );
    const splines = smoothed.map((z: number[]) =>
      S.create(
        train.map((row: IRow): number => row.s),
        z,
      ),
    );
    const at = (s: number): number[] =>
      derive(splines.map((spline): number => S.evaluate(spline, s)));
    const refusals: Map<number, number> = new Map();
    let refused: number = 0;
    for (let s: number = from; s <= to + 1e-9; s += DENSE_MM) {
      if (admitted(at(Math.min(s, to)))) continue;
      ++refused;
      refusals.set(
        Math.floor(s / 100) * 100,
        (refusals.get(Math.floor(s / 100) * 100) ?? 0) + 1,
      );
    }
    process.stderr.write(
      `lines start: ${weights.filter((w: number): boolean => w > 0).length} of ${n} own seeds admitted and fitted; round trip within ${trip.toExponential(2)}; smoothing lambda ${lambda.toFixed(2)} at ${spacing.toFixed(2)} mm; refused dense stations ${refused} (${[
        ...refusals.entries(),
      ]
        .sort((a, b) => a[0] - b[0])
        .map(([k, c]) => `${k}-${k + 100}: ${c}`)
        .join(", ")})\n`,
    );
    return { at, refused };
  }

  /**
   * The fitting rows' own seeds, as `fit` reads them (`FamilyConicSection.seedAll` with each row's openings), so a check before a run reads
   * the very starts the run will.
   *
   * @param train The fitting rows, in station order.
   * @param layout The layout.
   * @param margin The least tangent meeting the seeds are read to.
   */
  export function ownSeeds(
    train: readonly IRow[],
    layout: C.ILayout,
    margin: number = ADMISSIBLE_MARGIN,
  ): number[][] {
    const complete: readonly IRow[] = train.filter((row: IRow): boolean => row.seed === undefined);
    const seeds: number[][] = C.seedAll(
      complete.map((row: IRow): readonly C.P[] => row.points),
      layout,
      {
        margin,
        openings: complete.map(
          (row: IRow): [number, number][] => row.opening ?? [],
        ),
        ...(train[0]?.fairMm === undefined ? {} : { fairMm: train[0].fairMm }),
      },
    );
    let next: number = 0;
    return train.map((row: IRow): number[] => row.seed === undefined ? seeds[next++]! : [...row.seed]);
  }

  /** Each arc's lesser tangent-meeting distance over unit tangents, as a share of its chord, by arc: what `ADMISSIBLE_MARGIN` holds. */
  export function leastMeetings(
    t: readonly number[],
    layout: C.ILayout,
  ): number[] {
    const input = C.resolve([...t], layout).input;
    const points: number[][] = input.points as number[][];
    const tangents: number[][] = input.tangents as number[][];
    return points.map((_: number[], j: number): number => {
      const [p0, p2, t0, t2] = [
        points[j]!,
        points[(j + 1) % points.length]!,
        tangents[j]!,
        tangents[(j + 1) % points.length]!,
      ];
      const [n0, n2]: number[] = [
        Math.hypot(t0[0]!, t0[1]!),
        Math.hypot(t2[0]!, t2[1]!),
      ];
      const [u, w]: number[][] = [
        [t0[0]! / n0, t0[1]! / n0],
        [t2[0]! / n2, t2[1]! / n2],
      ];
      const den: number = u[0]! * w[1]! - u[1]! * w[0]!;
      const d: number[] = [p2[0]! - p0[0]!, p2[1]! - p0[1]!];
      const chord: number = Math.hypot(d[0]!, d[1]!);
      const least: number = Math.min(
        (d[0]! * w[1]! - d[1]! * w[0]!) / den / chord,
        (u[0]! * d[1]! - u[1]! * d[0]!) / den / chord,
      );
      return Number.isFinite(least) ? least : -Infinity;
    });
  }

  /**
   * Both tangent meetings of every arc of a field vector as shares of its chord, the two quantities `leastMeetings` takes the smaller of:
   * `a`, how far ahead of the arc's start its tangent lines meet, and `b`, how far behind its end. For a diagnostic that names which side
   * of which arc holds a start off the margin.
   *
   * @param t A section's field vector.
   * @param layout Its layout.
   */
  export function meetingSides(
    t: readonly number[],
    layout: C.ILayout,
  ): { arc: number; a: number; b: number }[] {
    const input = C.resolve([...t], layout).input;
    const points: number[][] = input.points as number[][];
    const tangents: number[][] = input.tangents as number[][];
    return points.map(
      (_: number[], j: number): { arc: number; a: number; b: number } => {
        const [p0, p2, t0, t2] = [
          points[j]!,
          points[(j + 1) % points.length]!,
          tangents[j]!,
          tangents[(j + 1) % points.length]!,
        ];
        const [n0, n2]: number[] = [
          Math.hypot(t0[0]!, t0[1]!),
          Math.hypot(t2[0]!, t2[1]!),
        ];
        const [u, w]: number[][] = [
          [t0[0]! / n0, t0[1]! / n0],
          [t2[0]! / n2, t2[1]! / n2],
        ];
        const den: number = u[0]! * w[1]! - u[1]! * w[0]!;
        const d: number[] = [p2[0]! - p0[0]!, p2[1]! - p0[1]!];
        const chord: number = Math.hypot(d[0]!, d[1]!);
        const a: number = (d[0]! * w[1]! - d[1]! * w[0]!) / den / chord;
        const b: number = (u[0]! * d[1]! - u[1]! * d[0]!) / den / chord;
        return {
          arc: j,
          a: Number.isFinite(a) ? a : -Infinity,
          b: Number.isFinite(b) ? b : -Infinity,
        };
      },
    );
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
  export function construct(
    rows: readonly IRow[],
    knots: readonly number[],
    layout: C.ILayout,
    margin: number = ADMISSIBLE_MARGIN,
  ): IConstruction {
    const started: number = performance.now();
    const units: C.Unit[] = C.units(layout);
    const train: IRow[] = rows.filter((row: IRow): boolean => !row.heldout);
    const own: number[][] = train.map((row: IRow): number[] =>
      C.seed(row.points, layout),
    );
    const lesser = (t: number[]): number[] =>
      meetings(t, layout).map((m: { a: number; b: number }): number =>
        Number.isFinite(m.a) && Number.isFinite(m.b)
          ? Math.min(m.a, m.b)
          : -Infinity,
      );
    const holds = (t: number[]): boolean =>
      C.chain(t, layout).fault === null && Math.min(...lesser(t)) >= margin;
    const sections: number[] = train
      .filter((_: IRow, i: number): boolean => !holds(own[i]!))
      .map((row: IRow): number => row.s);
    const why = (t: number[]): string => {
      const fault: string | null = C.chain(t, layout).fault;
      if (fault !== null) return fault;
      const m: number[] = lesser(t);
      const j: number = m.indexOf(Math.min(...m));
      return "arc " + j + " meets at " + m[j]!.toFixed(3);
    };
    const reasons: string[] = train
      .map((row: IRow, i: number): string | null =>
        holds(own[i]!) ? null : "section " + row.s + ": " + why(own[i]!),
      )
      .filter((x: string | null): x is string => x !== null);
    for (let f: number = 0; f < units.length; ++f) {
      if (units[f] !== "angle") continue;
      for (let i: number = 1; i < own.length; ++i) {
        while (own[i]![f]! - own[i - 1]![f]! > Math.PI)
          own[i]![f]! -= 2 * Math.PI;
        while (own[i]![f]! - own[i - 1]![f]! < -Math.PI)
          own[i]![f]! += 2 * Math.PI;
      }
    }
    const M: number = knots.length;
    const cardinals: IAutoMovieNaturalCubicSpline[] = knots.map(
      (_: number, m: number): IAutoMovieNaturalCubicSpline =>
        S.create(
          [...knots],
          knots.map((__: number, k: number): number => (k === m ? 1 : 0)),
        ),
    );
    const basis = (s: number): number[] =>
      cardinals.map((c: IAutoMovieNaturalCubicSpline): number =>
        S.evaluate(c, s),
      );
    const B: number[][] = train.map((row: IRow): number[] => basis(row.s));
    const gram: number[][] = zeros(M, M);
    for (const b of B)
      for (let m: number = 0; m < M; ++m)
        for (let n: number = 0; n < M; ++n) gram[m]![n]! += b[m]! * b[n]!;
    const values: number[][] = [];
    for (let f: number = 0; f < units.length; ++f) {
      const right: number[] = new Array<number>(M).fill(0);
      for (let i: number = 0; i < train.length; ++i)
        for (let m: number = 0; m < M; ++m)
          right[m]! += B[i]![m]! * own[i]![f]!;
      const solved: number[] | null = solve(
        gram.map((r: number[]): number[] => [...r]),
        right,
      );
      if (solved === null)
        return {
          result: {
            layout,
            knots: [...knots],
            values: [],
            training: NONE,
            heldout: NONE,
            rows: [],
            chordMaximumMm: Infinity,
            iterations: 0,
            folds: 0,
            fault: "the knot vector is not supported by the observed stations",
            milliseconds: performance.now() - started,
          },
          sections,
          reasons,
          stations: [],
        };
      values.push(solved);
    }
    const stored = (y: number, f: number): number =>
      units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4;
    const stations: number[] = [];
    for (let s: number = knots[0]!; s <= knots[M - 1]! + 1e-9; s += DENSE_MM) {
      const b: number[] = basis(Math.min(s, knots[M - 1]!));
      const t: number[] = values.map((field: number[]): number =>
        field.reduce(
          (sum: number, y: number, m: number): number => sum + y * b[m]!,
          0,
        ),
      );
      if (!holds(t) || !holds(t.map(stored))) {
        if (stations.length < 6)
          reasons.push(
            "station " + s + ": " + why(holds(t) ? t.map(stored) : t),
          );
        stations.push(s);
      }
    }
    if (stations.length > 0)
      return {
        result: {
          layout,
          knots: [...knots],
          values,
          training: NONE,
          heldout: NONE,
          rows: [],
          chordMaximumMm: Infinity,
          iterations: 0,
          folds: 0,
          fault:
            "the constructed family is no admissible chain at " +
            stations.length +
            " stations",
          milliseconds: performance.now() - started,
        },
        sections,
        reasons,
        stations,
      };
    return {
      result: fit(rows, knots, layout, 2, values, margin, false),
      sections,
      reasons,
      stations,
    };
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
      longitudinal: {
        maximumMm: number;
        meanMm: number;
        admissible: boolean;
      }[];

      /** Mean radial miss of the stored family at the section's invented points and at its skin points, mm, and the invented points' share of the vertex weight. */
      weighting: { inventedMm: number; skinMm: number; share: number } | null;
    }[];

    /** At every dense station of the stored family, each arc whose tangent-meeting share stands within `slack` of the margin, and each share field within `slack` of its edge. */
    binding: {
      s: number;
      kind: "meeting" | "share";
      index: number;
      value: number;
    }[];
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
  export function decompose(
    rows: readonly IRow[],
    stored: {
      knots: readonly number[];
      values: readonly (readonly number[])[];
    },
    layout: C.ILayout,
    margin: number,
    invented: readonly (readonly boolean[] | null)[],
  ): IDecomposition {
    const units: C.Unit[] = C.units(layout);
    const read = (
      knots: readonly number[],
      values: readonly (readonly number[])[],
      s: number,
    ): number[] =>
      values.map((field: readonly number[]): number =>
        S.evaluate(
          S.create([...knots], [...field]),
          Math.max(knots[0]!, Math.min(knots.at(-1)!, s)),
        ),
      );
    const misses = (t: number[], row: IRow): number[] | null => {
      const section: IAutoMovieViewChain.ISection = C.chain(t, layout);
      if (section.fault !== null) return null;
      return row.points.map((p: C.P): number =>
        Math.abs(
          Q.radius(section, Math.atan2(p[1], p[0])) - Math.hypot(p[0], p[1]),
        ),
      );
    };
    const summary = (
      e: number[] | null,
    ): { maximumMm: number; meanMm: number } =>
      e === null
        ? { maximumMm: Infinity, meanMm: Infinity }
        : {
            maximumMm: Math.max(...e),
            meanMm:
              e.reduce((a: number, b: number): number => a + b, 0) / e.length,
          };

    // Each section alone: two copies one millimetre apart on their own two knots, so the fit holds one section at every station.
    const alone: (number[] | null)[] = rows.map(
      (row: IRow): number[] | null => {
        const copy: IRow = { ...row, heldout: false };
        const result: IResult = fit(
          [copy, { ...copy, s: row.s + 1 }],
          [row.s, row.s + 1],
          layout,
          2,
          undefined,
          margin,
        );
        return result.fault === null
          ? result.values.map((field: number[]): number => field[0]!)
          : null;
      },
    );
    // Those per-section fields projected onto a knot vector by linear least squares over the sections that have one, headings unwrapped.
    const kept: number[] = rows
      .map((_: IRow, i: number): number => i)
      .filter((i: number): boolean => alone[i] !== null);
    for (let f: number = 0; f < units.length; ++f) {
      if (units[f] !== "angle") continue;
      for (let k: number = 1; k < kept.length; ++k) {
        const previous: number = alone[kept[k - 1]!]![f]!;
        while (alone[kept[k]!]![f]! - previous > Math.PI)
          alone[kept[k]!]![f]! -= 2 * Math.PI;
        while (alone[kept[k]!]![f]! - previous < -Math.PI)
          alone[kept[k]!]![f]! += 2 * Math.PI;
      }
    }
    const project = (knots: number[]): number[][] | null => {
      const M: number = knots.length;
      const cardinals: IAutoMovieNaturalCubicSpline[] = knots.map(
        (_: number, m: number): IAutoMovieNaturalCubicSpline =>
          S.create(
            knots,
            knots.map((__: number, k: number): number => (k === m ? 1 : 0)),
          ),
      );
      const B: number[][] = kept.map((i: number): number[] =>
        cardinals.map((c: IAutoMovieNaturalCubicSpline): number =>
          S.evaluate(c, rows[i]!.s),
        ),
      );
      const gram: number[][] = zeros(M, M);
      for (const b of B)
        for (let m: number = 0; m < M; ++m)
          for (let n: number = 0; n < M; ++n) gram[m]![n]! += b[m]! * b[n]!;
      const values: number[][] = [];
      for (let f: number = 0; f < units.length; ++f) {
        const right: number[] = new Array<number>(M).fill(0);
        kept.forEach((i: number, k: number): void => {
          for (let m: number = 0; m < M; ++m)
            right[m]! += B[k]![m]! * alone[i]![f]!;
        });
        const solved: number[] | null = solve(
          gram.map((r: number[]): number[] => [...r]),
          right,
        );
        if (solved === null) return null;
        values.push(solved);
      }
      return values;
    };
    const finer = (knots: readonly number[]): number[] =>
      knots.flatMap((k: number, i: number): number[] =>
        i === 0 ? [k] : [(knots[i - 1]! + k) / 2, k],
      );
    const vectors: number[][] = [
      [...stored.knots],
      finer(stored.knots),
      finer(finer(stored.knots)),
    ];
    const projected: (number[][] | null)[] = vectors.map(project);

    const out: IDecomposition["rows"] = rows.map(
      (row: IRow, i: number): IDecomposition["rows"][number] => {
        const joint: number[] | null = misses(
          read(stored.knots, stored.values, row.s),
          row,
        );
        const worst: number =
          joint === null ? -1 : joint.indexOf(Math.max(...joint));
        const own: number[] | null =
          alone[i] === null ? null : misses(alone[i]!, row);
        const flags: readonly boolean[] | null = invented[i] ?? null;
        let weighting: IDecomposition["rows"][number]["weighting"] = null;
        if (
          joint !== null &&
          flags !== null &&
          flags.length === row.points.length
        ) {
          const n: number = row.points.length;
          const weight: number[] = row.points.map(
            (p: C.P, k: number): number => {
              const [a, b]: C.P[] = [
                row.points[(k + n - 1) % n]!,
                row.points[(k + 1) % n]!,
              ];
              return (
                (Math.hypot(p[0] - a[0], p[1] - a[1]) +
                  Math.hypot(b[0] - p[0], b[1] - p[1])) /
                2
              );
            },
          );
          const mean = (pick: boolean): number => {
            const ks: number[] = joint
              .map((_: number, k: number): number => k)
              .filter((k: number): boolean => flags[k] === pick);
            return ks.length === 0
              ? 0
              : ks.reduce(
                  (sum: number, k: number): number => sum + joint[k]!,
                  0,
                ) / ks.length;
          };
          const total: number = weight.reduce(
            (a: number, b: number): number => a + b,
            0,
          );
          weighting = {
            inventedMm: mean(true),
            skinMm: mean(false),
            share:
              weight.reduce(
                (sum: number, w: number, k: number): number =>
                  sum + (flags[k] ? w : 0),
                0,
              ) / total,
          };
        }
        return {
          s: row.s,
          joint: {
            ...summary(joint),
            phase:
              worst < 0
                ? NaN
                : Math.atan2(row.points[worst]![1], row.points[worst]![0]),
          },
          alone:
            own === null
              ? null
              : {
                  ...summary(own),
                  least: Math.min(...leastMeetings(alone[i]!, layout)),
                },
          longitudinal: projected.map(
            (
              values: number[][] | null,
              v: number,
            ): { maximumMm: number; meanMm: number; admissible: boolean } => {
              if (values === null)
                return {
                  maximumMm: Infinity,
                  meanMm: Infinity,
                  admissible: false,
                };
              const t: number[] = read(vectors[v]!, values, row.s);
              const e: number[] | null = misses(t, row);
              return {
                ...summary(e),
                admissible:
                  e !== null && Math.min(...leastMeetings(t, layout)) >= margin,
              };
            },
          ),
          weighting,
        };
      },
    );

    // The constraints active at the stored optimum, every `DENSE_MM` over its knots.
    const slack: number = 0.02;
    const binding: IDecomposition["binding"] = [];
    for (
      let s: number = stored.knots[0]!;
      s <= stored.knots.at(-1)! + 1e-9;
      s += DENSE_MM
    ) {
      const t: number[] = read(stored.knots, stored.values, s);
      leastMeetings(t, layout).forEach((m: number, j: number): void => {
        if (m < margin + slack)
          binding.push({ s, kind: "meeting", index: j, value: m });
      });
      t.forEach((v: number, f: number): void => {
        if (units[f] === "share" && (v < EDGE + slack || v > 1 - EDGE - slack))
          binding.push({ s, kind: "share", index: f, value: v });
      });
    }
    return { rows: out, binding };
  }

  /** An error record for a result that holds no family. */
  const NONE: IError = {
    maximumMm: Infinity,
    meanMm: Infinity,
    rmsMm: Infinity,
  };

  /** A rows-by-columns zero matrix. */
  function zeros(rows: number, columns: number): number[][] {
    return Array.from({ length: rows }, (): number[] =>
      new Array<number>(columns).fill(0),
    );
  }

  /** A material-space residual and its sparse derivative in the common sibling vector. */
  export interface IGroupRow {
    /** Signed residual in the metric of the measured or incident quantity. */
    value: number;

    /** Derivative by variable index in the same shared coefficient and fork-coordinate vector. */
    gradient: ReadonlyMap<number, number>;
  }
  /** The actual fixed-plane distance rows, or the owner's original refusal to supply them. */
  export type IGroupOutline =
    | { kind: "formed"; key: string; rows: readonly IGroupRow[] }
    | { kind: "refused"; key: string; detail: string };
  /** One fixed physical row family that the formed fit keeps once it satisfies its true signed bounds. */
  export interface IGroupPreservation {
    /** Registered physical ownership, fork allowance or host rail. */
    name: string;
    /** Complete actual signed rows in this family. */
    rows: readonly IGroupRow[];
  }
  type IGroupReading = { measured: IGroupRow[]; equal: IGroupRow[]; inside: IGroupRow[]; hard: IGroupRow[];
    objective: number; incidence: number; commonIncidence: number; scale: number[]; outline: IGroupOutline | undefined;
    preservation: readonly IGroupPreservation[] };
  type IGroupStep = {
    phase: string;
    delta: number[];
    slack: number;
    maximumViolation: number;
    stationarity: number;
    status: number;
    refinements: number;
    /** The objective's decrease the step's model predicts, `-2 (c d + d^T H d / 2)` for the objective `sum r^2`; 0 while elastic. */
    predicted: number;
    detail: IGroupStepDetail;
  };
  /** What one affine step read, solved and checked, for its log. */
  interface IGroupStepDetail {
    /** The solver: the active set for the constrained phase, the native kernel for the elastic phase or equal rows. */
    solver: "active set" | "kernel";
    /** Equal rows. */
    equal: number;
    /** Inside rows not held. */
    inside: number;
    /** Inside rows not held that the screening kept in the program. */
    insideKept: number;
    /** Rows of satisfied preserved families, screened as hard rows. */
    held: number;
    /** Hard and held rows before screening. */
    hardRows: number;
    /** Hard and held rows the screening kept. */
    hardKept: number;
    /** The lower quartile, median and upper quartile of a hard row's margin over its reach in the trust box; at most 1 is kept. */
    marginOverReach: [number, number, number] | null;
    /** Columns. */
    columns: number;
    /** The active set's work, when it solved. */
    active: Omit<IActiveSet, "primal" | "dual"> | null;
    /** Stationarity per column against that column's own terms, the check before the scale-relative one. */
    componentStationarity: number;
    /** Complementarity in the objective's first-order units, before scaling. */
    complementarityAbsolute: number;
    /** Milliseconds spent assembling, solving and checking. */
    ms: { assemble: number; solve: number; check: number };
    /** The elastic penalty used, the multipliers' sum on the elastic rows and the slack; null outside the elastic phase. */
    elastic: { gamma: number; slackDual: number; slack: number } | null;
  }

  /** One row's undamped coefficients and the affine extent across a unit-scope box. */
  type GroupAffineRow = {
    upper: IAutoMovieQuadraticRow;
    reach: number;
    margin: number;
    constant: boolean;
  };

  /** Sparse rows and objective shared by all trust scopes of one nonlinear reading. */
  type GroupStepPreparation = {
    elastic: boolean;
    unheld: readonly GroupAffineRow[];
    hardAll: readonly GroupAffineRow[];
    equalities: readonly IAutoMovieQuadraticRow[];
    marginOverReach: readonly [number, number, number] | null;
    undamped: readonly (readonly number[])[];
    linear: number[];
    held: number;
    slackFloor: readonly IAutoMovieQuadraticRow[];
    blocks: readonly (readonly number[])[];
  };

  /**
   * Prepare the unchanged affine coefficients, objective and block ordering for the reading's trust-scope attempts.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The first phase minimizes maximum signed excess. The second factors the unchanged positive-definite Hessian and uses the exact change of coordinates y=L^T delta. All original rows and the original-coordinate stationarity are checked.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts True equalities and one-sided ownership bounds keep their senses, including initially satisfied inequalities. Solver convergence is followed by an independent nonlinear material read.
   */
  function prepareStep(
    current: IGroupReading, units: readonly number[], tolerance: number,
  ): (scope: number, damping: readonly number[]) => IGroupStep | string {
    const n = units.length, elastic = current.incidence > tolerance;
    const row = (r: IGroupRow, equal: boolean, slack: boolean) => {
      const indices: number[] = [], weights: number[] = [];
      let reach: number = 0;
      for (const [i, a] of r.gradient) {
        indices.push(i);
        weights.push(a);
        reach += Math.abs(a) * units[i]!;
      }
      const upper: IAutoMovieQuadraticRow = slack
        ? { indices: [...indices, n], weights: [...weights, -1], lower: null, upper: -r.value }
        : { indices, weights, lower: equal ? -r.value : null, upper: -r.value };
      const opposite: IAutoMovieQuadraticRow | null = slack && equal
        ? { indices: upper.indices, weights: [...weights.map((a): number => -a), -1], lower: null, upper: r.value }
        : null;
      return { upper, opposite, reach, margin: -r.value, constant: indices.length === 0 };
    };
    const held = new Set(current.preservation.filter((family): boolean => family.rows.every((r): boolean => r.value <= 0))
      .flatMap((family) => family.rows));
    const unheld = current.inside.filter((r): boolean => !held.has(r)).map((r) => row(r, false, elastic));
    const hardAll = [...current.hard, ...held].filter((r): boolean => r.gradient.size > 0).map((r) => row(r, false, false));
    const equalities = current.equal.flatMap((r): IAutoMovieQuadraticRow[] => {
      const { upper, opposite } = row(r, true, elastic);
      return opposite === null ? [upper] : [upper, opposite];
    });
    // Exact screening of the hard rows (as the restoration's): inside the trust box |d_i| <= scope u_i a row's affine part reaches at most
    // `scope sum |a_i| u_i`, so a satisfied row whose bound `-value` lies beyond that never binds and cannot change the step. Only the rows
    // that may bind enter the program; every row is read again by the nonlinear trial. The bound is the exact maximum over the box, so a
    // row survives exactly when the box can reach its bound; the log gives the margin over the reach to say how far the box reaches.
    const ratios: number[] = [...hardAll, ...unheld].filter(({ reach }): boolean => reach > 0)
      .map(({ reach, margin }): number => margin / reach).sort((a, b): number => a - b);
    const quartile = (q: number): number => ratios[Math.min(ratios.length - 1, Math.floor(q * ratios.length))]!;
    const undamped: number[][] = elastic ? [] : zeros(n, n);
    const linear: number[] = new Array<number>(n).fill(0);
    if (!elastic) for (const r of current.measured) for (const [i, a] of r.gradient) {
      linear[i]! += a * r.value;
      for (const [j, b] of r.gradient) undamped[i]![j]! += a * b;
    }
    const slackFloor: IAutoMovieQuadraticRow[] = elastic ? [{ indices: [n], weights: [1], lower: 0, upper: null }] : [];
    const blocks: readonly (readonly number[])[] = elastic ? Array.from({ length: n + 1 }, (_, i): number[] => [i])
      : current.equal.length === 0 ? prepareHessianBlocks(undamped) : [];
    const prepared: GroupStepPreparation = { elastic, unheld, hardAll, equalities,
      marginOverReach: ratios.length === 0 ? null : [quartile(0.25), quartile(0.5), quartile(0.75)],
      undamped, linear, held: held.size, slackFloor, blocks };
    return (scope, damping) => groupStep(current, units, scope, damping, tolerance, prepared);
  }

  /** Solve and verify the prepared affine rows at one trust scope. */
  function groupStep(
    current: IGroupReading, units: readonly number[], scope: number, damping: readonly number[], tolerance: number,
    prepared: GroupStepPreparation,
  ): IGroupStep | string {
    const started: number = performance.now();
    const n: number = units.length;
    const { elastic, unheld, hardAll, equalities, marginOverReach, undamped, linear, held, slackFloor, blocks } = prepared;
    const phase = elastic ? "elastic incidence" : "constrained measured fit";
    const binds = ({ reach, margin }: { reach: number; margin: number }): boolean => scope * reach >= margin;
    const hard = hardAll.filter(binds).map(({ upper }) => upper);
    // The same exact screening holds for the inside rows in both phases: in the elastic program a row reads `a d - slack <= -value` with
    // the slack non-negative, so a satisfied row the box cannot bring to its bound never binds there either; a violated row always passes.
    // Without it every junction row entered the elastic program, and its steps took 11 to 34 s (2026-11-24, run 143436).
    const insideKept = unheld.filter((r): boolean => r.constant ? r.margin < 0 : binds(r)).map(({ upper }) => upper);
    const box = units.map((u, i): IAutoMovieQuadraticRow =>
      ({ indices: [i], weights: [1], lower: -scope * u, upper: scope * u }));
    const hessian = undamped.map((r, i): number[] => {
      const damped = [...r];
      damped[i]! += damping[i]!;
      return damped;
    });
    const originals = [...equalities, ...insideKept, ...hard, ...box, ...slackFloor];
    const assembled: number = performance.now();
    let delta: number[], dual: number[], slack: number = 0, status: number = 1, refinements: number = 0;
    let active: Omit<IActiveSet, "primal" | "dual"> | null = null;
    // The objective the check reads: the measured fit's, or the elastic program's below.
    let objectiveHessian: number[][] = hessian, objectiveLinear: number[] = linear;
    let gammaUsed: number = 0, slackDual: number = 0;
    if (elastic) {
      // The elastic phase as a strictly convex QP for the dual active set, SNOPT's elastic mode (Gill, Murray and Saunders, SIAM Review
      // 47(1), 2005, section 6) with one slack over every elastic row: min 1/2 d^T D d + gamma s + 1/2 mu s^2 over the rows `a d - s <= -value`,
      // the hard rows, the box and s >= 0. The linear `gamma s` is the exact penalty (Nocedal and Wright, section 17.2: exact once gamma
      // exceeds the multipliers' dual norm, here their sum, the slack being the rows' largest violation); `mu = mean(D)` only makes the
      // program strictly convex, a proximal phase I (section 18.3), and is not the penalty. One slack per row, the L1 form, would make the
      // method's dense factor span every row's slack, about 25 thousand on the leg; the single slack keeps it to the columns and one.
      // The proximal term in the box's own metric, so it is scale-free: in `y_i = d_i / (scope u_i)` it is `mu_y I`, `mu_y` the damping's
      // mean curvature there, and the slack's is `mu_y` over the current incidence squared. The damping as it stands is 1e-12 on a column
      // no measured row reads, which left the dual method's factor ill-conditioned (2026-11-24, run 145514: a false infeasibility).
      const m: number = n + 1;
      const boxed = (i: number): number => scope * units[i]!;
      const muY: number = damping.reduce((sum, x, i): number => sum + x * boxed(i) ** 2, 0) / n;
      const H: number[][] = zeros(m, m);
      for (let i = 0; i < n; ++i) H[i]![i] = muY / boxed(i) ** 2;
      H[n]![n] = muY / Math.max(current.incidence, tolerance) ** 2;
      // The penalty from the program's own scales, so it needs no raising: moving every column across its whole box costs at most
      // `n mu_y / 2` in the proximal term, and the current violation costs `gamma` times the incidence, so with `gamma = n mu_y / incidence`
      // removing the violation is always worth the full box move and the penalty is exact within the box (Nocedal and Wright, section 17.2).
      // Raising it while the slack still fell escalated it tenfold a step, to 2.6e7 on the hand (run 150651), because a proximal slack
      // term lowers the slack a little at any penalty.
      gammaUsed = (n * muY) / Math.max(current.incidence, tolerance);
      const lin: number[] = new Array<number>(m).fill(0);
      lin[n] = gammaUsed;
      const best: IActiveSet | string = activeSet(H, lin, originals, tolerance, blocks);
      if (typeof best === "string") return phase + ": " + best;
      objectiveLinear = lin;
      originals.forEach((r, i): void => { if (r.indices.includes(n)) slackDual += Math.abs(best.dual[i]!); });
      const chosen: IActiveSet = best;
      delta = chosen.primal.slice(0, n);
      slack = chosen.primal[n]!;
      dual = chosen.dual;
      objectiveHessian = H;
      active = { iterations: chosen.iterations, warm: chosen.warm, working: chosen.working, blocks: chosen.blocks };
    } else if (current.equal.length === 0) {
      // The constrained phase starts feasible at d = 0, so the active set solves it on its own rows, unwhitened (`activeSet`).
      const solved: IActiveSet | string = activeSet(hessian, linear, originals, tolerance, blocks);
      if (typeof solved === "string") return phase + ": " + solved;
      delta = solved.primal;
      dual = solved.dual;
      active ={ iterations: solved.iterations, warm: solved.warm, working: solved.working, blocks: solved.blocks };
    } else {
      // The elastic phase is a linear program and an equal row leaves d = 0 infeasible: both go to the native diagonal kernel, the
      // measured fit whitened by the Hessian's Cholesky factor.
      const factor = hessian.map((r) => [...r]);
      if (!elastic && solve(factor, linear) === null) return phase + " has a nonpositive damped objective";
      const chart = (x: readonly number[]): number[] => elastic
        ? x.map((v, i) => v * units[i]!)
        : forwardFactored(factor, x);
      const transformed = (r: IAutoMovieQuadraticRow): IAutoMovieQuadraticRow => {
        const normal = new Array<number>(n).fill(0);
        r.indices.forEach((i, j): void => { normal[i] = r.weights[j]!; });
        const weights = chart(normal), indices = weights.flatMap((a, i) => a === 0 ? [] : [i]);
        return { ...r, indices, weights: indices.map((i) => weights[i]!) };
      };
      const program = {
        diagonal: elastic ? [...linear, 0] : linear.map(() => 1),
        linear: elastic ? [...linear, 1] : chart(linear),
        rows: originals.map((r) => elastic
          ? { ...r, weights: r.weights.map((a, i) => a * (units[r.indices[i]!] ?? 1)) }
          : transformed(r)),
      };
      const native = solveAutoMovieQuadraticProgram(program);
      if (native.status !== 1 || ![...native.primal, ...native.dual].every(Number.isFinite))
        return phase + " did not solve its bounded affine rows, status " + native.status;
      // The engine's full-solve numerical scale bounds the coordinate solve; the physical owner retains its existing ceiling.
      const numerical = Math.min(tolerance, 1e-8);
      const qp = refineAutoMovieQuadraticProgram(program, native, { tolerance: numerical, maximumRefinements: 12 });
      delta = elastic ? chart(qp.primal.slice(0, n)) : backwardFactored(factor, qp.primal);
      dual = qp.dual;
      slack = elastic ? qp.primal[n]! : 0;
      status = qp.status;
      refinements = qp.refinements;
    }
    const solvedAt: number = performance.now();

    // The original KKT conditions, each against its own scale (the relative tests of Nocedal and Wright, Numerical Optimization, 2nd
    // ed., 2006, sections 17.4 and 18.3, and of OSQP, Stellato et al., Math. Prog. Comp. 12, 2020, section 3.4): stationarity
    // `|g + A^T lambda|` against max(1, |g|, |A^T lambda|), the largest terms it balances (with an objective near 1e7 an absolute 1e-8 asked
    // fifteen digits of a sum and refused every constrained step of the leg, 2026-11-23); feasibility in the rows' own units, mm of the
    // person, against the caller's tolerance in the same mm; complementarity `|lambda (a d - b)|` against that scale times the step's
    // largest coordinate, the objective's first-order change, and a multiplier on a missing bound against the largest multiplier.
    const values = elastic ? [...delta, slack] : delta;
    const g = objectiveHessian.map((r, i): number => r.reduce((sum, a, j) => sum + a * values[j]!, objectiveLinear[i]!));
    const multiplied = new Array<number>(g.length).fill(0), magnitude = g.map(Math.abs);
    let maximumViolation = 0, product = 0, stray = 0, largest = 1;
    for (const [i, r] of originals.entries()) {
      const multiplier = dual[i]!;
      let at = 0;
      for (const [j, column] of r.indices.entries()) {
        const a = r.weights[j]!;
        at += a * values[column]!;
        multiplied[column]! += a * multiplier;
        magnitude[column]! += Math.abs(a * multiplier);
      }
      largest = Math.max(largest, Math.abs(multiplier));
      const end = multiplier >= 0 ? r.upper : r.lower;
      maximumViolation = Math.max(maximumViolation, (r.lower ?? -Infinity) - at, at - (r.upper ?? Infinity));
      if (r.lower !== r.upper) {
        if (end === null) stray = Math.max(stray, Math.abs(multiplier));
        else product = Math.max(product, Math.abs(multiplier * (at - end)));
      }
    }
    let residual = 0, gScale = 1, aScale = 1, dScale = 1, componentStationarity = 0;
    g.forEach((x, i): void => {
      const r = Math.abs(x + multiplied[i]!);
      residual = Math.max(residual, r);
      gScale = Math.max(gScale, Math.abs(x));
      aScale = Math.max(aScale, Math.abs(multiplied[i]!));
      dScale = Math.max(dScale, Math.abs(values[i]!));
      componentStationarity = Math.max(componentStationarity, r / Math.max(1, magnitude[i]!));
    });
    const stationarity = residual / Math.max(gScale, aScale);
    const complementarity = Math.max(product / (Math.max(gScale, aScale) * dScale), stray / largest);
    const detail: IGroupStepDetail = { solver: active === null ? "kernel" : "active set", equal: current.equal.length, inside: unheld.length,
      insideKept: insideKept.length, elastic: elastic ? { gamma: gammaUsed, slackDual, slack } : null,
      held, hardRows: hardAll.length, hardKept: hard.length,
      marginOverReach: marginOverReach === null ? null : [marginOverReach[0] / scope, marginOverReach[1] / scope, marginOverReach[2] / scope], columns: n, active,
      componentStationarity, complementarityAbsolute: product,
      ms: { assemble: assembled - started, solve: solvedAt - assembled, check: performance.now() - solvedAt } };
    if (![...delta, maximumViolation, complementarity, stationarity, slack].every(Number.isFinite) ||
        maximumViolation > tolerance || stationarity > 1e-8 || complementarity > 1e-8)
      return phase + " failed original affine KKT: violation " + maximumViolation + ", stationarity " + stationarity +
        ", complementarity " + complementarity + " (" + JSON.stringify(detail) + ")";
    // The objective is the rows' sum of squares and the model `c d + d^T H d / 2` its Gauss-Newton half, so the predicted decrease is
    // twice the model's.
    const predicted: number = elastic ? 0 : -2 * delta.reduce((sum, x, i): number => sum + x * (linear[i]! + 0.5 * (g[i]! - linear[i]!)), 0);
    return { phase, delta, slack, maximumViolation, stationarity, status, refinements, predicted, detail };
  }

  /** The leading inside rows known before a trial failed its acceptance ceiling. */
  export interface IGroupPartialReading {
    /** The first measured reason the trial cannot be accepted. */
    refusal: string;
    /** Contiguous inside rows in the same order as a complete reading. */
    inside: readonly number[];
  }

  /** The source reader prepared for one fixed trial point. */
  export type GroupTrial = (derivatives: boolean, ceiling?: IGroupCeiling) => IGroupReading | IGroupPartialReading | string;

  /** The fit's final variables and exact-state receipt when certification was attempted. */
  interface IGroupFit<Proof> {
    values: number[];
    iteration: number;
    objective: number;
    incidence: number;
    stopped: string;
    outlineRefusal: string | null;
    timings: { geometryMs: number; solveMs: number };
    steps: Omit<IGroupStep, "delta">[];
    seal?: Proof;
  }

  /** Fit one declared sibling list, accepting each affine step through its independent nonlinear read. */
  export function fitGroup<Proof = boolean>(
    initial: readonly number[],
    read: (state: readonly number[], derivatives: boolean, ceiling?: IGroupCeiling) => ReturnType<GroupTrial>,
    tolerance: number,
    updates: number,
    observe?: (reading: object) => void,
    screen?: (point: readonly number[]) => string | null | (() => GroupTrial),
    staged?: {
      transfer: (point: readonly number[]) => number[] | null;
      certify: (point: readonly number[]) => { admitted: boolean; receipt: Proof };
      initial?: GroupTrial;
    },
    convergence?: { tolerance: number; steps: number },
  ): IGroupFit<Proof> | string {
    let values: number[] = [...initial];
    let units = values.map((v) => Math.max(1, Math.abs(v)));
    const timings = { geometryMs: 0, solveMs: 0 }, steps: Omit<IGroupStep, "delta">[] = [];
    let geometryReads: number = 0;
    const geometry = (point: readonly number[], derivatives: boolean, ceiling?: IGroupCeiling, scope?: GroupTrial) => {
      const index: number = ++geometryReads;
      observe?.({ action: "geometry", state: "start", index, derivatives, variables: point.length });
      const start: number = performance.now();
      const reading = scope === undefined ? read(point, derivatives, ceiling) : scope(derivatives, ceiling);
      const partial = typeof reading !== "string" && "refusal" in reading ? reading : undefined;
      const result: IGroupReading | string = typeof reading === "string" || !("refusal" in reading) ? reading : reading.refusal;
      const elapsed: number = performance.now() - start;
      timings.geometryMs += elapsed;
      observe?.({ action: "geometry", state: "returned", index, derivatives, phaseMs: Math.round(elapsed),
        // An outline refused leaves only the common rows read, so its incidence is a partial reading, never a complete one.
        ...(typeof result === "string" ? { refusal: result } : {
          scope: result.outline?.kind === "refused" ? "partial: common rows only, the outline refused" : "complete",
          measured: result.measured.length, equal: result.equal.length,
          inside: result.inside.length, hard: result.hard.length, incidence: result.incidence, objective: result.objective,
          commonIncidence: result.commonIncidence, outline: result.outline?.kind ?? null,
          outlineRows: result.outline?.kind === "formed" ? result.outline.rows.length : 0,
          outlineRefusal: result.outline?.kind === "refused" ? result.outline.detail : null }) });
      return { reading: result, partial: partial?.inside };
    };
    // The last state that passed the complete physical seal. Once sealed, the fit goes on minimizing the measured objective under the
    // same constraints (restoration alone degrades the fit: Gould, Loh and Robinson, SIAM J. Optim. 2015); each accepted step is sealed
    // again, and a feasible step the seal refuses ends the fit on the last sealed state.
    let sealed: { values: number[]; reading: IGroupReading; proof: Proof } | undefined;
    let unsealed: boolean = false;
    const prepare = (accepted?: IGroupReading, differentiate: boolean = true, scope?: GroupTrial):
      { reading: IGroupReading | string; seal?: Proof } => {
      let seal: Proof | undefined;
      if (staged !== undefined) {
        let plain = accepted ?? geometry(values, false, undefined, scope).reading;
        if (typeof plain === "string") return { reading: plain };
        if (plain.outline?.kind === "formed") {
          const stock = staged.transfer(values);
          if (stock !== null) {
            observe?.({ action: "formed scope", state: "transfer", before: values.length, after: stock.length });
            values = stock;
            units = units.slice(0, stock.length);
            scope = undefined;
            plain = geometry(values, false).reading;
            if (typeof plain === "string") return { reading: plain };
          }
          if (plain.outline?.kind === "formed" && plain.incidence <= tolerance) {
            const verdict = staged.certify(values);
            seal = verdict.receipt;
            if (verdict.admitted) {
              sealed = { values: [...values], reading: plain, proof: verdict.receipt };
              observe?.({ action: "physical seal", state: "passed", objective: plain.objective });
            } else if (sealed !== undefined) {
              unsealed = true;
              return { reading: plain, seal };
            }
          }
        }
        if (!differentiate) return { reading: plain, seal };
      }
      return { reading: geometry(values, true, undefined, scope).reading, seal };
    };
    const first = prepare(undefined, true, staged?.initial);
    if (typeof first.reading === "string") return "initial coupled source: " + first.reading;
    let current: IGroupReading = first.reading;
    let currentSeal: Proof | undefined = first.seal;

    /** Whether a trial reading is accepted against the current one: null, or why not. */
    const judge = (trial: IGroupReading | string): string | null => {
      if (typeof trial === "string") return trial;
      if (current.outline?.key !== trial.outline?.key || (current.outline?.kind === "formed" && trial.outline?.kind !== "formed"))
        return trial.outline?.kind === "refused" ? trial.outline.detail : "the trial changed its registered outline scope";
      const reopened = current.preservation.find((family): boolean => {
        if (family.rows.some((row): boolean => row.value > 0)) return false;
        const next = trial.preservation.find(({ name }): boolean => name === family.name);
        return next === undefined || next.rows.length !== family.rows.length || next.rows.some((row): boolean => !(row.value <= 0));
      });
      if (reopened !== undefined) return "the trial reopens the satisfied physical " + reopened.name;

      // Recover on the common original rows before the actual outline establishes the full baseline.
      const recovery: boolean = current.outline?.kind === "refused";
      const before: number = recovery ? current.commonIncidence : current.incidence;
      const after: number = recovery ? trial.commonIncidence : trial.incidence;
      if ((before > tolerance && after < before) || (after <= tolerance && trial.objective < current.objective)) return null;
      return "no update improved the nonlinear incidence or the feasible owned-arc objective";
    };

    /**
     * The second-order correction of a refused trial (Nocedal and Wright, Numerical Optimization, 2nd ed., eq. 15.36): the least-norm
     * step `p = -A^T (A A^T)^-1 c(x + d)` over the rows the trial violates, with the current rows' gradients `A` and the residuals
     * `c(x + d)` the trial measured (all its inside rows when it read them all, else its leading rows). The
     * corrected point is screened and read under the same ceiling. It costs one small solve and one reading, and no derivative.
     */
    const correction = (moved: readonly number[], trial: ReturnType<typeof geometry>, ceiling: IGroupCeiling | undefined) => {
      const known: readonly number[] | undefined = typeof trial.reading !== "string" && trial.reading.inside.length === current.inside.length
        ? trial.reading.inside.map((row): number => row.value) : trial.partial;
      if (known === undefined || known.length === 0 || known.length > current.inside.length) return undefined;
      const violated: { value: number; gradient: ReadonlyMap<number, number> }[] = known.flatMap((value: number, k: number) =>
        value > 0 && current.inside[k]!.gradient.size > 0 ? [{ value, gradient: current.inside[k]!.gradient }] : []);
      if (violated.length === 0 || violated.length > 256) return undefined;

      // A A^T y = c by Gaussian elimination with partial pivoting; a singular system has no least-norm correction.
      const k: number = violated.length;
      const m: number[][] = violated.map((a): number[] => violated.map((b): number => {
        let sum: number = 0;
        for (const [i, x] of a.gradient) sum += x * (b.gradient.get(i) ?? 0);
        return sum;
      }));
      const y: number[] = violated.map((row): number => row.value);
      for (let col: number = 0; col < k; ++col) {
        let pivot: number = col;
        for (let r: number = col + 1; r < k; ++r) if (Math.abs(m[r]![col]!) > Math.abs(m[pivot]![col]!)) pivot = r;
        if (!(Math.abs(m[pivot]![col]!) > 0)) return undefined;
        [m[col], m[pivot]] = [m[pivot]!, m[col]!];
        [y[col], y[pivot]] = [y[pivot]!, y[col]!];
        for (let r: number = col + 1; r < k; ++r) {
          const f: number = m[r]![col]! / m[col]![col]!;
          for (let j: number = col; j < k; ++j) m[r]![j]! -= f * m[col]![j]!;
          y[r]! -= f * y[col]!;
        }
      }
      for (let r: number = k - 1; r >= 0; --r) {
        let sum: number = y[r]!;
        for (let j: number = r + 1; j < k; ++j) sum -= m[r]![j]! * y[j]!;
        y[r] = sum / m[r]![r]!;
      }
      const point: number[] = [...moved];
      violated.forEach((row, a: number): void => { for (const [i, x] of row.gradient) point[i]! -= x * y[a]!; });
      if (!point.every(Number.isFinite)) return undefined;
      const screened = screen?.(point);
      if (typeof screened === "string") return undefined;
      const scope = screened?.();
      return { point, scope, reading: geometry(point, false, ceiling, scope).reading };
    };
    let lambda: number = 1e-3;
    let iteration: number = 0;
    let stopped: string = "the predeclared update budget was consumed";
    const attempts: number = 12;
    // Termination of the feasible fit by relative tests (Gill, Murray and Wright, Practical Optimization, 1981, section 8.2.3, test U1,
    // `F_(k-1) - F_k < tau (1 + |F_k|)`, with the step model's predicted decrease as the first-order, projected-gradient measure of
    // Nocedal and Wright, sections 17.4 and 18.3): the fit has converged once `convergence.steps` successive accepted feasible steps
    // each change the objective, and each predicts a change, of at most `convergence.tolerance` of it. A single small step can be a
    // damped short one after refusals, so one alone does not end the fit.
    let small: number = 0;
    // The trust box's radius carried as loop state (Nocedal and Wright, section 4.1): each iteration starts at the scope the last one
    // accepted, doubled after an acceptance at the first attempt. Restarting at scope 1 spent 115 of the hand's 172 s and 180 of the
    // leg's 196 s of steps on scopes already refused (run 144515).
    let startAttempt: number = 0;
    while (!unsealed && iteration < updates) {
      observe?.({ action: "affine preparation", state: "start", iteration });
      const prepareStart: number = performance.now();
      const stepFor = prepareStep(current, units, tolerance);
      const prepareMs: number = performance.now() - prepareStart;
      timings.solveMs += prepareMs;
      observe?.({ action: "affine preparation", state: "returned", iteration, phaseMs: Math.round(prepareMs) });
      let accepted: { point: number[]; reading: IGroupReading; predicted: number; attempt: number; scope?: GroupTrial } | undefined;
      for (let attempt: number = startAttempt; attempt < startAttempt + attempts; attempt++) {
        const local: number = attempt - startAttempt;
        const damping: number[] = current.scale.map((diagonal): number => lambda * diagonal + 1e-12);
        observe?.({ action: "affine step", state: "start", iteration, attempt });
        const start: number = performance.now();
        const step: IGroupStep | string = stepFor(2 ** -attempt, damping);
        const elapsed: number = performance.now() - start;
        timings.solveMs += elapsed;
        observe?.({ action: "affine step", state: "returned", iteration, attempt, phaseMs: Math.round(elapsed),
          ...(typeof step === "string" ? { refusal: step } : { status: step.status, slack: step.slack, stationarity: step.stationarity, ...step.detail }) });
        // A step whose solution fails its own KKT check is a defect of the solve; a smaller box does not cure it, so it is not retried
        // (the leg's iteration 10 of 2026-11-23 retried eleven such steps, 18 to 100 s each).
        if (typeof step === "string") { stopped = step; if (step.includes("failed original affine KKT")) break; lambda *= 4; continue; }
        const { delta, ...receipt } = step;
        steps.push(receipt);
        if (current.incidence > tolerance && !(step.slack + step.maximumViolation < current.incidence)) {
          stopped = "bounded elastic incidence has no resolved improving step; predicted slack " + step.slack;
          break;
        }
        let moved: number[] | undefined;
        let prepareTrial: (() => GroupTrial) | undefined;
        const extents: number = screen !== undefined && step.phase === "elastic incidence" ? attempts : local + 1;
        for (let extent: number = local; extent < extents; ++extent) {
          const scale: number = 2 ** (local - extent);
          const point: number[] = values.map((value: number, i: number): number => value + scale * delta[i]!);
          if (screen === undefined) { moved = point; break; }
          if (point.every((v, i): boolean => v === values[i])) {
            stopped = "the affine direction has no representable extent on its remaining scope";
            break;
          }
          if (step.phase === "elastic incidence") {
            const change: number[] = point.map((v, i): number => v - values[i]!);
            const at = (row: IGroupRow): number => {
              let value: number = row.value;
              for (const [i, slope] of row.gradient) value += slope * change[i]!;
              return value;
            };
            let incidence: number = 0;
            for (const row of current.equal) incidence = Math.max(incidence, Math.abs(at(row)));
            for (const row of current.inside) incidence = Math.max(incidence, at(row));
            if (!(incidence < current.incidence)) continue;
          }
          const started: number = performance.now();
          const screened = screen(point);
          const fault: string | null = typeof screened === "string" ? screened : null;
          observe?.({ action: "raw extent", state: "returned", iteration, attempt, extent, scale,
            phaseMs: Math.round(performance.now() - started), refusal: fault });
          if (typeof screened !== "string") { moved = point; prepareTrial = screened ?? undefined; break; }
          stopped = screened;
        }
        if (moved === undefined) { lambda *= 4; continue; }
        const ceiling: IGroupCeiling | undefined = current.outline?.kind === "formed" ? ceilingOf(current.incidence, tolerance) : undefined;
        const scope = prepareTrial?.();
        const trial = geometry(moved, false, ceiling, scope);
        const verdict: string | null = judge(trial.reading);
        if (verdict === null) { accepted = { point: moved, reading: trial.reading as IGroupReading, predicted: step.predicted, attempt, scope }; break; }
        stopped = verdict;
        if (verdict.startsWith("the trial reopens")) {
          observe?.({ action: "physical preservation", state: "refused", iteration, attempt, refusal: stopped });
          lambda *= 4;
          continue;
        }

        // The second-order correction (Nocedal and Wright, sections 15.6 and 18.3): the trial's measured constraint residuals pulled
        // back along the current gradients, tested before the region shrinks (the Maratos effect: a good step refused because the
        // constraints' linearization misses their curvature).
        const corrected = correction(moved, trial, ceiling);
        if (corrected !== undefined) {
          const second: string | null = judge(corrected.reading);
          observe?.({ action: "second-order correction", state: second === null ? "accepted" : "refused", iteration, attempt, refusal: second });
          if (second === null) { accepted = { point: corrected.point, reading: corrected.reading as IGroupReading, predicted: step.predicted, attempt, scope: corrected.scope }; break; }
        }
        lambda *= 4;
      }
      if (accepted === undefined) break;
      startAttempt = accepted.attempt === startAttempt ? Math.max(0, startAttempt - 1) : accepted.attempt;
      const feasible: boolean = current.incidence <= tolerance && accepted.reading.incidence <= tolerance;
      const scale: number = 1 + Math.abs(current.objective);
      const decrease: number = (current.objective - accepted.reading.objective) / scale, predicted: number = accepted.predicted / scale;
      small = convergence !== undefined && feasible && decrease <= convergence.tolerance && predicted <= convergence.tolerance ? small + 1 : 0;
      observe?.({ action: "termination", state: "measured", iteration, feasible, decrease, predicted, small });
      values = accepted.point;
      ++iteration;
      const converged: boolean = convergence !== undefined && small >= convergence.steps;
      const next = prepare(accepted.reading, iteration < updates && !converged, accepted.scope);
      if (typeof next.reading === "string") return "accepted source cannot continue: " + next.reading;
      current = next.reading;
      currentSeal = next.seal;
      lambda = Math.max(lambda / 3, 1e-9);
      if (converged && convergence !== undefined) {
        stopped = "converged: " + small + " successive accepted steps each changed and predicted at most " + convergence.tolerance +
          " of the objective";
        break;
      }
    }
    if (sealed !== undefined) {
      stopped = "the same canonical stock passed the independent complete physical seal; the constrained fit then ended: " +
        (unsealed ? "the next feasible state did not pass the seal" : stopped);
      return { values: sealed.values, iteration, objective: sealed.reading.objective, incidence: sealed.reading.incidence, stopped,
        timings, steps, outlineRefusal: null, seal: sealed.proof };
    }
    return { values, iteration, objective: current.objective, incidence: current.incidence, stopped, timings, steps, seal: currentSeal,
      outlineRefusal: current.outline?.kind === "refused" ? current.outline.detail : null };
  }

  /**
   * The value no row of an acceptable trial may reach, from the accepted reading of a formed outline. While restoring, a trial is
   * accepted only when its largest row is below the current one; while fitting, only when every row is within the tolerance.
   */
  export interface IGroupCeiling {
    /** The current largest row while restoring, or the incidence tolerance while fitting, in the rows' own units. */
    value: number;

    /** Whether a row equal to `value` already refuses: true while restoring (`after < before`), false while fitting (`after <= tolerance`). */
    inclusive: boolean;
  }

  /** The acceptance ceiling `fitGroup` applies to a trial of a formed outline. */
  export function ceilingOf(incidence: number, tolerance: number): IGroupCeiling {
    return incidence > tolerance ? { value: incidence, inclusive: true } : { value: tolerance, inclusive: false };
  }

  /**
   * Refuse a trial on the rows already read when one of them reaches the acceptance ceiling. The incidence is the largest row, and
   * unread rows can only raise it, so this refuses exactly the trials the complete reading would refuse among those it reaches, and
   * admits nothing. The refusal names itself partial with the counts it read and left unread.
   */
  export function partialRefusal(
    ceiling: IGroupCeiling | undefined,
    known: readonly { family: string; values: readonly number[] }[],
    unread: readonly string[],
  ): string | null {
    if (ceiling === undefined) return null;
    for (const { family, values } of known) {
      const worst: number = values.reduce((most: number, value: number): number => Math.max(most, value), -Infinity);
      if (ceiling.inclusive ? worst >= ceiling.value : worst > ceiling.value)
        return "partial reading refused: " + family + " reaches " + worst + " against the acceptance ceiling " + ceiling.value +
          " (" + known.map((row) => row.family + " " + row.values.length + " rows read").join(", ") + "; unread: " + unread.join(", ") + ")";
    }
    return null;
  }

  /**
   * The in-plane closest distance between two non-neighbour cuts and its rate under one material column.
   *
   * Both cuts are sampled at the same phases; the closest sampled pair witnesses the distance, and its rate is the relative velocity
   * of the two material points along the pair's unit normal (the linearized signed distance of sequential convex collision avoidance,
   * Schulman et al., IJRR 33(9), 2014). At a tie the first pair is a witness of the minimum, as the host rows' first branch is.
   */
  export function clearance(
    first: readonly AutoMovieVector3Tuple[],
    second: readonly AutoMovieVector3Tuple[],
  ): { distance: number; pair: [number, number]; normal: AutoMovieVector3Tuple } {
    let best: { distance: number; pair: [number, number] } = { distance: Infinity, pair: [-1, -1] };
    first.forEach((p, i): void => second.forEach((q, j): void => {
      const distance: number = V.norm(V.sub(p, q));
      if (distance < best.distance) best = { distance, pair: [i, j] };
    }));
    // Touching cuts have no separation to keep: a sampled distance within the samples' own double rounding (64 machine epsilons of
    // their coordinates' magnitude, as the engine's incidence checks bound it) is a touch.
    const magnitude: number = Math.max(1, ...[...first, ...second].map((p): number => Math.max(...p.map(Math.abs))));
    if (!(best.distance > 64 * Number.EPSILON * magnitude && Number.isFinite(best.distance)))
      throw new Error("two non-neighbour cuts touch or have no sampled points");
    return { ...best, normal: V.scale(V.sub(first[best.pair[0]]!, second[best.pair[1]]!), 1 / best.distance) };
  }

  /** Match exactly the two directed transitions per actual pair, using the independently oriented source cycles. */
  export function directedForks(
    actual: IAutoMovieConstructionComposedEnd.IComposition,
    measured: readonly { child: number; points: readonly C.P[] }[],
    sameWinding: boolean,
  ) {
    const turn: number = 2 * Math.PI;
    const phase = (a: number, b: number): boolean =>
      Math.abs((a - b) - turn * Math.round((a - b) / turn)) <= 64 * Number.EPSILON * (1 + Math.abs(a) + Math.abs(b));
    const sites = new Map<number, { pair: number; index: number; fork: IAutoMovieConstructionComposedEnd.IFork }>();
    const pieces = actual.outline.pieces;
    const key = (a: number, b: number, same: boolean): number => 2 * Math.min(a, b) + Number((a < b) !== same);
    for (const [i, from] of pieces.entries()) {
      const to = pieces[(i + 1) % pieces.length]!;
      const a: number = from.section, b: number = to.section;
      if (Math.abs(a - b) !== 1) return "the actual outline changes to a non-adjacent owner";
      const pair: number = Math.min(a, b);
      const phases: [number, number] = a < b ? [from.to, to.from] : [to.from, from.to];
      const refs = actual.seams[pair]!.forks.flatMap((fork, index) =>
        phase(fork.phases[0], phases[0]) && phase(fork.phases[1], phases[1]) ? [{ pair, index, fork }] : []);
      const id: number = key(a, b, sameWinding);
      if (refs.length !== 1 || sites.has(id)) return "the actual outline has no unique original pair at its directed owner transition";
      sites.set(id, refs[0]!);
    }
    if (sites.size !== 2 * actual.seams.length || measured.length !== sites.size)
      return "the original and actual outlines have different directed owner scopes";
    const matches: { pair: number; index: number; fork: IAutoMovieConstructionComposedEnd.IFork; observed: C.P }[] = [];
    for (const [i, from] of measured.entries()) {
      const to = measured[(i + 1) % measured.length]!;
      const a: number = from.child, b: number = to.child;
      const x = from.points.at(-1), y = to.points[0];
      const id: number = key(a, b, true), mapped = sites.get(id);
      if (Math.abs(a - b) !== 1 || x === undefined || y === undefined || x[0] !== y[0] || x[1] !== y[1] || mapped === undefined)
        return "the indexed observed contour has no unique corresponding adjacent owner transition";
      sites.delete(id);
      matches.push({ ...mapped, observed: x });
    }
    return matches;
  }

  /** Material velocity in a fixed plane, using the actual cut's transverse station and stock velocities. */
  export function planeVelocity(
    normal: AutoMovieVector3Tuple,
    station: AutoMovieVector3Tuple,
    material: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const advance: number = V.dot(normal, station);
    if (!(Number.isFinite(advance) && advance !== 0))
      throw new Error("the original planar cut has no transverse station differential");
    const along: number = -V.dot(normal, material) / advance;
    const velocity: AutoMovieVector3Tuple = V.add(material, V.scale(station, along));
    if (!velocity.every(Number.isFinite)) throw new Error("the original planar cut has no finite material differential");
    return velocity;
  }

  /** Both cut tangents resolve the same moving crossing in its fixed plane. */
  export function forkVelocity(
    x: AutoMovieVector3Tuple,
    y: AutoMovieVector3Tuple,
    left: AutoMovieVector3Tuple,
    right: AutoMovieVector3Tuple,
    movingLeft: AutoMovieVector3Tuple,
    movingRight: AutoMovieVector3Tuple,
  ): { point: AutoMovieVector3Tuple; rates: [number, number] } {
    const delta = V.sub(movingRight, movingLeft);
    const rates = V.solve2(V.dot(x, left), -V.dot(x, right), V.dot(y, left), -V.dot(y, right),
      [V.dot(x, delta), V.dot(y, delta)]);
    if (rates === null || !rates.every(Number.isFinite))
      throw new Error("an actual outline fork lost its transverse material differential");
    return { point: V.add(movingLeft, V.scale(left, rates[0])), rates };
  }

  /** One iteration reads the authored +Z stocks together. Only registered members own field columns. */
  export function readGroup(
    state: readonly number[],
    derivatives: boolean,
    jobs: readonly { rows: (state: readonly number[], derivatives: boolean) => {
      measured: IGroupRow[]; incidence: IGroupRow[]; inside: IGroupRow[]; hard?: readonly IGroupRow[];
    } | string }[],
    outline?: IGroupOutline,
    preservation: readonly IGroupPreservation[] = [],
  ): IGroupReading | string {
    const measured: IGroupRow[] = [], equal: IGroupRow[] = [], inside: IGroupRow[] = [], hard: IGroupRow[] = [];
    let incidence: number = 0;
    for (const job of jobs) {
      const read = job.rows(state, derivatives);
      if (typeof read === "string") return read;
      for (const row of read.measured) measured.push(row);
      for (const row of read.incidence) {
        incidence = Math.max(incidence, Math.abs(row.value));
        equal.push(row);
      }
      for (const row of read.inside) {
        incidence = Math.max(incidence, row.value);
        inside.push(row);
      }
      for (const row of read.hard ?? []) {
        if (!(row.value <= 0) || !Number.isFinite(row.value))
          return "a hard material constraint is outside its admitted stock";
        if (![...row.gradient.values()].every(Number.isFinite))
          return "a hard material constraint has a nonfinite differential";
        hard.push(row);
      }
    }
    const commonIncidence: number = incidence;
    if (outline?.kind === "formed") for (const row of outline.rows) {
      incidence = Math.max(incidence, row.value);
      inside.push(row);
    }
    const scale = new Array<number>(state.length).fill(0);
    let objective: number = 0;
    for (const row of measured) {
      objective += row.value * row.value;
      if (derivatives) for (const [i, d] of row.gradient) scale[i]! += d * d;
    }
    if (![objective, incidence, ...scale].every(Number.isFinite)) return "the coupled source produced a nonfinite physical row";
    return { measured, equal, inside, hard, objective, incidence, commonIncidence, scale, outline, preservation };
  }

  /** One actual signed child reading with its observed run point and admitted material phase. */
  export type IGroupSideSite = {
    /** Signed distance beyond the original child ownership boundary, mm. */
    value: number;
    /** Canonical child stock owning the read. */
    owner: string;
    /** Original observed section station, mm. */
    station: number;
    /** Index of the ordered observed run in its section. */
    run: number;
    /** Index of the measured point within the original run. */
    point: number;
    /** Actual fitted material phase at this observed point, rad. */
    phase: number;
  };

  /** Read directed measured arcs and hidden-side constraints from one sibling at its independently observed training stations. */
  export function sectionGroupRows(
    member: { family: K.IStored; tail: K.ITailFit; observed: readonly IRow[] },
    values: readonly (readonly number[])[],
    offset: number,
    derivatives: boolean,
    wholeAt: (s: number) => boolean,
    steps: readonly number[],
    outside: (s: number, p: C.P) => number,
  ): { measured: IGroupRow[]; inside: IGroupRow[]; side: IGroupSideSite | null } | string {
    const rows: IGroupRow[] = [], inside: IGroupRow[] = [];
    let side: IGroupSideSite | null = null;
    const cardinal = basisOf(member.tail.knots);
    for (const row of member.observed) {
      if (row.heldout) continue;
      if (row.runs === undefined) return "the grouped fit lacks direct skin-run custody";
      const full = cardinal(row.s), reduced = member.tail.basis(full);
      const controls = values.map((field): number => field.reduce((sum: number, y: number, i: number): number => sum + y * full[i]!, 0));
      const section = C.chain(controls, member.family.layout);
      if (section.fault !== null) return member.family.name + " at " + row.s + ": " + section.fault;
      const delta = derivatives ? controls.map((_, f) => {
        const moved = [...controls]; moved[f]! += steps[f]!;
        return C.chain(moved, member.family.layout);
      }) : [];
      const stationRows: IGroupRow[] = [];
      for (const [runIndex, run] of row.runs.entries()) {
        const correspondence = runCorrespondence(section, run, wholeAt(row.s));
        if (typeof correspondence === "string")
          return row.s + " mm run " + runIndex + ": " + correspondence;
        for (const [point, match] of correspondence.matches.entries()) {
          const fitted = Q.evaluate(section.arcs[match.arc]!, match.t);
          const phase: number = Math.atan2(fitted[1], fitted[0]);
          const shifted = delta.map((chart) => Q.read(chart, phase));
          if (shifted.some((q): boolean => q === null)) return "a physical section derivative is unavailable";
          const own = sourceSideRow(row, fitted, shifted.map((point) => point!.point), steps, reduced, offset, outside, 1);
          if (typeof own === "string") return own;
          if (own !== null) {
            inside.push(own);
            if (side === null || own.value > side.value)
              side = { value: own.value, owner: member.family.name, station: row.s, run: runIndex, point, phase };
          }
          for (const k of [0, 1]) {
            const local = new Map<number, number>();
            shifted.forEach((q, f): void => { local.set(f, (q!.point[k]! - fitted[k]!) / steps[f]!); });
            stationRows.push({ value: match.residual[k]!, gradient: chainColumns(local, reduced, offset) });
          }
        }
      }
      const weighted = weightedRows(row, stationRows);
      if (typeof weighted === "string") return weighted;
      rows.push(...weighted);
    }
    return { measured: rows, inside, side };
  }

  /** A native rational interval and the consecutive observed edge section that backs it. */
  interface IRunSpan {
    /** Index and increasing rational parameter interval of the native arc. */
    arc: number;
    from: number;
    to: number;
    /** The actual edge fragment, or the original complete observed ring. */
    points: readonly C.P[];
    /** Only an observed complete ring owns its last-to-first edge. */
    closed: boolean;
  }

  /** Associate all original vertices with finite native arcs and preserve each actual observed edge for reverse coverage. */
  export function runCorrespondence(
    section: IAutoMovieViewChain.ISection,
    run: readonly C.P[],
    whole: boolean,
  ): { spans: IRunSpan[]; matches: Exclude<ReturnType<typeof observedResiduals>, string> } | string {
    if (section.fault !== null || section.arcs.length < 3 ||
        run.length < (whole ? 3 : 2) || run.some((p): boolean => !p.every(Number.isFinite)))
      return "missing admitted section or finite directed source run";
    const spans: IRunSpan[] = whole
      ? section.arcs.map((_, arc): IRunSpan => ({ arc, from: 0, to: 1, points: run, closed: true }))
      : [];
    if (!whole) {
      type ICut = { part: number; point: C.P; boundary: number };
      const origin: C.P = [0, 0];
      const dot = (a: C.P, b: C.P): number => a[0] * b[0] + a[1] * b[1];
      const cross = (a: C.P, b: C.P): number => a[0] * b[1] - a[1] * b[0];
      const side = (a: C.P, b: C.P): number => orientAutoMovieSolidChart(origin, a, b);
      const boundaryAt = (point: C.P): number => section.arcs.findIndex(({ start }): boolean =>
        side(start, point) === 0 && dot(start, point) > 0);
      const read = (p: C.P): IAutoMovieViewChain.IRead | null => Q.read(section, Math.atan2(p[1], p[0]));
      const foot = (q: ICut, arc: number): number | undefined => {
        if (q.boundary === arc) return 0;
        if (q.boundary === (arc + 1) % section.arcs.length) return 1;
        const at = read(q.point);
        return at?.index === arc ? at.t : undefined;
      };
      let phase: number = Math.atan2(run[0]![1], run[0]![0]);
      let least: number = phase, greatest: number = phase;
      for (let edge: number = 1; edge < run.length; ++edge) {
        const a: C.P = run[edge - 1]!, b: C.P = run[edge]!;
        if ((side(a, b) === 0 && dot(a, b) <= 0) || (a[0] === b[0] && a[1] === b[1]))
          return "measured edge " + (edge - 1) + " has no finite nonzero traversal about the material origin";
        phase += Math.atan2(cross(a, b), dot(a, b));
        least = Math.min(least, phase);
        greatest = Math.max(greatest, phase);
        const cuts: ICut[] = [{ part: 0, point: a, boundary: boundaryAt(a) }];
        for (const [boundary, { start }] of section.arcs.entries()) {
          const from: number = side(start, a), to: number = side(start, b);
          if (from * to >= 0) continue;
          const d: number = cross(start, a), e: number = cross(start, b);
          const part: number = d / (d - e);
          if (!(part > 0 && part < 1)) return "native boundary crossing is unresolved on measured edge " + (edge - 1);
          const point: C.P = [a[0] + part * (b[0] - a[0]), a[1] + part * (b[1] - a[1])];
          if (dot(start, point) > 0) cuts.push({ part, point, boundary });
        }
        cuts.sort((a, b): number => a.part - b.part);
        cuts.push({ part: 1, point: b, boundary: boundaryAt(b) });
        for (let j: number = 1; j < cuts.length; ++j) {
          const left: ICut = cuts[j - 1]!, right: ICut = cuts[j]!;
          const midpoint: C.P = [left.point[0] + (right.point[0] - left.point[0]) / 2,
            left.point[1] + (right.point[1] - left.point[1]) / 2];
          const at = read(midpoint);
          if (at === null || !(left.part < right.part)) return "measured edge leaves its registered native arc";
          const u: number | undefined = foot(left, at.index), v: number | undefined = foot(right, at.index);
          if (u === undefined || v === undefined) return "the owned material interval cannot be read on the admitted arc";
          spans.push({ arc: at.index, from: Math.min(u, v), to: Math.max(u, v),
            points: [left.point, right.point], closed: false });
        }
      }
      if (!(greatest > least && greatest - least < 2 * Math.PI))
        return "the open measured run has no unique directed traversal on the cyclic material chart";
    }
    // Distance candidates can share overlapping intervals. Reverse coverage still reads each original finite edge fragment.
    const candidates: { arc: number; from: number; to: number }[] = [];
    for (const row of [...spans].sort((a, b): number => a.arc - b.arc || a.from - b.from)) {
      const previous = candidates.at(-1);
      if (previous?.arc === row.arc && row.from <= previous.to) previous.to = Math.max(previous.to, row.to);
      else candidates.push({ arc: row.arc, from: row.from, to: row.to });
    }
    const matches = observedResiduals(section, candidates, run);
    return typeof matches === "string" ? matches : { spans, matches };
  }

  /** Apply one local section derivative to all independent material ordinates of its family. */
  function chainColumns(
    row: ReadonlyMap<number, number>,
    basis: readonly number[],
    start: number,
  ): Map<number, number> {
    const out = new Map<number, number>();
    for (const [field, derivative] of row) {
      const offset: number = start + field * basis.length;
      for (let i: number = 0; i < basis.length; i++) {
        const value: number = derivative * basis[i]!;
        if (value !== 0) out.set(offset + i, value);
      }
    }
    return out;
  }
  /** Each projection is made once on the current oriented, owned section; its address is held for this linearization only. */
  function observedResiduals(
    section: IAutoMovieViewChain.ISection,
    spans: readonly { arc: number; from: number; to: number }[],
    points: readonly C.P[],
  ): { arc: number; t: number; at: C.P; residual: C.P }[] | string {
    if (section.fault !== null || spans.length === 0 || points.length < 2) return "the retained run lacks an admitted directed candidate span";
    const result: { arc: number; t: number; at: C.P; residual: C.P }[] = [];
    for (const p of points) {
      let best: { arc: number; t: number; point: C.P; distance: number } | undefined;
      for (const span of spans) {
        const arc = section.arcs[span.arc];
        if (arc === undefined || !(span.from >= 0 && span.from <= span.to && span.to <= 1))
          return "the candidate lobe addresses an absent conic arc";
        const candidate = closestOnArc(arc, span.from, span.to, p);
        if (best === undefined || candidate.distance < best.distance) best = { arc: span.arc, ...candidate };
      }
      if (best === undefined || !Number.isFinite(best.distance)) return "the owned arc has no finite physical candidate";
      result.push({ arc: best.arc, t: best.t, at: p, residual: [best.point[0] - p[0], best.point[1] - p[1]] });
    }
    return result;
  }

  /** Closest point on one already owned, oriented subarc; an excluded continuation is never a candidate. */
  export function closestOnArc(arc: IAutoMovieViewChain.IArc, from: number, to: number, p: C.P) {
    const w = arc.weight, d1 = 2 * (w - 1), d2 = -d1;
    const polynomial: number[] = [0, 0, 0, 0, 0];
    for (let k: number = 0; k < 2; k++) {
      const n0: number = arc.start[k]!;
      const n1: number = 2 * (w * arc.control[k]! - n0);
      const n2: number = n0 - 2 * w * arc.control[k]! + arc.end[k]!;
      const error = [n0 - p[k]!, n1 - d1 * p[k]!, n2 - d2 * p[k]!];
      const derivative = [n1 - n0 * d1, 2 * (n2 - n0 * d2), n2 * d1 - n1 * d2];
      for (let i: number = 0; i < error.length; i++)
        for (let j: number = 0; j < derivative.length; j++) polynomial[i + j]! += error[i]! * derivative[j]!;
    }
    const candidates: number[] = [from, to, ...rootsAutoMovieViewPolynomial(polynomial)
      .filter((t: number): boolean => t > from && t < to)];
    let best: { t: number; point: C.P; distance: number } | undefined;
    for (const t of candidates) {
      const point: C.P = Q.evaluate(arc, t);
      const distance: number = Math.hypot(point[0] - p[0], point[1] - p[1]);
      if (best === undefined || distance < best.distance) best = { t, point, distance };
    }
    return best!;
  }

  /** Material-coordinate perturbations for measured section differentials, in each field's native units. */
  export function sectionSteps(layout: C.ILayout): number[] {
    return C.units(layout).map((unit): number => unit === "mm" ? 1e-4 : 1e-6);
  }

  function weightedRows(row: IRow, residuals: IGroupRow[]): IGroupRow[] | string {
    const weight = vertices(row).weights;
    if (weight.length * 2 !== residuals.length) return "measured vertices and the owned-arc differential have different support";
    return residuals.map((entry, i): IGroupRow => {
      const factor = Math.sqrt(weight[Math.floor(i / 2)]!);
      return { value: factor * entry.value, gradient: new Map([...entry.gradient].map(([k, v]): [number, number] => [k, factor * v])) };
    });
  }

  /** Pull material-side inequality and closest-point residuals from the same admitted conic address. */
  function sourceSideRow(
    row: IRow, baseline: C.P, shifted: readonly C.P[], steps: readonly number[], basis: readonly number[],
    offset: number, outside: (s: number, p: C.P) => number, keep: 1 | -1,
  ): IGroupRow | string | null {
    const value = keep * outside(row.s, baseline);
    if (value === -Infinity) return null;
    if (!Number.isFinite(value)) return "the candidate section leaves the registered material ownership domain";
    const local = new Map<number, number>();
    for (const [f, p] of shifted.entries()) {
      const moved = keep * outside(row.s, p);
      if (!Number.isFinite(moved)) return "a material ownership derivative leaves its registered chart";
      local.set(f, (moved - value) / steps[f]!);
    }
    return { value, gradient: chainColumns(local, basis, offset) };
  }

  /** One signed native or buried-support inequality in the shared reduced source vector. */
  export interface IStartMargin extends IGroupRow {
    /** Named station, arc or field, and quantity in the physical owner. */
    label: string;
    /** A closed margin admits zero. Other native and shielding margins must be strictly positive. */
    closed: boolean;
    /** Positive reference scale for comparing feasibility across unlike material units. */
    scale: number;
  }

  /** Active extrema of an admitted quadratic, or its middle Bernstein ordinate when every site is active. */
  type RawWitness = { active: (number | null)[]; at: (site: number | null) => number };

  /** Distinct active sites remain distinct when a proposal combines several design directions. */
  function rawWitness(value: number, interior: number, flat: boolean, at: RawWitness["at"]): RawWitness {
    if (flat) return { active: [0, null, 1], at };
    const sites: number[] = [0, 1];
    if (interior > 0 && interior < 1) sites.push(interior);
    return { active: sites.filter((site): boolean => at(site) === value), at };
  }

  /** Margins of the native section at its actual control ordinates. Input shares keep their unsaturated values. */
  function groupMargins(
    fields: readonly number[], layout: C.ILayout, shares: readonly number[], margin: number, branch: readonly number[],
    firstPlane?: readonly [number, number, number], hard: boolean = false,
  ): { values: number[]; closed: boolean[]; labels: string[]; witnesses: Map<number, RawWitness> } | string {
    const input: IAutoMovieViewChain.IInput = C.resolve([...fields], layout).input;
    if (input.points.length < 3 || input.points.some((p): boolean => !p.every(Number.isFinite) || Math.hypot(...p) === 0))
      return "the raw section has no finite nonzero knot phase";
    const values: number[] = [], closed: boolean[] = [], labels: string[] = [], heights: number[] = [];
    const witnesses = new Map<number, RawWitness>(), heightWitnesses: RawWitness[] = [];
    const push = (label: string, x: number, inclusive: boolean): void => { labels.push(label); values.push(x); closed.push(inclusive); };
    const turn: number = 2 * Math.PI;
    const cross2 = (u: readonly number[], v: readonly number[]): number => u[0]! * v[1]! - u[1]! * v[0]!;
    const meeting = meetingSides(fields, layout);
    for (const [j, p] of input.points.entries()) {
      const i: number = (j + 1) % input.points.length, q = input.points[i]!;
      const principal: number = Math.atan2(cross2(p, q), p[0] * q[0] + p[1] * q[1]);
      const delta: number = principal + turn * Math.round((branch[j]! - principal) / turn);
      if (!(Math.abs(delta - branch[j]!) < Math.PI)) return "the adjacent knot phases have no unique continuation from the retained section";
      push("phase advance " + j, delta, false);
      const pair = meeting[j]!;
      push("start tangent meeting " + j, pair.a - margin, true); push("end tangent meeting " + j, pair.b - margin, true);
      const tangent = input.tangents[j]!;
      const chord: number = Math.hypot(p[0] - q[0], p[1] - q[1]);
      const ahead: number = pair.a * chord / Math.hypot(...tangent);
      const control: C.P = [p[0] + ahead * tangent[0], p[1] + ahead * tangent[1]];
      const w: number = input.shoulders[j]! / (1 - input.shoulders[j]!);
      const left: number = w * cross2(p, control), right: number = w * cross2(control, q), chordTurn: number = cross2(p, q);
      const linear: number = chordTurn - 2 * left, quadratic: number = left - chordTurn + right;
      const vertex: number = quadratic > 0 ? -linear / (2 * quadratic) : NaN;
      const least: number = Math.min(left, right, vertex > 0 && vertex < 1 ?
        left + linear * vertex + quadratic * vertex * vertex : Infinity);
      const square: number = chord * chord, angular: number = least / square;
      if (hard)
        witnesses.set(values.length, rawWitness(angular, vertex, left === right && chordTurn === 2 * left, (t): number => {
          const numerator: number = t === null ? chordTurn / 2 : t === 0 ? left : t === 1 ? right :
            left + linear * t + quadratic * t * t;
          return numerator / square;
        }));
      push("signed angular numerator " + j, angular, false);
      if (firstPlane !== undefined) {
        if (!(Number.isFinite(w) && w > 0)) return "the raw support arc lacks a positive homogeneous weight";
        const height = (xy: C.P): number => firstPlane[0] + firstPlane[1] * xy[0] + firstPlane[2] * xy[1];
        const a: number = height(p), b: number = w * height(control), c: number = height(q);
        const minimum: number = -K.planeMaximum(a, b, c);
        heights.push(minimum);
        if (hard) {
          const curvature: number = a - 2 * b + c;
          const vertex: number = curvature < 0 ? (a - b) / curvature : NaN;
          heightWitnesses.push(rawWitness(minimum, vertex, a === b && b === c, (t): number =>
            -(t === null ? b : t === 0 ? a : t === 1 ? c :
              (1 - t) * ((1 - t) * a + t * b) + t * ((1 - t) * b + t * c))));
        }
      }
    }
    for (const field of shares) {
      push("lower share " + field, fields[field]!, false);
      push("upper share " + field, 1 - fields[field]!, false);
    }
    heights.forEach((value, i): void => {
      if (hard) witnesses.set(values.length, heightWitnesses[i]!);
      push("homogeneous plane numerator " + i, value, false);
    });
    return values.every(Number.isFinite) ? { values, closed, labels, witnesses } : "the raw tangent or material margin is singular";
  }

  /** Prepare all independently observed and regular dense station rows once, before constructing any sibling wall. */
  function preparePrefixMargins(tail: K.ITailFit, rows: readonly IRow[], layout: C.ILayout, margin: number) {
    const grid = new Set<number>([...tail.knots.filter((s): boolean => s <= tail.mark), tail.mark]);
    for (const row of rows) if (!row.heldout && row.s < tail.mark) grid.add(row.s);
    for (let i: number = 0; tail.knots[0]! + i * DENSE_MM < tail.mark; ++i)
      grid.add(tail.knots[0]! + i * DENSE_MM);
    const basis = basisOf(tail.knots);
    const sites = [...grid].sort((a, b): number => a - b).map((s) => {
      const full: number[] = basis(s);
      return { s, full, free: tail.basis(full) };
    });
    const shares: number[] = C.units(layout).flatMap((u, f): number[] => u === "share" ? [f] : []);
    const retained = C.chain(tail.initial.map((v): number => v[tail.knots.indexOf(tail.mark)]!), layout);
    if (retained.fault !== null) throw new Error("the protected station cannot register an angular branch: " + retained.fault);
    const branch: number[] = retained.arcs.map((arc): number => arc.span[1] - arc.span[0]);
    const steps: number[] = sectionSteps(layout);
    return (
      values: readonly (readonly number[])[], offset: number, derivatives: boolean,
      firstPlane?: readonly [number, number, number], hard: boolean = false,
    ) => {
      const margins: IStartMargin[] = [];
      let fault: string | null = null;
      for (const site of sites) {
        const fields: number[] = values.map((column): number => column.reduce((a, y, j): number => a + y * site.full[j]!, 0));
        const plane = site.s === tail.knots[0] ? firstPlane : undefined;
        if (plane !== undefined && !(plane[0] < 0)) return "the hidden source axis is outside the negative half space at " + site.s + " mm";
        const evaluate = (input: readonly number[]): ReturnType<typeof groupMargins> =>
          groupMargins(input, layout, shares, margin, branch, plane, hard && derivatives);
        const raw = evaluate(fields);
        if (typeof raw === "string") return raw + " at " + site.s + " mm";
        const native = C.chain(fields, layout);
        if (fault === null && native.fault !== null) fault = native.fault + " at " + site.s + " mm";
        const rows = raw.values.map((_, k: number) =>
          (raw.witnesses.get(k)?.active ?? [undefined]).map((parameter) => ({ parameter, gradient: new Map<number, number>() })));
        if (rows.some((row): boolean => row.length === 0))
          return "a physical material extremum lacks an active witness at " + site.s + " mm";
        if (derivatives && site.free.some((b): boolean => b !== 0)) for (const [field, step] of steps.entries()) {
          const moved: number[] = [...fields]; moved[field]! += step;
          const trial = evaluate(moved);
          if (typeof trial === "string") return trial + " in the differential at " + site.s + " mm";
          for (const [k, v] of raw.values.entries()) {
            const share: number = k - 4 * branch.length;
            for (const { parameter, gradient } of rows[k]!) {
              if (share >= 0 && share < 2 * shares.length) {
                if (shares[Math.floor(share / 2)] === field)
                  gradient.set(field, share % 2 === 0 ? 1 : -1);
                continue;
              }
              const next: number = parameter === undefined ? trial.values[k]! : trial.witnesses.get(k)!.at(parameter);
              const diff: number = next - v;
              if (k < 4 * branch.length && k % 4 === 0 && Math.abs(diff) >= Math.PI)
                return "the differential crosses the registered angular branch at " + site.s + " mm";
              if (!Number.isFinite(diff)) return "a physical material witness is nonfinite at " + site.s + " mm";
              if (diff !== 0) gradient.set(field, diff / step);
            }
          }
        }
        for (const [k, value] of raw.values.entries()) {
          const isHeight: boolean = k >= 4 * branch.length + 2 * shares.length;
          for (const { gradient } of rows[k]!)
            margins.push({ value, gradient: chainColumns(gradient, site.free, offset),
              label: site.s + " mm " + raw.labels[k]!, closed: raw.closed[k]!, scale: isHeight ? -plane![0] : 1 });
        }
      }
      return { margins, fault };
    };
  }

  /** A positive similarity of the protected canonical section on a named buried section plane, expressed in the fixed suffix subspace. */
  export function similarStart(
    tail: K.ITailFit, family: K.IStored, plane: readonly [number, number, number],
  ): { values: number[][]; scale: number; support: number } | string {
    const [d, u, v] = plane;
    if (!(d < 0)) return "the proposed buried section centre reaches the terminal plane";
    const target: number[] = K.reader(family)(tail.mark);
    const protectedSection = C.chain(target, family.layout);
    if (protectedSection.fault !== null) return protectedSection.fault;
    let support: number = -Infinity;
    for (const arc of protectedSection.arcs) {
      const h = (xy: C.P): number => u * xy[0] + v * xy[1];
      const w: number = arc.weight, a: number = h(arc.start), b: number = w * h(arc.control), c: number = h(arc.end);
      const n1: number = 2 * (b - a), n2: number = a - 2 * b + c, d1: number = 2 * (w - 1), d2: number = 2 * (1 - w);
      const critical = rootsAutoMovieViewPolynomial([n1 - a * d1, 2 * (n2 - a * d2), n2 * d1 - n1 * d2]);
      for (const t of [0, ...critical, 1]) support = Math.max(support, h(Q.evaluate(arc, t)));
    }
    if (!Number.isFinite(support)) return "the protected section has no finite signed support";
    const scale: number = d + support < 0 ? 1 : -d / (2 * support);
    if (!(Number.isFinite(scale) && scale > 0)) return "no positive section similarity lies in the negative half space";
    const units = C.units(family.layout);
    const shape = target.map((value, k): number => units[k] === "mm" ? scale * value : value);
    const proof = K.beforePlane(C.chain(shape, family.layout), d, u, v);
    if (proof !== null) return proof;
    const basis = tail.basis(tail.knots.map((_, j): number => Number(j === 0)));
    const square: number = basis.reduce((sum, x): number => sum + x * x, 0);
    if (!(square > 0)) return "the buried section has no free ordinate on the protected material subspace";
    const values = tail.initial.map((field, k): number[] => tail.expand(k, tail.free.map((j, i): number =>
      field[j]! + (shape[k]! - field[0]!) * basis[i]! / square)));
    const stored = { ...family, knots: tail.knots, values };
    const saved: K.IStored = JSON.parse(JSON.stringify(stored)) as K.IStored;
    const absent = tail.check(stored) ?? tail.check(saved) ?? K.tailPolicyFault(saved, family) ??
      K.beforePlane(C.chain(saved.values.map((field): number => field[0]!), family.layout), d, u, v);
    return absent ?? { values, scale, support };
  }

  /**
   * Reduce the largest signed material deficit inside the fixed canonical-prefix subspace.
   * Trial reads keep every declared inequality and use the actual native chain for acceptance. A stationary local step
   * or exhausted owner budget reports the remaining row with its units and cannot establish global infeasibility.
   *
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's sparse diagonal-program solver on signed affine rows. The anatomical caller owns the physical measures and suffix basis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solved linear subproblem cannot admit an unverified nonlinear source or a zero strict margin.
   */
  export function restoreGroup(
    initial: readonly number[],
    read: (state: readonly number[], derivatives: boolean) => { margins: IStartMargin[]; fault: string | null } | string,
    updates: number,
    observe?: (reading: object) => void,
  ) {
    let values: number[] = [...initial], iteration: number = 0;
    const units: number[] = initial.map((x): number => Math.max(1, Math.abs(x)));
    const receipts: { iteration: number; rows: number; failed: number; worst: string; raw: number; scaled: number;
      scope?: number; status?: number; maximumViolation?: number; stationarityResidual?: number; slack?: number }[] = [];
    const terminal = (stopped: string | null) => ({ values, iteration, stopped, receipts });
    const score = (margins: readonly IStartMargin[]) => {
      const low = margins.reduce((a, b) => a.value / a.scale <= b.value / b.scale ? a : b);
      const failed: number = margins.filter((row): boolean => row.closed ? row.value < 0 : row.value <= 0).length;
      return { low, failed, minimum: low.value / low.scale };
    };
    while (true) {
      observe?.({ action: "canonical inequalities", state: "start", iteration });
      const baseStart: number = performance.now();
      const base = read(values, true);
      observe?.({ action: "canonical inequalities", state: "returned", iteration, phaseMs: Math.round(performance.now() - baseStart),
        ...(typeof base === "string" ? { refusal: base } : { rows: base.margins.length, fault: base.fault }) });
      if (typeof base === "string") return terminal(base);
      if (base.margins.length === 0) return terminal("the raw material scope has no declared constraints");
      const now = score(base.margins);
      const record: (typeof receipts)[number] = { iteration, rows: base.margins.length, failed: now.failed,
        worst: now.low.label, raw: now.low.value, scaled: now.minimum };
      receipts.push(record);
      if (now.failed === 0) return terminal(base.fault);
      if (iteration >= updates) return terminal("joint feasibility consumed the available updates at " + now.low.label);
      const fixed = base.margins.find((row): boolean => (row.closed ? row.value < 0 : row.value <= 0) &&
        ![...row.gradient.values()].some((d): boolean => Number.isFinite(d) && d !== 0));
      if (fixed !== undefined) return terminal("a violated material row has no first-order free direction at this start: " + fixed.label);
      const columns: number[] = [...new Set(base.margins.flatMap((row): number[] => [...row.gradient.keys()]))].sort((a, b): number => a - b);
      const indices = new Map(columns.map((col, i) => [col, i] as const));
      const slack: number = columns.length;
      const strictBoundary: boolean = now.minimum >= 0;
      const all = base.margins.map((row) => {
        const columns: number[] = [], weights: number[] = [];
        let reach: number = 0;
        for (const [field, derivative] of row.gradient) {
          const weight: number = derivative * units[field]! / row.scale;
          columns.push(indices.get(field)!);
          weights.push(weight);
          reach += Math.abs(weight);
        }
        const elastic: boolean = !strictBoundary || !row.closed;
        const lower: number = -row.value / row.scale;
        const affine: IAutoMovieQuadraticRow = { indices: [...columns, slack],
          weights: [...weights, elastic ? 1 : 0], lower, upper: null };
        return { affine, elastic, lower, reach };
      });
      let accepted: number[] | undefined;
      for (let attempt: number = 0; attempt < 12; ++attempt) {
        const scope: number = 2 ** -attempt;
        // Safe screening of the phase-I program (a row that cannot bind anywhere in the step's box cannot change its solution): within
        // the box |x_j| <= scope a row's affine part moves by at most `reach = scope * sum |w_j|`. A row sharing the slack `t` binds only
        // where `lower - w x = t`, and `t` is at least the largest `lower_i - reach_i`, so a row with `lower + reach` below that level
        // never binds; a row without the slack binds only if `lower + reach > 0`. Only the rows that may bind enter the program; the
        // nonlinear trial below still reads every row. (El Ghaoui, Viallon and Rabbani, Safe feature elimination in sparse supervised
        // learning, Pacific J Optim 8(4), 2012, the same bound applied to inequality rows.)
        const level: number = all.reduce((bound, { elastic, lower, reach }): number =>
          elastic ? Math.max(bound, lower - scope * reach) : bound, -Infinity);
        const binding: IAutoMovieQuadraticRow[] = all.filter(({ elastic, lower, reach }): boolean =>
          elastic ? lower + scope * reach >= level : lower + scope * reach > 0).map(({ affine }) => affine);
        // The rows are block-diagonal: a member's raw rows read its own values only. The program separates into one per connected block
        // of rows and columns, each with its own slack; the joint slack is the largest of theirs, so solving the blocks apart gives the
        // joint program's optimum. A block with no violated row is not solved: its step is zero and its slack its own worst row.
        const root: number[] = columns.map((_, j: number): number => j);
        const findRoot = (j: number): number => { while (root[j] !== j) { root[j] = root[root[j]!]!; j = root[j]!; } return j; };
        for (const row of binding) {
          const own = row.indices.slice(0, -1);
          for (const j of own.slice(1)) root[findRoot(j)] = findRoot(own[0]!);
        }
        const blocks = new Map<number, IAutoMovieQuadraticRow[]>();
        for (const row of binding) {
          if (row.indices.length < 2) continue;
          const key: number = findRoot(row.indices[0]!);
          const list = blocks.get(key);
          if (list === undefined) blocks.set(key, [row]); else list.push(row);
        }
        observe?.({ action: "affine feasibility", state: "start", iteration, attempt, rows: all.length, screened: binding.length, blocks: blocks.size });
        const affineStart: number = performance.now();
        const step: number[] = columns.map((): number => 0);
        let joint: number = -Infinity, violation: number = 0, stationarity: number = 0, unavailable: boolean = false, solved: number = 0;
        for (const rows of blocks.values()) {
          // A row sharing the slack fails at a zero margin too (its margin must be positive), a closed one only below zero.
          const violated: boolean = rows.some((row): boolean => (row.weights.at(-1) !== 0 ? row.lower! >= 0 : row.lower! > 0));
          if (!violated) {
            joint = Math.max(joint, ...rows.filter((row): boolean => row.weights.at(-1) !== 0).map((row): number => row.lower!));
            continue;
          }
          const local: number[] = [...new Set(rows.flatMap((row): number[] => row.indices.slice(0, -1)))].sort((a, b): number => a - b);
          const at = new Map(local.map((j, i) => [j, i] as const));
          const own = local.length;
          const program = solveAutoMovieQuadraticProgram({
            diagonal: [...local.map((): number => 0), 0], linear: [...local.map((): number => 0), 1],
            rows: [...rows.map((row): IAutoMovieQuadraticRow => ({ ...row, indices: [...row.indices.slice(0, -1).map((j): number => at.get(j)!), own] })),
              ...local.map((_, i): IAutoMovieQuadraticRow => ({ indices: [i], weights: [1], lower: -scope, upper: scope }))],
          });
          ++solved;
          if (program.status !== 1 || ![program.primalResidual, program.dualResidual, program.maximumViolation, program.stationarityResidual,
              ...program.primal].every(Number.isFinite)) { unavailable = true; break; }
          local.forEach((j, i): void => { step[j] = program.primal[i]!; });
          joint = Math.max(joint, program.primal[own]!);
          violation = Math.max(violation, program.maximumViolation);
          stationarity = Math.max(stationarity, program.stationarityResidual);
        }
        observe?.({ action: "affine feasibility", state: "returned", iteration, attempt, status: unavailable ? 0 : 1, solved,
          phaseMs: Math.round(performance.now() - affineStart) });
        Object.assign(record, { scope, status: unavailable ? 0 : 1, maximumViolation: violation, stationarityResidual: stationarity, slack: joint });
        if (unavailable) return terminal("the bounded material phase-I program is unavailable at " + now.low.label);
        const predicted: number = -joint;
        if (!(predicted - violation > now.minimum)) return terminal("the local material inequalities have no resolved improving step at " + now.low.label);
        const trial: number[] = [...values];
        columns.forEach((col, j): void => { trial[col]! += units[col]! * step[j]!; });
        observe?.({ action: "nonlinear feasibility", state: "start", iteration, attempt });
        const trialStart: number = performance.now();
        const next = read(trial, false);
        observe?.({ action: "nonlinear feasibility", state: "returned", iteration, attempt, phaseMs: Math.round(performance.now() - trialStart),
          ...(typeof next === "string" ? { refusal: next } : { rows: next.margins.length, fault: next.fault }) });
        if (typeof next === "string" || next.margins.length !== base.margins.length) continue;
        const measured = score(next.margins);
        if (measured.failed === 0 && next.fault === null || measured.minimum > now.minimum ||
            strictBoundary && measured.minimum >= 0 && measured.failed < now.failed) { accepted = trial; break; }
      }
      if (accepted === undefined) return terminal("the full nonlinear material rows did not improve in the bounded step at " + now.low.label);
      values = accepted;
      iteration++;
    }
  }

  /** Reuse the single-fit source-restoration and admission functions, stopping before any independent shape update. */
  export function prepareGroupMember(
    rows: readonly IRow[], tail: K.ITailFit, family: K.IStored, margin: number = ADMISSIBLE_MARGIN,
  ) {
    const independent = rows.filter((row): boolean => !row.heldout).map((row): number => row.s);
    if (independent.length === 0) throw new Error(family.name + " has no independently measured training stations");
    const shares = C.units(family.layout).flatMap((unit, i): number[] => unit === "share" ? [i] : []);
    const fault = (section: number[]): string | null => {
      const chain = C.chain(section, family.layout).fault;
      if (chain !== null) return "conic chain: " + chain;
      const meetings = leastMeetings(section, family.layout);
      const least = Math.min(...meetings);
      if (!Number.isFinite(least) || least < margin)
        return "tangent meeting " + meetings.indexOf(least) + " is " + least + " below " + margin;
      const outside = shares.find((index): boolean => !(section[index]! > 0 && section[index]! < 1));
      return outside === undefined ? null : "share " + outside + " is " + section[outside] + " outside (0,1)";
    };
    const stations = new Set<number>([...tail.knots.filter((s): boolean => s <= tail.mark), ...independent, tail.mark]);
    for (let j = 0; tail.knots[0]! + j * DENSE_MM < tail.mark; ++j) stations.add(tail.knots[0]! + j * DENSE_MM);
    const dense = [...stations].sort((a, b): number => a - b);
    const read = (stock: K.IStored): string | null => {
      const source = K.reader(stock);
      for (const s of dense) {
        if (s < stock.knots[0]!) continue;
        const reason = fault(source(s));
        if (reason !== null) return stock.name + " at " + s + " mm: " + reason;
      }
      return null;
    };
    const candidate: K.IStored = { ...family, knots: tail.knots, values: tail.initial };
    const baseline = K.reader(family);
    const retained = (s: number): boolean => s >= family.knots[0]! && s <= family.knots.at(-1)!;
    const shared = family.knots.filter((s): boolean => s >= tail.mark);
    for (const s of shared) {
      const reason = fault(baseline(s));
      if (reason !== null) throw new Error("stored material before refinement: " + reason + " at protected " + s + " mm");
    }
    // Initial knot insertion is exact on the original domain, including a proximal
    // row whose margin the common restoration is responsible for improving.
    const serialized: K.IStored = JSON.parse(JSON.stringify(candidate)) as K.IStored;
    const exact = K.materialDifference(family, candidate, retained) ?? K.materialDifference(family, serialized, retained) ??
      tail.check(candidate) ?? tail.check(serialized) ?? K.tailPolicyFault(serialized, family);
    if (exact !== null) throw new Error("exact canonical insertion: " + exact);
    const raw = preparePrefixMargins(tail, rows, family.layout, margin);
    const candidateFault = (values: number[][]): string | null => read({ ...candidate, values });
    return { tail, raw, fault: candidateFault, check: (values: number[][]): boolean => candidateFault(values) === null };
  }

  /** Only independently owned exposed arcs are measured. Hidden start spans never acquire invented observation rows. */
  export function verifyOwned(
    member: { family: K.IStored; observed: readonly IRow[]; tail: K.ITailFit; whole: (s: number) => boolean },
    candidate: K.IStored, limit: number,
    physical?: (s: number) => { section: IAutoMovieViewChain.ISection; distance: (witness: C.P, fitted: C.P) => number; frameGap: (witness: C.P) => number },
  ) {
    const read = K.reader(candidate);
    const rows: K.IPrefixObservation[] = [];
    const faults: { station: number; detail: string }[] = [];
    for (const row of member.observed) {
      let maximum = 0, count = 0;
      try {
        const placed = physical?.(row.s);
        const section = placed?.section ?? C.chain(read(row.s), candidate.layout);
        if (section.fault !== null || row.runs === undefined)
          throw new Error(section.fault ?? "no directed independent observation");
        const whole = member.whole(row.s);
        for (const [runIndex, run] of row.runs.entries()) {
          const correspondence = runCorrespondence(section, run, whole);
          if (typeof correspondence === "string") {
            faults.push({ station: row.s, detail: "run " + runIndex + ": " + correspondence });
            continue;
          }
          for (const match of correspondence.matches) {
            const error = placed === undefined ? Math.hypot(...match.residual) :
              placed.distance(match.at, Q.evaluate(section.arcs[match.arc]!, match.t));
            if (!Number.isFinite(error)) throw new Error("the actual source has no finite error on its retained material");
            maximum = Math.max(maximum, error);
            ++count;
          }
          // The displacement of a measured straight edge between two affine frames is bounded by its endpoints.
          const allowance = limit - (placed === undefined ? 0 : Math.max(...run.map(placed.frameGap)));
          for (const span of correspondence.spans) {
            if (span.from === span.to) continue;
            const detail = reverseCoverage(section.arcs[span.arc]!, span.from, span.to, span.points, span.closed, allowance);
            if (detail !== null) faults.push({ station: row.s, detail });
          }
        }
      } catch (error: unknown) { faults.push({ station: row.s, detail: error instanceof Error ? error.message : String(error) }); }
      rows.push({ s: row.s, heldout: row.heldout, points: count, maximumMm: maximum });
    }
    const visible = Math.min(...member.observed.map((row): number => row.s));
    const prefix = candidate.knots.filter((s): boolean => s >= visible && s < member.tail.mark);
    const evidence = K.prefixEvidence(prefix, member.tail.mark, rows, limit);
    return { rows, visible, faults, ...evidence, supported: evidence.supported && faults.length === 0 };
  }

  /** Convex capsule bound for a projected positive homogeneous control triangle and a finite measured edge. */
  function edgeCapsule(
    net: readonly AutoMovieVector3Tuple[],
    a: C.P,
    b: C.P,
    radius: number,
  ): boolean {
    const x: number = b[0] - a[0], y: number = b[1] - a[1];
    const length: number = x * x + y * y;
    if (!(Number.isFinite(length) && length > 0 && Number.isFinite(radius) && radius >= 0)) return false;
    return net.length === 3 && net.every(([hx, hy, w]): boolean => {
      if (!(w > 0 && [w, hx, hy].every(Number.isFinite))) return false;
      const dx: number = hx / w - a[0], dy: number = hy / w - a[1];
      const t: number = Math.max(0, Math.min(1, (dx * x + dy * y) / length));
      return Math.hypot(dx - t * x, dy - t * y) <= radius;
    });
  }

  /** Coverage of every parameter on an owned rational subarc against closed capsules of actual finite observed edges. */
  export function reverseCoverage(
    arc: IAutoMovieViewChain.IArc, from: number, to: number, points: readonly C.P[], closed: boolean, distance: number,
  ): string | null {
    const edges = points.flatMap((a, i): [C.P, C.P][] => {
      if (!closed && i + 1 === points.length) return [];
      const b = points[(i + 1) % points.length]!;
      return a[0] === b[0] && a[1] === b[1] ? [] : [[a, b]];
    });
    if (!(from >= 0 && from < to && to <= 1 && distance >= 0 && edges.length > 0 &&
      Number.isFinite(arc.weight) && arc.weight > 0)) return "missing positive-weight subarc or measured finite edges";
    const controls: AutoMovieVector3Tuple[] = [[arc.start[0], arc.start[1], 1],
      [arc.weight * arc.control[0], arc.weight * arc.control[1], arc.weight], [arc.end[0], arc.end[1], 1]];
    const stack = [{ lo: from, hi: to, net: AutoMovieBernstein64.restrict(controls, from, to) }];
    while (stack.length > 0) {
      const row = stack.pop()!;
      if (edges.some(([a, b]): boolean => edgeCapsule(row.net, a, b, distance))) continue;
      const mid = row.lo + (row.hi - row.lo) / 2;
      if (!(mid > row.lo && mid < row.hi)) return "the owned subarc did not certify finite-edge coverage before roundoff";
      for (const site of [row.lo, mid, row.hi]) {
        const p = Q.evaluate(arc, site);
        const d = Math.min(...edges.map(([a, b]) => finiteEdgeDistance(p, a, b)));
        if (!(d <= distance)) return "the owned subarc is " + d + " mm from the independent measured finite edges at " + site;
      }
      const [left, right] = AutoMovieBernstein64.split(row.net, 0.5);
      stack.push({ lo: row.lo, hi: mid, net: left }, { lo: mid, hi: row.hi, net: right });
    }
    return null;
  }

  function finiteEdgeDistance(p: C.P, a: C.P, b: C.P): number {
    const u = b[0] - a[0], v = b[1] - a[1], length = u * u + v * v;
    const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * u + (p[1] - a[1]) * v) / length));
    return Math.hypot(p[0] - a[0] - t * u, p[1] - a[1] - t * v);
  }

  /** Solve a symmetric positive-definite system by Cholesky factorisation in place; null when it is not positive definite. */
  export function solve(A: number[][], b: number[]): number[] | null {
    return cholesky(A) ? solveFactored(A, b) : null;
  }

  /** Factor a symmetric positive-definite matrix in place into its lower Cholesky factor; false when it is not positive definite. */
  function cholesky(A: number[][]): boolean {
    const n: number = A.length;
    for (let j: number = 0; j < n; ++j) {
      const row: number[] = A[j]!;
      let d: number = row[j]!;
      for (let k: number = 0; k < j; ++k) d -= row[k]! * row[k]!;
      if (!(d > 0)) return false;
      const root: number = Math.sqrt(d);
      row[j] = root;
      for (let i: number = j + 1; i < n; ++i) {
        const other: number[] = A[i]!;
        let v: number = other[j]!;
        for (let k: number = 0; k < j; ++k) v -= other[k]! * row[k]!;
        other[j] = v / root;
      }
    }
    return true;
  }

  /** What `activeSet` returns: the step, each row's signed multiplier, and its work. */
  export interface IActiveSet {
    /** The step. */
    primal: number[];
    /** Each row's multiplier: positive on its upper bound, negative on its lower one, zero off both. */
    dual: number[];
    /** Active-set iterations: one equality subproblem each. */
    iterations: number;
    /** Rows active at the start: none, the dual method starts from the unconstrained minimum and takes the violated rows one at a time. */
    warm: number;
    /** Rows active at the end. */
    working: number;
    /** Diagonal blocks of the Hessian, each factored on its own. */
    blocks: number;
  }

  /** The connected components of the Hessian's off-diagonal graph. A diagonal shift changes no edge. */
  function prepareHessianBlocks(hessian: readonly (readonly number[])[]): readonly (readonly number[])[] {
    const n: number = hessian.length;
    const parent: number[] = Array.from({ length: n }, (_, i: number): number => i);
    const find = (i: number): number => {
      while (parent[i] !== i) { parent[i] = parent[parent[i]!]!; i = parent[i]!; }
      return i;
    };
    for (let i = 0; i < n; ++i)
      for (let j = 0; j < i; ++j)
        if (hessian[i]![j] !== 0) parent[find(i)] = find(j);
    const members = new Map<number, number[]>();
    for (let i = 0; i < n; ++i) {
      const root: number = find(i);
      const list = members.get(root);
      if (list === undefined) members.set(root, [i]);
      else list.push(i);
    }
    return [...members.values()];
  }

  /**
   * A strictly convex QP `min 1/2 d^T H d + c^T d` over affine rows `lower <= a d <= upper`, by the dual active-set method of Goldfarb and
   * Idnani (Math. Programming 27, 1983, 1-33; the method of R's `quadprog`). It starts from the unconstrained minimum `-H^-1 c` and takes
   * the most violated row at a time, moving the primal along `z = J2 J2^T n` and the multipliers along `r = R^-1 J1^T n`; a full step
   * makes the row active, and a partial step drops the active row whose multiplier reaches zero first. The multipliers stay
   * non-negative throughout, so the method ends in finitely many steps without the primal method's degenerate cycling (which refused the
   * arm's root refit 27 times in 31 steps, 2026-11-24). It needs no feasible start, and rows infeasible together are refused by name.
   *
   * `J = L^-T Q` and `R` are kept as `J^T N_A = [R; 0]`, updated by Givens rotations when a row joins or leaves, the numerically stable
   * form of the update (Powell, "On the quadratic programming algorithm of Goldfarb and Idnani", Math. Programming Study 25, 1985;
   * Golub and Van Loan, Matrix Computations, 4th ed., section 6.5). `L` is the Hessian's Cholesky factor per diagonal block, the connected components of
   * its sparsity graph: a fairing row reads one member's values, so each member is a block and `J` starts block-diagonal. A row is taken
   * only when violated beyond `min(tolerance, 1e-8)` of its own bound's size, and a row in the active rows' span (`|J2^T n|^2` under
   * 1e-12 of `|J^T n|^2`) moves only the multipliers. The rows are read as given, never whitened.
   *
   * @param hessian The symmetric positive-definite Hessian.
   * @param linear The linear term.
   * @param rows The rows.
   * @param tolerance The feasibility tolerance, in the rows' own units.
   * @param ordering The connected components of this Hessian's graph, reusable across its diagonal shifts.
   * @returns The solution, or why the method does not apply or did not finish.
   */
  export function activeSet(
    hessian: readonly (readonly number[])[], linear: readonly number[], rows: readonly IAutoMovieQuadraticRow[], tolerance: number,
    ordering: readonly (readonly number[])[] = prepareHessianBlocks(hessian),
  ): IActiveSet | string {
    const n: number = linear.length;
    const blocks: { columns: readonly number[]; factor: number[][] }[] = [];
    const blockOf: number[] = new Array<number>(n).fill(0), local: number[] = new Array<number>(n).fill(0);
    for (const columns of ordering) {
      const factor = columns.map((i): number[] => columns.map((j): number => hessian[i]![j]!));
      if (!cholesky(factor)) return "the step's Hessian block is not positive definite";
      columns.forEach((i, k): void => { blockOf[i] = blocks.length; local[i] = k; });
      blocks.push({ columns, factor });
    }
    // Each row's two sides as constraints `n . d >= b` with `n = -sign a` and `b = -bound`, so `sign a d <= bound`.
    type Side = { row: number; sign: 1 | -1; bound: number };
    const sides: Side[] = [];
    for (const [r, row] of rows.entries())
      for (const [sign, end] of [[1, row.upper], [-1, row.lower === null ? null : -row.lower]] as const)
        if (end !== null) sides.push({ row: r, sign, bound: end });
    const along = (q: number, v: ArrayLike<number>): number => {
      const side = sides[q]!, row = rows[side.row]!;
      let sum = 0;
      for (let k = 0; k < row.indices.length; ++k) sum += row.weights[k]! * v[row.indices[k]!]!;
      return side.sign * sum;
    };
    const slack = (q: number, x: ArrayLike<number>): number => sides[q]!.bound - along(q, x);

    // The unconstrained minimum `x = -G^-1 c` and `J = L^-T`, both block by block.
    const J: Float64Array[] = Array.from({ length: n }, (): Float64Array => new Float64Array(n));
    const x = new Float64Array(n);
    for (const block of blocks) {
      const size: number = block.columns.length;
      for (let k = 0; k < size; ++k) {
        const unitColumn: number[] = new Array<number>(size).fill(0);
        unitColumn[k] = 1;
        const column: number[] = backwardFactored(block.factor, unitColumn);
        block.columns.forEach((i: number, r: number): void => { J[block.columns[k]!]![i] = column[r]!; });
      }
      const solved: number[] = solveFactored(block.factor, block.columns.map((i: number): number => -linear[i]!));
      block.columns.forEach((i: number, r: number): void => { x[i] = solved[r]!; });
    }

    // The active rows, their multipliers, and `R` by columns (column j holds rows 0 to j): `J^T N_A = [R; 0]`.
    const active: number[] = [];
    let u: number[] = [];
    const R: number[][] = [];
    const inActive = new Uint8Array(sides.length);

    /** Derive an orthogonal Givens rotation in the scaled pivot plane (Goldfarb and Idnani, 1983, section 4). */
    const rotation = (w: number, v: number): { c: number; s: number; h: number } => {
      const scale: number = Math.max(Math.abs(w), Math.abs(v));
      const a: number = w / scale, b: number = v / scale;
      const norm: number = Math.hypot(a, b);

      // The stored pivot may round in the subnormal range. The rotation coefficients already have unit norm at full precision.
      return { c: a / norm, s: b / norm, h: scale * norm };
    };
    const rotate = (a: number, b: number, c: number, s: number): void => {
      const A = J[a]!, B = J[b]!;
      for (let i = 0; i < n; ++i) { const p = A[i]!, q = B[i]!; A[i] = c * p + s * q; B[i] = -s * p + c * q; }
    };
    const drop = (k: number, multipliers: number[]): void => {
      inActive[active[k]!] = 0;
      active.splice(k, 1);
      multipliers.splice(k, 1);
      R.splice(k, 1);
      for (let j = k; j < R.length; ++j) {
        const a: number = R[j]![j]!, b: number = R[j]![j + 1]!;
        if (a !== 0 || b !== 0) {
          const { c, s, h } = rotation(a, b);
          R[j]![j] = h;
          for (let m: number = j + 1; m < R.length; ++m) {
            const p: number = R[m]![j]!, q: number = R[m]![j + 1]!;
            R[m]![j] = c * p + s * q;
            R[m]![j + 1] = -s * p + c * q;
          }
          rotate(j, j + 1, c, s);
        }
        R[j]!.length = j + 1;
      }
    };
    const scale: number = Math.min(tolerance, 1e-8);
    const limit: number = 10 * (n + sides.length);
    let iterations: number = 0;
    for (;;) {
      // The most violated row; none beyond rounding of its own bound means optimal.
      let p = -1, worst = 0;
      for (let q = 0; q < sides.length; ++q) {
        if (inActive[q] === 1) continue;
        const s = slack(q, x);
        if (s < -scale * (1 + Math.abs(sides[q]!.bound)) && s < worst) { worst = s; p = q; }
      }
      if (p < 0) break;
      const np = new Float64Array(n);
      { const row = rows[sides[p]!.row]!; row.indices.forEach((i: number, k: number): void => { np[i] = -sides[p]!.sign * row.weights[k]!; }); }
      const plus: number[] = [...u, 0];
      for (;;) {
        if (++iterations > limit) return "the step's dual active set did not finish in " + limit + " iterations";
        const q = active.length;
        // d = J^T n_p; the primal step z = J2 d2 and the dual step r = R^-1 d1.
        const d = new Float64Array(n);
        for (let j = 0; j < n; ++j) { const column = J[j]!; let sum = 0; for (let i = 0; i < n; ++i) sum += column[i]! * np[i]!; d[j] = sum; }
        const z = new Float64Array(n);
        for (let j = q; j < n; ++j) { const w = d[j]!; if (w === 0) continue; const column = J[j]!; for (let i = 0; i < n; ++i) z[i]! += w * column[i]!; }
        const r: number[] = new Array<number>(q).fill(0);
        for (let i = q - 1; i >= 0; --i) { let v = d[i]!; for (let j = i + 1; j < q; ++j) v -= R[j]![i]! * r[j]!; r[i] = v / R[i]![i]!; }
        let t1 = Infinity, k = -1;
        for (let j = 0; j < q; ++j) if (r[j]! > 0 && plus[j]! / r[j]! < t1) { t1 = plus[j]! / r[j]!; k = j; }
        let zn = 0, dd = 0;
        for (let i = 0; i < n; ++i) zn += z[i]! * np[i]!;
        for (let j = 0; j < n; ++j) dd += d[j]! * d[j]!;
        // z vanishes when n_p lies in the active rows' span: zn = |J2^T n_p|^2, against |J^T n_p|^2 at rounding.
        const t2 = zn > 1e-12 * dd ? -slack(p, x) / zn : Infinity;
        if (t1 === Infinity && t2 === Infinity) return "the step's rows are infeasible together";
        const t = Math.min(t1, t2);
        if (t2 !== Infinity) for (let i = 0; i < n; ++i) x[i]! += t * z[i]!;
        for (let j = 0; j < q; ++j) plus[j]! -= t * r[j]!;
        plus[q]! += t;
        if (t === t2) {
          // Take p: rotate d's tail into its q-th entry, which closes R's new column.
          for (let j = n - 1; j > q; --j) {
            const a: number = d[j - 1]!, b: number = d[j]!;
            if (b === 0) continue;
            const { c, s, h } = rotation(a, b);
            d[j - 1] = h; d[j] = 0;
            rotate(j - 1, j, c, s);
          }
          R.push(Array.from(d.subarray(0, q + 1)));
          active.push(p);
          inActive[p] = 1;
          u = plus;
          break;
        }
        drop(k, plus);
      }
    }
    // The polish: the final active rows' equality problem solved afresh, `S u = b + N^T H^-1 c` with `S = N^T H^-1 N` and
    // `x = H^-1 (N u - c)`, every `H^-1` a fresh block solve, so stationarity holds to rounding instead of the hundreds of rotations'
    // accumulated error (the arm's refit read 2.0e-7 after 404 of them). It is kept only when every multiplier stays non-negative.
    const solveH = (v: ArrayLike<number>): Float64Array => {
      const out = new Float64Array(n);
      for (const block of blocks) {
        const solved: number[] = solveFactored(block.factor, block.columns.map((i: number): number => v[i]!));
        block.columns.forEach((i: number, r: number): void => { out[i] = solved[r]!; });
      }
      return out;
    };
    const normals: Float64Array[] = active.map((q: number): Float64Array => {
      const v = new Float64Array(n), row = rows[sides[q]!.row]!;
      row.indices.forEach((i: number, k: number): void => { v[i]! += -sides[q]!.sign * row.weights[k]!; });
      return v;
    });
    let primal: number[] = Array.from(x);
    if (normals.length > 0) {
      const ys: Float64Array[] = normals.map(solveH), hc: Float64Array = solveH(linear);
      const inner = (a: ArrayLike<number>, b: ArrayLike<number>): number => { let sum = 0; for (let i = 0; i < n; ++i) sum += a[i]! * b[i]!; return sum; };
      const S: number[][] = normals.map((a): number[] => ys.map((y): number => inner(a, y)));
      const polished: number[] | null = solve(S, active.map((q: number, j: number): number => -sides[q]!.bound + inner(normals[j]!, hc)));
      if (polished !== null && polished.every((v: number): boolean => v >= -1e-12 * Math.max(1, ...polished.map(Math.abs)))) {
        const combined = new Float64Array(n);
        for (let i = 0; i < n; ++i) combined[i] = -linear[i]!;
        normals.forEach((v: Float64Array, j: number): void => { for (let i = 0; i < n; ++i) combined[i]! += polished[j]! * v[i]!; });
        const candidate: Float64Array = solveH(combined);
        // Kept only when every row still holds as the method's own point did: the polish solves the active rows alone.
        const worst = (v: ArrayLike<number>): number => sides.reduce((most, _, q): number => Math.max(most, -slack(q, v)), 0);
        if (worst(candidate) <= Math.max(worst(x), scale)) {
          primal = Array.from(candidate);
          u = polished.map((v: number): number => Math.max(0, v));
        }
      }
    }
    const dual: number[] = new Array<number>(rows.length).fill(0);
    active.forEach((q: number, j: number): void => { dual[sides[q]!.row]! += sides[q]!.sign * u[j]!; });
    return { primal, dual, iterations, warm: 0, working: active.length, blocks: blocks.length };
  }

  function solveFactored(A: readonly (readonly number[])[], b: readonly number[]): number[] {
    return backwardFactored(A, forwardFactored(A, b));
  }

  function forwardFactored(A: readonly (readonly number[])[], b: readonly number[]): number[] {
    const x = [...b];
    for (let i = 0; i < x.length; ++i) {
      let v = x[i]!;
      for (let k = 0; k < i; ++k) v -= A[i]![k]! * x[k]!;
      x[i] = v / A[i]![i]!;
    }
    return x;
  }

  function backwardFactored(A: readonly (readonly number[])[], b: readonly number[]): number[] {
    const x = [...b], n = x.length;
    for (let i: number = n - 1; i >= 0; --i) {
      let v: number = x[i]!;
      for (let k: number = i + 1; k < n; ++k) v -= A[k]![i]! * x[k]!;
      x[i] = v / A[i]![i]!;
    }
    return x;
  }
}
