import { AutoMovieMeshCourse, AutoMovieMeshExtract, type AutoMovieViewAxis, AutoMovieViewLoft, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

type V3 = [number, number, number];

/**
 * The direct path's one shared builder (owner's plan, step 1: conic lofting
 * from feature lines read off f1's own cuts, "only following coordinates"):
 * for every part, the same four stages.
 *
 * 1. Course: the caller's axis through her joint centres in her own world,
 *    each station's section plane the axis frame there (`IAxis.at`: origin,
 *    `u`, `v`, normal `v x u`).
 * 2. Cut and read: `AutoMovieMeshCourse.cut` cuts her mesh on every station's
 *    own plane, keeps the outer piece holding the course point, and reads its
 *    four extents and four conic quarter shoulders `rho = |M->S| / |M->A|`
 *    (`AutoMovieMeshCourse.read`; the engine section's weight `w = rho / (1 -
 *    rho)` puts its curve point at `w / (1 + w) = rho` along M->A). A cut
 *    with no holding loop, or a quarter outside `(0, 1)`, refuses the part
 *    with its station and quarter: a conic quarter cannot carry it, and no
 *    value is clamped, defaulted or interpolated across.
 * 3. Knots: each run reduced by `AutoMovieMeshExtract.reduce` within 0.5 mm.
 *    A shoulder error `d` moves its point by `d |M->A|`, so the shoulders'
 *    shared share tolerance is 0.5 mm over the LARGEST corner reach of the
 *    run. The reducer certifies its own cubic Hermite; the loft reads the
 *    knots through `AutoMovieViewOutline` (authored first jets, natural second
 *    derivatives, shared-jet quintics), a different interpolant. So every run
 *    is read back through that actual evaluator at every cut, its physical
 *    deviation measured (an extent directly, a shoulder times that station's
 *    own corner reach), and the worst sample over 0.5 mm pinned as a knot and
 *    the run reduced again until the actual curve holds.
 * 4. Loft: `IAutoMovieViewPart { axis, stations, front = +-u runs, side =
 *    +-v runs, fullness: top shoulders }` through `AutoMovieViewLoft.create`.
 *    A knot's slope enters as its jet's first derivative in the whole
 *    outline's normalized parameter, slope times the outline's knot span
 *    (`AutoMovieViewHermite` divides that jet by the same span). The declared
 *    stations include every knot, as generic girth sources require.
 *
 * Two readings report what the eight scalar runs cannot: each loft layer
 * standing on a cut station is compared with her loop there over the whole
 * loop (her loop point's radius minus the section's radius at the same
 * phase), and each cut's turn regularity is read from the axis's own analytic
 * jet when it has one (`kr`; unobserved without a jet). Neither is a
 * guarantee between the sampled stations.
 */
export namespace AutoMovieHumanF1Trace {
  /** One station's reading. */
  export interface ICut {
    /** Station, mm along the course. */
    station: number;

    /** Her holding loop, chart mm about the course point (`u`, `v`). */
    loop: [number, number][];

    /** Extents `+u`, `-u`, `+v`, `-v`, signed chart mm. */
    extents: [number, number, number, number];

    /** Where each extreme touches its support line off the course point's axis line, mm (`AutoMovieMeshCourse.IReading.touch`). */
    touch: [number, number, number, number];

    /** Quarter shoulders q0..q3 (between +u/+v, +v/-u, -u/-v, -v/+u), as read; null when the loop misses the quarter's segment. */
    shoulders: [number | null, number | null, number | null, number | null];

    /** Each quarter's |M->A|, mm. */
    reach: [number, number, number, number];

    /** The loop's unit Newell normal, world, or null for a zero-area loop. */
    normal: V3 | null;

    /** The loop's area centroid in its own plane, world mm, or null for a zero-area loop. */
    centroid: V3 | null;

    /** The loop's area, mm^2. */
    area: number;

    /**
     * The turn regularity at this station: the section reach times the
     * plane normal's turning rate over the origin's speed along that normal,
     * `r |n'| / (n . o')`, from the axis's analytic jet (independent of how
     * the stations are labelled). Neighbouring planes cross inside the
     * section where it reaches 1. Null when the axis has no jet there:
     * unobserved, not straight.
     */
    kr: number | null;

    /** The cut's own flags (open, bridged, unclosed), in full. */
    flags: string[];

    /** The family checks on this loop (jumps). */
    checks: string[];
  }

  /** One reduced run and its verification on the actual evaluator. */
  export interface IRun {
    /** `+u`, `-u`, `+v`, `-v` or `rho0`..`rho3`. */
    name: string;

    /** The knots: station, value, slope. */
    knots: [number, number, number][];

    /** The reducer's own error on its cubic Hermite, in the value's units. */
    reducer: number;

    /** The largest physical deviation of the loft's actual outline from the cuts, mm. */
    actual: number;

    /** Stations pinned because the actual outline left a cut by more than the tolerance. */
    pinned: number[];
  }

  /** One loft layer compared with her loop over the whole loop. */
  export interface ILayer {
    /** Station, mm. */
    station: number;

    /** The largest |her loop radius - section radius| at the same phase, mm. */
    max: number;

    /** Its mean over her loop's points, mm. */
    mean: number;

    /** The phase of the largest departure, radians from `+u` toward `+v`. */
    phase: number;

    /** Its signed value there, mm (positive: her loop stands outside the section). */
    signed: number;
  }

  /** The part, its cuts and its loft. */
  export interface IOutput {
    /** The view part, or null when a cut refuses it. */
    part: IAutoMovieViewPart | null;

    /** Every cut that holds a loop. */
    cuts: ICut[];

    /** Stations where no outer loop holds the course point. */
    dropped: number[];

    /** Every refusal, by station and quarter, then the loft's diagnostics. */
    diagnostics: string[];

    /** The reduced runs, empty when refused. */
    runs: IRun[];

    /** The loft's layers on cut stations against her loops, empty without sections. */
    layers: ILayer[];

    /** The loft, or null when refused. */
    loft: AutoMovieViewLoft.IResult | null;

    /** Stage times, milliseconds. */
    ms: Record<string, number>;
  }

  /** Inputs of one part. */
  export interface IInput {
    /** Chain name. */
    name: string;

    /** Her mesh, mm, in her own world. */
    mesh: AutoMovieMeshExtract.IMesh;

    /** The course. */
    axis: AutoMovieViewAxis.IAxis;

    /** Cut stations, mm, strictly increasing. */
    cuts: number[];

    /** Emitted layer stations, mm, strictly increasing within the cuts; every knot is added. */
    stations?: number[];

    /** Section control points (multiple of 4). */
    order: number;

    /** Ring samples. */
    samples: number;
  }

  /** The extraction tolerance, mm (the owner's 0.5 mm). */
  export const TOLERANCE: number = 0.5;

  /** Cut, read, reduce, verify and loft one part. */
  export function create(input: IInput): IOutput {
    const ms: Record<string, number> = {};
    let t: number = performance.now();
    const lap = (name: string): void => {
      const now: number = performance.now();
      ms[name] = now - t;
      t = now;
    };
    const sections: AutoMovieMeshCourse.ISection[] = AutoMovieMeshCourse.cut(input.mesh, input.cuts.map((s: number): AutoMovieMeshCourse.IPlane => plane(input.axis, s)), TOLERANCE);
    lap("cut");
    const cuts: ICut[] = [];
    const dropped: number[] = [];
    const diagnostics: string[] = [];
    for (const section of sections) {
      const c: ICut | null = cut(section, input.axis);
      if (c === null) {
        dropped.push(section.plane.station);
        diagnostics.push(`station ${section.plane.station} mm: no outer loop holds the course point (${section.pieces} outer pieces)`);
        continue;
      }
      cuts.push(c);
      c.shoulders.forEach((rho: number | null, q: number): void => {
        if (rho === null || !(rho > 0 && rho < 1)) diagnostics.push(`station ${c.station} mm: quarter ${q} shoulder ${rho === null ? "missing (the loop does not meet M->A)" : rho.toFixed(4)} outside (0, 1), |M->A| ${c.reach[q]!.toFixed(2)} mm`);
      });
      if (c.kr !== null && !(c.kr < 1)) diagnostics.push(`station ${c.station} mm: turn k r ${c.kr.toFixed(4)} not below 1`);
    }
    if (cuts.length < 2) diagnostics.push(`${cuts.length} of ${input.cuts.length} cuts hold a loop; a part needs two`);
    if (diagnostics.length !== 0) return { part: null, cuts, dropped, diagnostics, runs: [], layers: [], loft: null, ms };

    // Runs, each verified on the evaluator the loft reads it through.
    const runs: IRun[] = [];
    const reach: number = Math.max(...cuts.flatMap((c: ICut): number[] => c.reach));
    const outline = (name: string, values: number[], scale: (i: number) => number, tolerance: number): IAutoMovieViewPart.IOutline => {
      const dense: [number, number][] = cuts.map((c: ICut, i: number): [number, number] => [c.station, values[i]!]);
      const pins: number[] = [];
      for (;;) {
        const reduced: { knots: AutoMovieMeshExtract.IKnot[]; error: number } = AutoMovieMeshExtract.reduce(dense, tolerance, pins);
        const source: IAutoMovieViewPart.IOutline = knotted(name, reduced.knots);
        const actual: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(source);
        if ("contract" in actual) throw new Error(`${input.name} ${name}: the traced knots are refused by the outline evaluator: ${actual.detail}`);
        let worst: number = -1;
        let deviation: number = 0;
        dense.forEach(([s, v]: [number, number], i: number): void => {
          const read: number | string = AutoMovieViewOutline.value(actual, s);
          const d: number = typeof read === "string" ? Infinity : Math.abs(read - v) * scale(i);
          if (d > deviation) {
            deviation = d;
            worst = i;
          }
        });
        if (deviation <= TOLERANCE || pins.includes(worst)) {
          runs.push({ name, knots: reduced.knots.map((k: AutoMovieMeshExtract.IKnot): [number, number, number] => [k.s, k.value, k.slope]), reducer: reduced.error, actual: deviation, pinned: pins.map((i: number): number => dense[i]![0]) });
          return source;
        }
        pins.push(worst);
      }
    };
    const extent = (k: number, name: string): IAutoMovieViewPart.IOutline =>
      outline(
        name,
        cuts.map((c: ICut): number => c.extents[k]!),
        (): number => 1,
        TOLERANCE,
      );
    const shoulder = (q: number): IAutoMovieViewPart.IOutline =>
      outline(
        `rho${q}`,
        cuts.map((c: ICut): number => c.shoulders[q]!),
        (i: number): number => cuts[i]!.reach[q]!,
        TOLERANCE / reach,
      );
    const front: IAutoMovieViewPart.IPair = { positive: extent(0, "+u"), negative: extent(1, "-u") };
    const side: IAutoMovieViewPart.IPair = { positive: extent(2, "+v"), negative: extent(3, "-v") };
    const shoulders: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> = [shoulder(0), shoulder(1), shoulder(2), shoulder(3)];
    lap("reduce");
    const unverified: string[] = runs.filter((r: IRun): boolean => r.actual > TOLERANCE).map((r: IRun): string => `${r.name} ${r.actual.toFixed(3)} mm`);
    if (unverified.length !== 0) diagnostics.push(`runs whose actual outline still leaves a cut by more than ${TOLERANCE} mm with every offending sample pinned: ${unverified.join(", ")}`);

    // Layers: the requested stations plus every knot.
    const first: number = cuts[0]!.station;
    const last: number = cuts[cuts.length - 1]!.station;
    const knots: number[] = runs.flatMap((r: IRun): number[] => r.knots.map((k: [number, number, number]): number => k[0]));
    const stations: number[] = [...new Set([...(input.stations ?? cuts.map((c: ICut): number => c.station)), ...knots])].filter((s: number): boolean => s >= first && s <= last).sort((a: number, b: number): number => a - b);
    const part: IAutoMovieViewPart = { name: input.name, axis: input.axis, stations, front, side, fullness: { kind: "top", shoulders }, order: input.order, samples: input.samples };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    lap("loft");

    // Each layer on a cut station against her whole loop there.
    const byStation: Map<number, ICut> = new Map(cuts.map((c: ICut): [number, ICut] => [c.station, c]));
    const layers: ILayer[] = [];
    for (const st of loft.sections) {
      const c: ICut | undefined = byStation.get(st.station);
      if (c === undefined) continue;
      let max: number = 0;
      let sum: number = 0;
      let phase: number = 0;
      let signed: number = 0;
      for (const [a, b] of c.loop) {
        const phi: number = Math.atan2(b, a);
        const d: number = Math.hypot(a, b) - AutoMovieViewSection.radius(st.section, phi)[0];
        sum += Math.abs(d);
        if (Math.abs(d) > max) {
          max = Math.abs(d);
          phase = phi;
          signed = d;
        }
      }
      layers.push({ station: st.station, max, mean: sum / c.loop.length, phase, signed });
    }
    lap("layers");
    return { part, cuts, dropped, diagnostics: [...diagnostics, ...loft.diagnostics.map((d: { contract: string; detail: string }): string => `loft ${d.contract}: ${d.detail}`)], runs, layers, loft, ms };
  }

  /**
   * One cut on the axis frame's plane at a station: the loop holding the
   * course point and its readings, or null when no outer loop holds it.
   */
  export function read(mesh: AutoMovieMeshExtract.IMesh, axis: AutoMovieViewAxis.IAxis, station: number): ICut | null {
    return cut(AutoMovieMeshCourse.cut(mesh, [plane(axis, station)], TOLERANCE)[0]!, axis);
  }

  /** The course plane at a station. */
  function plane(axis: AutoMovieViewAxis.IAxis, station: number): AutoMovieMeshCourse.IPlane {
    const f: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(station);
    return { station, origin: [f.origin[0]!, f.origin[1]!, f.origin[2]!], u: [f.u[0]!, f.u[1]!, f.u[2]!], v: [f.v[0]!, f.v[1]!, f.v[2]!] };
  }

  /** A section's reading as a cut, or null without a holding loop. */
  function cut(section: AutoMovieMeshCourse.ISection, axis: AutoMovieViewAxis.IAxis): ICut | null {
    const r: AutoMovieMeshCourse.IReading | null = section.reading;
    const area: number | null = section.area;
    const reach: number | null = section.reach;
    if (r === null || section.loop === null || typeof area !== "number" || typeof reach !== "number") return null;
    return {
      station: section.plane.station,
      loop: section.loop,
      extents: r.extents,
      touch: r.touch,
      shoulders: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number | null => q.rho) as ICut["shoulders"],
      reach: r.quarters.map((q: AutoMovieMeshCourse.IQuarter): number => q.reach) as ICut["reach"],
      normal: section.normal,
      centroid: section.centroid,
      area,
      kr: turn(axis, section.plane.station, reach),
      flags: section.flags,
      checks: section.checks,
    };
  }

  /**
   * `r |n'| / (n . o')` at a station from the axis's analytic jet: the plane
   * normal `n = v x u` turns at `|n'|` per unit of the axis parameter while
   * the origin advances along it at `n . o'`, so a neighbouring plane meets
   * this one at the distance `(n . o') / |n'|` from the course point
   * (first order); a section reaching `r` is crossed where the ratio reaches
   * 1. For planes normal to a circle of radius R it is `r / R`, the classic
   * `k r`. Null without a jet, Infinity where the origin does not advance.
   */
  function turn(axis: AutoMovieViewAxis.IAxis, station: number, reach: number): number | null {
    const jet: ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> | undefined = axis.jet?.(station);
    if (jet === null || jet === undefined) return null;
    const n: V3 = cross(jet.value.v, jet.value.u);
    const dn: V3 = add(cross(jet.first.v, jet.value.u), cross(jet.value.v, jet.first.u));
    const speed: number = n[0] * jet.first.origin[0]! + n[1] * jet.first.origin[1]! + n[2] * jet.first.origin[2]!;
    const rate: number = Math.hypot(...dn);
    if (rate === 0) return 0;
    return speed > 0 ? (reach * rate) / speed : Infinity;
  }

  /** Reduced knots as a source outline: each slope as the first jet in the whole outline's normalized parameter. */
  function knotted(name: string, knots: readonly AutoMovieMeshExtract.IKnot[]): IAutoMovieViewPart.IOutline {
    const span: number = knots[knots.length - 1]!.s - knots[0]!.s;
    return { knots: knots.map((k: AutoMovieMeshExtract.IKnot): IAutoMovieViewPart.IKnot => ({ site: `${name}@${k.s.toFixed(2)}`, station: k.s, value: k.value, jet: { first: k.slope * span, second: null } })) };
  }

  /** a x b. */
  function cross(a: readonly number[], b: readonly number[]): V3 {
    return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  }

  /** a + b. */
  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
}
