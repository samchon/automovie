import { AutoMovieIllinois, type AutoMovieLoftContract, AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieConstructionView } from "@automovie/interface";

/**
 * The trunk base's fullness at a tape site whose tape wraps the merged skin:
 * the chest tape over the breasts, the hip tape over the gluteal masses
 * (ISO 8559-1 5.3.4 and 5.3.13). A tape bridges every concavity, so it reads
 * the convex hull of the level cut through the union of the base and its
 * masses; the base's common conic shoulder there is the root that puts that
 * hull's perimeter at the tape (#3047).
 *
 * The source cut at height y contains the base's original section and the
 * masses' original side curves. The actual straight AP declaration has
 * world-Y up and a constant axis height equal to this site. Its horizontal
 * cut is therefore exactly the two +/-v source loci, including the pole;
 * no intermediate loft or final skin supplies the cut. Each edge contributes
 * its named/scalar-critical points and 64 station intervals, while the base
 * retains 512 angular samples. Their polygon hull perimeter is a numerical
 * approximation, not an exact continuous-tape or final-merge certificate.
 * Unsupported charts or another cutting level retain a source diagnostic.
 *
 * The perimeter rises with the base's shoulder (the base's section grows
 * outward and the masses stay), so the root is bracketed by the base box's
 * valid shoulder range; a tape outside the reach keeps the reach's end and
 * one diagnostic, as the operator's own solve does.
 */
export namespace AutoMovieHumanTrunkTape {
  /** A mass at the site. */
  export interface IMass {
    /** Identical original source, calibration mm. */
    part: IAutoMovieViewPart;
    /** Its actual production declaration, used to admit the fixed AP chart. */
    view: IAutoMovieConstructionView;
  }

  /** What the solve reads. */
  export interface IInput {
    /** Producer and site, for the diagnostic. */
    producer: string;

    /** Height of the site, mm. */
    y: number;

    /** The axis's origin there `[x, z]`, mm: the base's section is about it, `u` +X and `v` +Z. */
    origin: [number, number];

    /** The base's box at the site. */
    box: AutoMovieViewSection.IBox;

    /** The original masses whose common-level side cuts the tape also wraps. */
    masses: IMass[];

    /** The tape, mm. */
    tape: number;
  }

  /** Phases read on the base's section and on each mass. */
  export const PHASES: number = 512;

  /** The solved shoulder and its diagnostics. */
  export interface IResult {
    /** The base's common shoulder, or null when its source/reach/root is not admitted. */
    shoulder: number | null;

    /** One diagnostic for a tape outside the reach or a box without a valid section. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Solve the base's shoulder at the site.
   *
   * @param input The site, the base's box, the masses and the tape.
   * @returns The shoulder and the diagnostics.
   */
  export function solve(input: IInput): IResult {
    const reach: AutoMovieViewSection.IRange | null = AutoMovieViewSection.range(input.box);
    if (reach === null)
      return { shoulder: null, diagnostics: [{ producer: input.producer, level: 2, contract: "tape", detail: `the box [${input.box.extents.join(", ")}] mm admits no valid section` }] };

    // At the common AP-axis level, the exact cut loci are the original side
    // curves. Their sampled hull remains an approximation, not a skin read.
    const cuts: [number, number][] = [];
    for (const mass of input.masses) {
      const points: [number, number][] | string = cut(mass, input.y);
      if (typeof points === "string") return { shoulder: null, diagnostics: [{ producer: input.producer, level: 2, contract: "source tape cut", detail: points }] };
      cuts.push(...points);
    }
    const perimeter = (r: number): number => {
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of(input.box, [r, r, r, r]);
      const points: [number, number][] = Array.from({ length: PHASES }, (_: unknown, i: number): [number, number] => {
        const phi: number = (2 * Math.PI * i) / PHASES;
        const rho: number = AutoMovieViewSection.radius(section, phi)[0];
        return [input.origin[0] + rho * Math.cos(phi), input.origin[1] + rho * Math.sin(phi)];
      });
      return hull([...points, ...cuts]);
    };

    const [lo, hi] = reach.shoulder;
    const low: number = perimeter(lo);
    const high: number = perimeter(hi);
    if (![low, high, input.tape].every(Number.isFinite)) return { shoulder: null, diagnostics: [{ producer: input.producer, level: 2, contract: "source tape reach", detail: `nonfinite sampled-hull reach [${low}, ${high}] or tape ${input.tape} mm at ${input.y} mm` }] };
    const outside = (end: number, girth: number): IResult => ({
      shoulder: end,
      diagnostics: [{ producer: input.producer, level: 2, contract: "tape", detail: `the tape ${input.tape} mm lies outside the merged skin's reach [${low}, ${high}] mm at ${input.y} mm; the base keeps the shoulder ${end} (girth ${girth} mm)` }],
    });
    if (input.tape <= low) return outside(lo, low);
    if (input.tape >= high) return outside(hi, high);
    const r: number | null = AutoMovieIllinois.root((s: number): number => perimeter(s) - input.tape, lo, hi, 1e-6, 100);
    const residual: number = r === null ? NaN : perimeter(r) - input.tape;
    if (r === null || !Number.isFinite(r) || !Number.isFinite(residual) || Math.abs(residual) > 1e-6) return { shoulder: null, diagnostics: [{ producer: input.producer, level: 2, contract: "source tape root", detail: `sampled-hull shoulder ${r} has residual ${residual} mm against tape ${input.tape} mm at ${input.y} mm; the bounded root estimate is not accepted as convergence` }] };
    return { shoulder: r, diagnostics: [] };
  }

