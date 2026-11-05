import { AutoMovieIllinois, type AutoMovieLoftContract, AutoMovieViewSection, type IAutoMovieSolidSurface } from "@automovie/engine";

/**
 * The trunk base's fullness at a tape site whose tape wraps the merged skin:
 * the chest tape over the breasts, the hip tape over the gluteal masses
 * (ISO 8559-1 5.3.4 and 5.3.13). A tape bridges every concavity, so it reads
 * the convex hull of the level cut through the union of the base and its
 * masses; the base's common conic shoulder there is the root that puts that
 * hull's perimeter at the tape (#3047).
 *
 * The cut of the union at height `y` is the base's section there (its box and
 * shoulder, `AutoMovieViewSection`) and each mass's own level cut. A mass
 * is lofted along its host's normal, so its level cut is no chain section:
 * each of its station lines is sampled, every sign change of
 * `p_y(s, phi) - y` is refined by the Illinois rule, and every sample on the
 * plane is kept (a level mass cut at its own centre's height has whole
 * station lines and its apex in the plane); a line that never reaches `y`
 * adds no point. Only the convex hull's perimeter is read, so a mass point inside the
 * base's section leaves it unchanged; the hull of curve points sampled this
 * densely falls short of the true hull's perimeter by about
 * `L h^2 kappa^2 / 24` (`h` the spacing, `kappa` the curvature), under 0.01 mm
 * at the trunk's sizes. The union's merge blends are not in the cut: they
 * lie in the folds, inside the hull.
 *
 * The perimeter rises with the base's shoulder (the base's section grows
 * outward and the masses stay), so the root is bracketed by the base box's
 * valid shoulder range; a tape outside the reach keeps the reach's end and
 * one diagnostic, as the operator's own solve does.
 */
export namespace AutoMovieHumanTrunkTape {
  /** A mass at the site. */
  export interface IMass {
    /** Its surface, `u` its station, `v` its phase. */
    surface: IAutoMovieSolidSurface;

    /** Its first and last station, mm. */
    stations: [number, number];
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

    /** The masses whose level cuts the tape also wraps. */
    masses: IMass[];

    /** The tape, mm. */
    tape: number;
  }

  /** Phases read on the base's section and on each mass. */
  export const PHASES: number = 512;

  /** The solved shoulder and its diagnostics. */
  export interface IResult {
    /** The base's common shoulder, or null when the box admits none. */
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

    // The masses' cuts do not change with the base's shoulder: read them once.
    const cuts: [number, number][] = input.masses.flatMap((m: IMass): [number, number][] => cut(m, input.y));
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
    const outside = (end: number, girth: number): IResult => ({
      shoulder: end,
      diagnostics: [{ producer: input.producer, level: 2, contract: "tape", detail: `the tape ${input.tape} mm lies outside the merged skin's reach [${low}, ${high}] mm at ${input.y} mm; the base keeps the shoulder ${end} (girth ${girth} mm)` }],
    });
    if (input.tape <= low) return outside(lo, low);
    if (input.tape >= high) return outside(hi, high);
    const r: number | null = AutoMovieIllinois.root((s: number): number => perimeter(s) - input.tape, lo, hi, 1e-6, 100);
    return r === null ? outside(lo, low) : { shoulder: r, diagnostics: [] };
  }

  /**
   * A mass's level cut at a height: on each phase, the station where its
   * surface stands at that height, by the Illinois rule along the station
   * line.
   *
   * @param mass The mass.
   * @param y The height, mm.
   * @returns The cut's points `[x, z]`, mm.
   */
  function cut(mass: IMass, y: number): [number, number][] {
    const out: [number, number][] = [];
    const [s0, s1] = mass.stations;
    const point = (s: number, phi: number): [number, number] => {
      const p: readonly number[] = mass.surface.jet(s, phi).p;
      return [p[0]!, p[2]!];
    };
    // Every station line's samples, read station by station so a station's
    // part of the surface jet serves all its phases: `[x, y, z]` per sample.
    const samples: Float64Array = new Float64Array(3 * (LINE_SAMPLES + 1) * PHASES);
    for (let k: number = 0; k <= LINE_SAMPLES; k++) {
      const s: number = k === 0 ? s0 : s0 + ((s1 - s0) * k) / LINE_SAMPLES;
      for (let i: number = 0; i < PHASES; i++) {
        const p: readonly number[] = mass.surface.jet(s, (2 * Math.PI * i) / PHASES).p;
        samples.set([p[0]!, p[1]!, p[2]!], 3 * (k * PHASES + i));
      }
    }
    for (let i: number = 0; i < PHASES; i++) {
      const phi: number = (2 * Math.PI * i) / PHASES;
      const height = (s: number): number => mass.surface.jet(s, phi).p[1] - y;
      const at = (k: number): number => 3 * (k * PHASES + i);

      // A station line may cross the plane more than once, or lie in it (a
      // mass whose axis is level, cut at its own centre's height), and the
      // apex's pole stands on it: sample the line, refine every sign change,
      // and keep every sample that lies on the plane.
      let a: number = s0;
      let fa: number = samples[at(0) + 1]! - y;
      if (Math.abs(fa) <= ON_PLANE) out.push([samples[at(0)]!, samples[at(0) + 2]!]);
      for (let k: number = 1; k <= LINE_SAMPLES; k++) {
        const b: number = s0 + ((s1 - s0) * k) / LINE_SAMPLES;
        const fb: number = samples[at(k) + 1]! - y;
        if (Math.abs(fb) <= ON_PLANE) out.push([samples[at(k)]!, samples[at(k) + 2]!]);
        else if (fa * fb < 0 && Math.abs(fa) > ON_PLANE) {
          const s: number | null = AutoMovieIllinois.root(height, a, b, 1e-6, 100);
          if (s !== null) out.push(point(s, phi));
        }
        a = b;
        fa = fb;
      }
    }
    return out;
  }

  /** Samples along each mass station line for its crossings. */
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
