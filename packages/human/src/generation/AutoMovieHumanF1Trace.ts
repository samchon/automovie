import { type AutoMovieLoftFrame, AutoMovieMeshExtract, type AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";

/**
 * The direct path's one shared builder (owner's plan, step 1: conic lofting
 * from feature lines read off f1's own cuts, "only following coordinates"):
 * for every part, the same four steps.
 *
 * 1. Cut: at each station, `AutoMovieMeshExtract.outline` on the course's
 *    section plane (the axis frame's normal `v x u`), keeping the outer loop
 *    that holds the axis point (the part's own body, not a neighbour's).
 * 2. Read: the four extents `+u`, `-u`, `+v`, `-v` of that loop, and the four
 *    quarter shoulders as the standard conic rho `|M->S| / |M->A|`: M the
 *    midpoint of the quarter's chord between its two guide points (the box
 *    touch points `(+-u, 0)` and `(0, +-v)`, `AutoMovieViewSection`: each
 *    rational quarter touches its support lines there), A the box corner (the
 *    two tangents' intersection), S her loop's outermost crossing of the
 *    segment M->A. The engine's shoulder is the same rho: its weight
 *    `w = r / (1 - r)` is the rational quadratic's middle weight, whose curve
 *    point on M->A sits at `w / (1 + w) = r` of the way from M to A.
 * 3. Knots: each run of values over the stations reduced by
 *    `AutoMovieMeshExtract.reduce` (cubic Hermite knots: station, value,
 *    slope). Tolerance 0.5 mm for extents; for shoulders the same 0.5 mm
 *    measured along M->A, i.e. 0.5 / |M->A| in share, taken at the station's
 *    smallest |M->A| (the strictest), so a shoulder knot never moves her loop
 *    point by more than 0.5 mm.
 * 4. Loft: `IAutoMovieViewPart { axis, stations, front = +-u runs, side = +-v
 *    runs, fullness: top shoulders }` through `AutoMovieViewLoft.create`.
 *    Each knot's slope enters as its outline jet's first derivative in the
 *    outline's normalized parameter (slope times the knot span length, the
 *    chain rule for `t = (s - s0) / (s1 - s0)`); second derivatives stay
 *    natural.
 */
export namespace AutoMovieHumanF1Trace {
  /** One station's reading. */
  export interface ICut {
    /** Station, mm along the course. */
    station: number;

    /** Extents `+u`, `-u`, `+v`, `-v`, signed chart mm. */
    extents: [number, number, number, number];

    /** Quarter shoulders q0..q3 (between +u/+v, +v/-u, -u/-v, -v/+u). */
    shoulders: [number, number, number, number];

    /** The quarter's |M->A| per quarter, mm. */
    reach: [number, number, number, number];

    /** Outline flags of the cut (open, bridged, jump). */
    flags: string[];
  }

  /** The part, its cuts and its loft. */
  export interface IOutput {
    /** The view part. */
    part: IAutoMovieViewPart;

    /** Every kept cut. */
    cuts: ICut[];

    /** Stations where no outer loop held the axis point (dropped). */
    dropped: number[];

    /** The reduced runs: name to (station, value, slope) knots. */
    table: Record<string, [number, number, number][]>;

    /** The loft. */
    loft: AutoMovieViewLoft.IResult;
  }

  /** Inputs of one part. */
  export interface IInput {
    /** Chain name. */
    name: string;

    /** Her mesh, mm, in the body's world. */
    mesh: AutoMovieMeshExtract.IMesh;

    /** The course. */
    axis: AutoMovieViewAxis.IAxis;

    /** Cut stations, mm, strictly increasing. */
    cuts: number[];

    /** Emitted layer stations, mm, strictly increasing within the kept cuts. */
    stations?: number[];

    /** Section control points (multiple of 4). */
    order: number;

    /** Ring samples. */
    samples: number;

    /** Keep only loop points with |u| and |v| under this reach, mm (a neighbour's limb crossing the plane far out), or none. */
    clip?: number;
  }

  /** The extents' tolerance, mm (the brief's 0.5 mm). */
  export const TOLERANCE: number = 0.5;

  /** Cut, read, reduce and loft one part. */
  export function create(input: IInput): IOutput {
    const cuts: ICut[] = [];
    const dropped: number[] = [];
    for (const s of input.cuts) {
      const cut: ICut | null = read(input.mesh, input.axis.at(s), s, input.clip);
      if (cut === null) dropped.push(s);
      else cuts.push(cut);
    }
    const table: Record<string, [number, number, number][]> = {};
    const run = (name: string, values: number[], tolerance: number): IAutoMovieViewPart.IOutline => {
      const dense: [number, number][] = cuts.map((c: ICut, i: number): [number, number] => [c.station, values[i]!]);
      const knots: AutoMovieMeshExtract.IKnot[] = AutoMovieMeshExtract.reduce(dense, tolerance).knots;
      table[name] = knots.map((k: AutoMovieMeshExtract.IKnot): [number, number, number] => [k.s, k.value, k.slope]);
      const span: number = knots[knots.length - 1]!.s - knots[0]!.s;
      return { knots: knots.map((k: AutoMovieMeshExtract.IKnot): IAutoMovieViewPart.IKnot => ({ site: `${name}@${k.s.toFixed(2)}`, station: k.s, value: k.value, jet: { first: k.slope * span, second: null } })) };
    };
    const minReach: number = Math.min(...cuts.flatMap((c: ICut): number[] => c.reach));
    const rhoTol: number = TOLERANCE / Math.max(minReach, 1);
    const shoulder = (q: number): IAutoMovieViewPart.IOutline =>
      run(
        `rho${q}`,
        cuts.map((c: ICut): number => c.shoulders[q]!),
        rhoTol,
      );
    const first: number = cuts[0]!.station;
    const last: number = cuts[cuts.length - 1]!.station;
    const part: IAutoMovieViewPart = {
      name: input.name,
      axis: input.axis,
      stations: (input.stations ?? cuts.map((c: ICut): number => c.station)).filter((s: number): boolean => s >= first && s <= last),
      front: { positive: run("+u", cuts.map((c: ICut): number => c.extents[0]), TOLERANCE), negative: run("-u", cuts.map((c: ICut): number => c.extents[1]), TOLERANCE) },
      side: { positive: run("+v", cuts.map((c: ICut): number => c.extents[2]), TOLERANCE), negative: run("-v", cuts.map((c: ICut): number => c.extents[3]), TOLERANCE) },
      fullness: { kind: "top", shoulders: [shoulder(0), shoulder(1), shoulder(2), shoulder(3)] },
      order: input.order,
      samples: input.samples,
    };
    return { part, cuts, dropped, table, loft: AutoMovieViewLoft.create(part) };
  }

  /**
   * One cut on the frame's plane: the loop holding the axis point, its
   * extents and shoulders, or null when no outer loop holds it.
   */
  export function read(mesh: AutoMovieMeshExtract.IMesh, frame: AutoMovieLoftFrame.IFrame, station: number, clip?: number): ICut | null {
    type V3 = [number, number, number];
    const u: V3 = [frame.u[0]!, frame.u[1]!, frame.u[2]!];
    const v: V3 = [frame.v[0]!, frame.v[1]!, frame.v[2]!];
    // The station axis n = v x u (AutoMovieLoftFrame's advance); outline's
    // in-plane axes for axis index 0 are axes[1], axes[2] = (u, v) when
    // axes = [n, u, v] (n = v x u, u, v is right-handed: u x v = -n? the
    // order only names a and b, the crossing points are the same plane).
    const n: V3 = [v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]];
    const origin: V3 = [frame.origin[0]!, frame.origin[1]!, frame.origin[2]!];
    const section: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline(mesh, { origin, axes: [n, u, v] }, [0], 0, TOLERANCE)[0]!;
    // a = u, b = v (axis 0's next two in cyclic order).
    let loop: [number, number][] | null = null;
    for (const l of section.outer) if (inside(l.points, 0, 0)) {
      loop = l.points;
      break;
    }
    if (loop === null) return null;
    if (clip !== undefined) loop = loop.filter((p: [number, number]): boolean => Math.abs(p[0]) < clip && Math.abs(p[1]) < clip);
    const us: number[] = loop.map((p: [number, number]): number => p[0]);
    const vs: number[] = loop.map((p: [number, number]): number => p[1]);
    const extents: [number, number, number, number] = [Math.max(...us), Math.min(...us), Math.max(...vs), Math.min(...vs)];
    const guides: [number, number][] = [
      [extents[0], 0],
      [0, extents[2]],
      [extents[1], 0],
      [0, extents[3]],
    ];
    const shoulders: [number, number, number, number] = [0, 0, 0, 0];
    const reach: [number, number, number, number] = [0, 0, 0, 0];
    for (let q: number = 0; q < 4; ++q) {
      const g0: [number, number] = guides[q]!;
      const g1: [number, number] = guides[(q + 1) % 4]!;
      const M: [number, number] = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
      const A: [number, number] = [g0[0] + g1[0], g0[1] + g1[1]];
      reach[q] = Math.hypot(A[0] - M[0], A[1] - M[1]);
      shoulders[q] = crossing(loop, M, A);
    }
    return { station, extents, shoulders, reach, flags: section.flags };
  }

  /** Even-odd point in polygon. */
  function inside(poly: readonly [number, number][], x: number, y: number): boolean {
    let c: boolean = false;
    for (let i: number = 0, j: number = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  /**
   * The outermost crossing of the closed polyline with the segment M->A, as
   * the share t in [0, 1] from M; when the loop does not cross the segment
   * (it bulges past A, impossible for a box corner, or stays inside M on a
   * concave flank) the nearest bound, 0.02 or 0.98, keeping the conic
   * admissible (a shoulder must stay strictly between chord and corner).
   */
  function crossing(poly: readonly [number, number][], M: [number, number], A: [number, number]): number {
    const d: [number, number] = [A[0] - M[0], A[1] - M[1]];
    let best: number = -Infinity;
    for (let i: number = 0; i < poly.length; ++i) {
      const p: [number, number] = poly[i]!;
      const q: [number, number] = poly[(i + 1) % poly.length]!;
      const e: [number, number] = [q[0] - p[0], q[1] - p[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (Math.abs(den) < 1e-12) continue;
      const w: [number, number] = [p[0] - M[0], p[1] - M[1]];
      const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
      const s: number = (w[0] * d[1] - w[1] * d[0]) / den;
      if (s >= 0 && s <= 1 && t > best) best = t;
    }
    if (!Number.isFinite(best)) return 0.5;
    return Math.min(0.98, Math.max(0.02, best));
  }
}