  /**
   * A mass's central level cut from its original side curves. The actual
   * straight AP declaration and world-Y up prove that this level intersects
   * each source section on its +/-v guides; no loft surface or phase search
   * supplies these points. A changed plane is refused, not silently omitted.
   *
   * @param mass The mass.
   * @param y The height, mm.
   * @returns Original-curve samples `[x,z]`, mm, or the unsupported premise.
   */
  function cut(mass: IMass, y: number): [number, number][] | string {
    const out: [number, number][] = [];
    const axis: IAutoMovieConstructionView["axis"] = mass.view.axis;
    if (axis.type !== "straight" || axis.u.x !== 0 || axis.u.y !== 1 || axis.u.z !== 0 || axis.v.x !== 0 || axis.v.y !== 0 || Math.abs(axis.v.z) !== 1 || Math.abs(axis.origin.y * 1000 - y) > ON_PLANE) return `${mass.part.name}: tape needs the actual fixed AP chart at the common generating level`;
    const prepared: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(mass.part);
    if (prepared.diagnostics.length !== 0) return `${mass.part.name}: ${JSON.stringify(prepared.diagnostics)}`;
    for (const curve of prepared.curves) {
      if (!curve.name.startsWith("side.")) continue;
      if (curve.outline === null) return `${mass.part.name}: unavailable original tape edge ${curve.name}`;
      const [s0, s1]: readonly [number, number] = curve.outline.domain;
      const stations: Set<number> = new Set([...curve.outline.knots.map((knot: IAutoMovieViewPart.IKnot): number => knot.station), ...AutoMovieViewOutline.criticalStations(curve.outline)]);
      for (let sample: number = 0; sample <= LINE_SAMPLES; sample++) stations.add(s0 + (s1 - s0) * sample / LINE_SAMPLES);
      for (const station of stations) {
        const point: AutoMovieViewCurves.IReading | string = AutoMovieViewCurves.at(curve, mass.part.axis, station);
        if (typeof point === "string") return `${mass.part.name}: ${point}`;
        out.push([point.point[0], point.point[2]]);
      }
    }
    return out;
  }

  /** Intervals along each original mass side edge; the resulting hull is sampled, not a continuous perimeter certificate. */
  const LINE_SAMPLES: number = 64;

  /** Height off the plane under which a sample lies on it, mm. */
  const ON_PLANE: number = 1e-6;

  /**
   * The perimeter of a point set's convex hull (Andrew's monotone chain).
   *
   * @param points The points `[x, z]`.
   * @returns The hull's perimeter, mm.
   */
  function hull(points: readonly [number, number][]): number {
    const sorted: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    const turn = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (list: [number, number][]): [number, number][] => {
      const out: [number, number][] = [];
      for (const p of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    const h: [number, number][] = [...half(sorted), ...half([...sorted].reverse())];
    let length: number = 0;
    for (let i: number = 0; i < h.length; i++) {
      const a: [number, number] = h[i]!;
      const b: [number, number] = h[(i + 1) % h.length]!;
      length += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return length;
  }
}
